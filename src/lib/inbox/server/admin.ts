import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/inbox/database.types";
import { supabaseServerEnv } from "@/lib/inbox/server/env";

/**
 * Cliente administrativo (service role) do projeto Supabase do INBOX. Ignora a RLS: só pode ser usado em código de
 * servidor (rotas de API), depois de autenticar quem pede. Jamais importar este arquivo no frontend.
 */
export type AdminClient = SupabaseClient<Database>;

export class ServerConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Servidor do Inbox sem configuração: ${missing.join(", ")}`);
  }
}

/** Chaves novas do Supabase (sb_secret_...) são opacas e não podem ir como Bearer; só no cabeçalho apikey. */
function fetchFor(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (key.startsWith("sb_secret_") && headers.get("Authorization") === `Bearer ${key}`)
      headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

let cached: AdminClient | undefined;
let cachedFor = "";

export function getAdmin(): AdminClient {
  const cfg = supabaseServerEnv();
  if (!cfg.ok) throw new ServerConfigError(cfg.missing);
  const id = `${cfg.url}|${cfg.serviceKey.length}`;
  if (cached && cachedFor === id) return cached;
  cached = createClient<Database>(cfg.url, cfg.serviceKey, {
    global: { fetch: fetchFor(cfg.serviceKey) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedFor = id;
  return cached;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Quem está fazendo o pedido, já com a empresa (nunca vem do corpo do pedido: vem do banco, pelo token). */
export type Member = {
  userId: string;
  orgId: string;
  orgName: string;
  access: "owner" | "admin" | "agent";
  isPlatformAdmin: boolean;
};

/** Exige um membro ATIVO de uma empresa ATIVA, pelo token do Supabase do Inbox (Authorization: Bearer). */
export async function requireMember(
  request: Request,
  admin: AdminClient,
): Promise<
  { ok: true; member: Member; userId: string; orgId: string } | { ok: false; res: Response }
> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token)
    return {
      ok: false,
      res: json({ error: "Faça login no Inbox para continuar.", code: "unauthenticated" }, 401),
    };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user)
    return {
      ok: false,
      res: json(
        { error: "Sua sessão expirou. Entre de novo no Inbox.", code: "unauthenticated" },
        401,
      ),
    };

  const profile = await admin
    .from("profiles")
    .select("id, active, org_id, access, is_platform_admin, org:organizations!inner(name, status)")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile.error)
    return {
      ok: false,
      res: json(
        {
          error: "Não foi possível verificar seu acesso. Tente de novo.",
          code: "profile_check_failed",
        },
        503,
      ),
    };
  const p = profile.data;
  if (!p || !p.active)
    return {
      ok: false,
      res: json({ error: "Esta conta não tem acesso ao Inbox.", code: "forbidden" }, 403),
    };
  const org = p.org as unknown as { name: string; status: string };
  if (org.status !== "active")
    return {
      ok: false,
      res: json(
        {
          error: "O acesso desta empresa está suspenso. Fale com o suporte.",
          code: "org_suspended",
        },
        403,
      ),
    };
  const access = p.access === "owner" || p.access === "admin" ? p.access : "agent";
  const member: Member = {
    userId: p.id,
    orgId: p.org_id,
    orgName: org.name,
    access,
    isPlatformAdmin: p.is_platform_admin === true,
  };
  return { ok: true, member, userId: p.id, orgId: p.org_id };
}

/** Só dono ou administrador da empresa. */
export function requireOrgAdmin(
  r: Extract<Awaited<ReturnType<typeof requireMember>>, { ok: true }>,
): Response | null {
  if (r.member.access === "owner" || r.member.access === "admin") return null;
  return json({ error: "Só o administrador da empresa pode fazer isso.", code: "forbidden" }, 403);
}

/** Só o dono da plataforma (você, vendedor do sistema). */
export function requirePlatformAdmin(
  r: Extract<Awaited<ReturnType<typeof requireMember>>, { ok: true }>,
): Response | null {
  if (r.member.isPlatformAdmin) return null;
  return json({ error: "Acesso restrito ao dono da plataforma.", code: "forbidden" }, 403);
}

/** Resposta padrão quando o servidor não tem a configuração mínima do Supabase do Inbox. */
export function configErrorResponse(e: unknown): Response | null {
  if (e instanceof ServerConfigError)
    return json(
      {
        error: "O servidor do Inbox ainda não está configurado.",
        code: "server_not_configured",
        missing: e.missing,
      },
      503,
    );
  return null;
}
