import { createFileRoute } from "@tanstack/react-router";

import { configErrorResponse, getAdmin, json } from "@/lib/inbox/server/admin";
import { findByWebhookKey } from "@/lib/inbox/server/org";
import { checkVerification } from "@/lib/inbox/server/whatsapp-core";
import { handleWebhookPost } from "@/lib/inbox/server/whatsapp-service";

/**
 * Webhook da WhatsApp Business Platform (Cloud API oficial), UM ENDEREÇO POR EMPRESA:
 *   /api/whatsapp/webhook/<chave aleatória da empresa>
 *  GET  : verificação da Meta (hub.mode, hub.verify_token, hub.challenge), com o verify token DESTA empresa.
 *  POST : eventos (mensagens, status, ecos). A assinatura X-Hub-Signature-256 é validada com o App Secret DESTA empresa,
 *         sobre o corpo bruto, e o evento precisa ser do número cadastrado nela.
 * Rota pública de propósito (a Meta não tem login): a segurança é a chave no endereço, o verify token e a assinatura.
 * Chave desconhecida ou verificação errada respondem igual (403/404), para não revelar quais empresas existem.
 */
export const Route = createFileRoute("/api/whatsapp/webhook/$key")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const org = await findByWebhookKey(getAdmin(), params.key);
          const v = checkVerification(
            new URL(request.url).searchParams,
            org?.creds.verifyToken ?? undefined,
          );
          if (!org || !v.ok) return new Response("forbidden", { status: 403 });
          return new Response(v.challenge, {
            status: 200,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        } catch (e) {
          void configErrorResponse;
          return new Response("forbidden", { status: 403 });
        }
      },
      POST: async ({ request, params }) => {
        try {
          const admin = getAdmin();
          const org = await findByWebhookKey(admin, params.key);
          if (!org) return json({ error: "não encontrado" }, 404);
          const raw = await request.text(); // corpo bruto: a assinatura é calculada sobre os bytes originais
          const res = await handleWebhookPost(
            admin,
            org,
            raw,
            request.headers.get("x-hub-signature-256"),
          );
          return json(res.body, res.status);
        } catch (e) {
          const cfg = configErrorResponse(e);
          if (cfg) return cfg;
          console.error("[whatsapp-webhook]", (e as { message?: string })?.message);
          return json({ error: "erro interno" }, 500);
        }
      },
    },
  },
});
