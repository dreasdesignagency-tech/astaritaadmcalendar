import { createFileRoute } from "@tanstack/react-router";

import {
  configErrorResponse,
  getAdmin,
  json,
  requireMember,
  requireOrgAdmin,
} from "@/lib/inbox/server/admin";
import { loadOrgWhatsApp, saveOrgWhatsApp, SecretsKeyError } from "@/lib/inbox/server/org";
import { forgetChannelCache, channelStatus } from "@/lib/inbox/server/whatsapp-service";

/**
 * Conexão do WhatsApp da empresa de quem está logado (só dono/administrador).
 *  GET : devolve o que a pessoa precisa copiar para a Meta (chave do webhook e verify token) e QUAIS campos já estão salvos.
 *        Token e App Secret NUNCA voltam: depois de salvos, ficam só no servidor.
 *  POST: salva os campos informados (ausente = mantém) e já confere com a Meta.
 */
export const Route = createFileRoute("/api/inbox/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const denied = requireOrgAdmin(who);
          if (denied) return denied;
          const wa = await loadOrgWhatsApp(admin, who.orgId);
          return json({
            ok: true,
            webhookKey: wa?.webhookKey ?? null,
            verifyToken: wa?.creds.verifyToken ?? null,
            phoneNumberId: wa?.creds.phoneNumberId ?? null,
            version: wa?.creds.version ?? null,
            hasToken: !!wa?.creds.token,
            hasAppSecret: !!wa?.creds.appSecret,
          });
        } catch (e) {
          return fail(e);
        }
      },
      POST: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const denied = requireOrgAdmin(who);
          if (denied) return denied;
          const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!body || typeof body !== "object")
            return json({ error: "Pedido inválido.", code: "bad_request" }, 400);
          const r = await saveOrgWhatsApp(admin, who.orgId, {
            phoneNumberId: body["phoneNumberId"],
            version: body["version"],
            token: body["token"],
            appSecret: body["appSecret"],
          });
          if (!r.ok)
            return json(
              { error: r.error, code: r.code, field: r.field },
              r.code === "phone_in_use" ? 409 : 400,
            );
          forgetChannelCache(who.orgId);
          const status = await channelStatus(admin, who.orgId);
          return json({ ok: true, status });
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});

function fail(e: unknown): Response {
  if (e instanceof SecretsKeyError)
    return json(
      {
        error: "O servidor ainda não tem a chave que protege as credenciais.",
        code: "server_not_configured",
        missing: ["INBOX_SECRETS_KEY"],
      },
      503,
    );
  const cfg = configErrorResponse(e);
  if (cfg) return cfg;
  console.error("[inbox-whatsapp]", (e as { message?: string })?.message);
  return json({ error: "Erro interno. Tente de novo.", code: "internal" }, 500);
}
