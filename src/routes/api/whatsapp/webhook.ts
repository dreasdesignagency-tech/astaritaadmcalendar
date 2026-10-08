import { createFileRoute } from "@tanstack/react-router";

import { configErrorResponse, getAdmin, json } from "@/lib/inbox/server/admin";
import { env } from "@/lib/inbox/server/env";
import { checkVerification } from "@/lib/inbox/server/whatsapp-core";
import { handleWebhookPost } from "@/lib/inbox/server/whatsapp-service";

/**
 * Webhook da WhatsApp Business Platform (Cloud API oficial).
 *  GET  : verificação da Meta (hub.mode, hub.verify_token, hub.challenge).
 *  POST : eventos (mensagens, status, ecos). A assinatura X-Hub-Signature-256 é validada sobre o corpo bruto.
 * Esta rota é pública de propósito (a Meta não tem login): a segurança é a assinatura e o verify token.
 */
export const Route = createFileRoute("/api/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const v = checkVerification(
          new URL(request.url).searchParams,
          env("WHATSAPP_VERIFY_TOKEN"),
        );
        if (!v.ok) return new Response("forbidden", { status: 403 });
        return new Response(v.challenge, {
          status: 200,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
      POST: async ({ request }) => {
        try {
          const raw = await request.text(); // corpo bruto: a assinatura é calculada sobre os bytes originais
          const res = await handleWebhookPost(
            getAdmin(),
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
