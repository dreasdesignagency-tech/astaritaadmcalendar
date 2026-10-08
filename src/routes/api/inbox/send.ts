import { createFileRoute } from "@tanstack/react-router";

import { configErrorResponse, getAdmin, json, requireMember } from "@/lib/inbox/server/admin";
import { sendMessage, type SendInput } from "@/lib/inbox/server/whatsapp-service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readTemplate(v: unknown): SendInput["template"] | "invalid" {
  if (v === undefined || v === null) return null;
  if (typeof v !== "object") return "invalid";
  const t = v as { name?: unknown; language?: unknown; variables?: unknown };
  const name = typeof t.name === "string" ? t.name.trim() : "";
  const language = typeof t.language === "string" ? t.language.trim() : "";
  const vars = Array.isArray(t.variables) ? t.variables : [];
  if (!/^[a-z0-9_]{1,512}$/.test(name) || !/^[a-z]{2,3}(_[A-Za-z]{2,4})?$/.test(language))
    return "invalid";
  if (vars.length > 20 || vars.some((x) => typeof x !== "string" || x.length > 1024))
    return "invalid";
  return { name, language, variables: vars as string[] };
}

/** Envia (ou reenvia) uma mensagem já gravada como `pending` pelo próprio usuário. Exige login do Inbox. */
export const Route = createFileRoute("/api/inbox/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const body = (await request.json().catch(() => null)) as {
            messageId?: unknown;
            retry?: unknown;
            template?: unknown;
          } | null;
          if (!body || typeof body.messageId !== "string" || !UUID.test(body.messageId))
            return json({ error: "Pedido inválido.", code: "bad_request" }, 400);
          const template = readTemplate(body.template);
          if (template === "invalid")
            return json({ error: "Dados do modelo inválidos.", code: "bad_request" }, 400);
          const res = await sendMessage(admin, {
            userId: who.userId,
            messageId: body.messageId,
            retry: body.retry === true,
            template,
          });
          return json(res.body, res.status);
        } catch (e) {
          const cfg = configErrorResponse(e);
          if (cfg) return cfg;
          console.error("[inbox-send]", (e as { message?: string })?.message);
          return json({ error: "Erro interno ao enviar. Tente de novo.", code: "internal" }, 500);
        }
      },
    },
  },
});
