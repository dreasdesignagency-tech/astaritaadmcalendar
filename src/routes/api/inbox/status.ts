import { createFileRoute } from "@tanstack/react-router";

import { configErrorResponse, getAdmin, json, requireMember } from "@/lib/inbox/server/admin";
import { channelStatus } from "@/lib/inbox/server/whatsapp-service";

/** Estado real dos canais (WhatsApp e IA) para a interface. Só nomes de variáveis que faltam, nunca valores. */
export const Route = createFileRoute("/api/inbox/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          return json({ ok: true, status: await channelStatus(admin) });
        } catch (e) {
          const cfg = configErrorResponse(e);
          if (cfg) return cfg;
          console.error("[inbox-status]", (e as { message?: string })?.message);
          return json({ error: "Erro interno.", code: "internal" }, 500);
        }
      },
    },
  },
});
