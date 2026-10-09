import { createFileRoute } from "@tanstack/react-router";

import {
  configErrorResponse,
  getAdmin,
  json,
  requireMember,
  requireOrgAdmin,
} from "@/lib/inbox/server/admin";
import { createOrgUser, resetUserPassword } from "@/lib/inbox/server/users";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Equipe da empresa (só dono/administrador).
 *  POST  {email, fullName, access}        cria uma pessoa (senha temporária devolvida uma vez). Só o dono cria administradores.
 *  PATCH {userId, active?, access?, resetPassword?}  ativa/desativa, muda o nível ou gera nova senha temporária.
 * A empresa vem SEMPRE do login, nunca do pedido: ninguém mexe em gente de outra empresa.
 */
export const Route = createFileRoute("/api/inbox/team")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const denied = requireOrgAdmin(who);
          if (denied) return denied;
          const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!b || typeof b["email"] !== "string" || typeof b["fullName"] !== "string")
            return json({ error: "Informe nome e e-mail.", code: "bad_request" }, 400);
          const access = b["access"] === "admin" ? "admin" : "agent";
          if (access === "admin" && who.member.access !== "owner")
            return json({ error: "Só o dono cria administradores.", code: "forbidden" }, 403);
          const r = await createOrgUser(admin, who.orgId, {
            email: b["email"],
            fullName: b["fullName"],
            access,
          });
          if (!r.ok)
            return json({ error: r.error, code: r.code }, r.code === "email_exists" ? 409 : 400);
          return json({ ok: true, userId: r.userId, email: r.email, tempPassword: r.tempPassword });
        } catch (e) {
          return fail(e);
        }
      },
      PATCH: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const denied = requireOrgAdmin(who);
          if (denied) return denied;
          const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!b || typeof b["userId"] !== "string" || !UUID.test(b["userId"]))
            return json({ error: "Pedido inválido.", code: "bad_request" }, 400);
          const target = await admin
            .from("profiles")
            .select("id, access, active")
            .eq("id", b["userId"])
            .eq("org_id", who.orgId)
            .maybeSingle();
          if (target.error) return json({ error: "Erro ao ler a pessoa.", code: "db_error" }, 503);
          if (!target.data)
            return json({ error: "Pessoa não encontrada nesta empresa.", code: "not_found" }, 404);
          if (target.data.access === "owner" && who.member.access !== "owner")
            return json({ error: "Só o dono mexe no acesso do dono.", code: "forbidden" }, 403);
          const self = target.data.id === who.userId;

          if (b["resetPassword"] === true) {
            const r = await resetUserPassword(admin, target.data.id);
            if (!r.ok) return json({ error: r.error, code: "auth_error" }, 502);
            return json({ ok: true, tempPassword: r.tempPassword });
          }
          const patch: { active?: boolean; access?: string } = {};
          if (typeof b["active"] === "boolean") {
            if (self && b["active"] === false)
              return json(
                { error: "Você não pode desativar o próprio acesso.", code: "forbidden" },
                400,
              );
            patch.active = b["active"];
          }
          if (b["access"] === "admin" || b["access"] === "agent") {
            if (who.member.access !== "owner")
              return json({ error: "Só o dono muda o nível de acesso.", code: "forbidden" }, 403);
            if (target.data.access === "owner")
              return json({ error: "O nível do dono não muda aqui.", code: "forbidden" }, 400);
            patch.access = b["access"];
          }
          if (Object.keys(patch).length === 0)
            return json({ error: "Nada para alterar.", code: "bad_request" }, 400);
          if (patch.active === true && target.data.active === false) {
            const org = await admin
              .from("organizations")
              .select("max_users")
              .eq("id", who.orgId)
              .single();
            const used = await admin
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("org_id", who.orgId)
              .eq("active", true);
            if (!org.error && !used.error && (used.count ?? 0) >= org.data.max_users)
              return json(
                { error: "O plano está no limite de pessoas ativas.", code: "user_limit" },
                400,
              );
          }
          const up = await admin
            .from("profiles")
            .update(patch)
            .eq("id", target.data.id)
            .eq("org_id", who.orgId);
          if (up.error) return json({ error: "Não foi possível salvar.", code: "db_error" }, 503);
          return json({ ok: true });
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});

function fail(e: unknown): Response {
  const cfg = configErrorResponse(e);
  if (cfg) return cfg;
  console.error("[inbox-team]", (e as { message?: string })?.message);
  return json({ error: "Erro interno. Tente de novo.", code: "internal" }, 500);
}
