import { db } from "@/lib/inbox/client";
import { inboxApi, type ApiResult } from "@/lib/inbox/messaging";

/** Ações do Assistente Astarita. A IA só sugere texto: quem envia é sempre a pessoa. */
export type AiKind = "suggest" | "natural" | "shorter" | "professional" | "warmer" | "summary";

export const AI_ACTIONS: { kind: AiKind; label: string; needsText: boolean }[] = [
  { kind: "suggest", label: "Sugerir resposta", needsText: false },
  { kind: "natural", label: "Mais natural", needsText: true },
  { kind: "shorter", label: "Mais curta", needsText: true },
  { kind: "professional", label: "Mais profissional", needsText: true },
  { kind: "warmer", label: "Mais acolhedora", needsText: true },
  { kind: "summary", label: "Resumir conversa", needsText: false },
];

export async function requestAi(p: {
  conversationId: string;
  kind: AiKind;
  text?: string;
}): Promise<ApiResult<{ id: string | null; content: string; kind: AiKind }>> {
  return inboxApi<{ id: string | null; content: string; kind: AiKind }>("/api/inbox/ai", p);
}

/** Registra que a sugestão foi usada (vai para o campo de resposta; o envio continua manual). */
export async function markSuggestionUsed(id: string): Promise<void> {
  await db.from("ai_suggestions").update({ used: true }).eq("id", id);
}
