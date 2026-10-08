import { createFileRoute } from "@tanstack/react-router";

import { configErrorResponse, getAdmin, json, requireMember } from "@/lib/inbox/server/admin";
import { getMediaUrl } from "@/lib/inbox/server/whatsapp-service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Link assinado, de curta duração, para ver o anexo de uma mensagem. Só membros ativos. */
export const Route = createFileRoute("/api/inbox/media")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const body = (await request.json().catch(() => null)) as { messageId?: unknown } | null;
          if (!body || typeof body.messageId !== "string" || !UUID.test(body.messageId))
            return json({ error: "Pedido inválido.", code: "bad_request" }, 400);
          const res = await getMediaUrl(admin, body.messageId);
          return json(res.body, res.status);
        } catch (e) {
          const cfg = configErrorResponse(e);
          if (cfg) return cfg;
          console.error("[inbox-media]", (e as { message?: string })?.message);
          return json({ error: "Erro interno.", code: "internal" }, 500);
        }
      },
    },
  },
});
