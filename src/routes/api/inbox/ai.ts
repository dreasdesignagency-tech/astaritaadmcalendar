import { createFileRoute } from "@tanstack/react-router";

import { configErrorResponse, getAdmin, json, requireMember } from "@/lib/inbox/server/admin";
import { generateSuggestion, isAiKind } from "@/lib/inbox/server/ai-service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Assistente Astarita. Gera uma SUGESTÃO de texto; nunca envia mensagem ao cliente.
 * Exige login do Inbox. A chave da IA fica só no servidor.
 */
export const Route = createFileRoute("/api/inbox/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const body = (await request.json().catch(() => null)) as {
            conversationId?: unknown;
            kind?: unknown;
            text?: unknown;
          } | null;
          if (
            !body ||
            typeof body.conversationId !== "string" ||
            !UUID.test(body.conversationId) ||
            !isAiKind(body.kind) ||
            (body.text !== undefined && typeof body.text !== "string")
          )
            return json({ error: "Pedido inválido.", code: "bad_request" }, 400);
          const res = await generateSuggestion(admin, {
            userId: who.userId,
            conversationId: body.conversationId,
            kind: body.kind,
            ...(typeof body.text === "string" ? { text: body.text } : {}),
          });
          return json(res.body, res.status);
        } catch (e) {
          const cfg = configErrorResponse(e);
          if (cfg) return cfg;
          console.error("[inbox-ai]", (e as { message?: string })?.message);
          return json({ error: "Erro interno. Tente de novo.", code: "internal" }, 500);
        }
      },
    },
  },
});
