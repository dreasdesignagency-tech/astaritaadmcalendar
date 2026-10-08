import { db } from "@/lib/inbox/api";
import { InboxUserError } from "@/lib/inbox/errors";
import type { TablesUpdate } from "@/lib/inbox/database.types";
import { reopenedStatus, statusAfterAssign } from "@/lib/inbox/status";
import type { ConversationRow, ConversationStatus, MessageRow } from "@/lib/inbox/types";

const CONFLICT =
  "Esta conversa foi alterada por outra pessoa agora há pouco. Atualizei a tela, confira e tente de novo.";

/** Últimas mensagens da conversa, da mais antiga para a mais nova. */
export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await db
    .from("messages")
    .select(
      "id, conversation_id, direction, type, body, media_mime, status, error_message, sent_by, reply_to_id, media_path, wa_media_id, created_at",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return ((data ?? []) as MessageRow[]).reverse();
}

/**
 * Atualiza a conversa só se ninguém mexeu nela desde que a tela carregou (controle por updated_at).
 * Evita que duas pessoas sobrescrevam uma à outra sem perceber.
 */
async function guardedUpdate(row: ConversationRow, patch: TablesUpdate<"conversations">) {
  const { data, error } = await db
    .from("conversations")
    .update(patch)
    .eq("id", row.id)
    .eq("updated_at", row.updated_at)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new InboxUserError(CONFLICT);
}

export function resolveConversation(row: ConversationRow) {
  return guardedUpdate(row, { status: "resolved" satisfies ConversationStatus });
}

export function reopenConversation(row: ConversationRow) {
  return guardedUpdate(row, { status: reopenedStatus(row.assigned_to) });
}

export function assignConversation(row: ConversationRow, assigneeId: string | null) {
  return guardedUpdate(row, {
    assigned_to: assigneeId,
    status: statusAfterAssign(row.status, assigneeId),
  });
}

/** Zera o contador de não lidas. Falha em silêncio: não vale atrapalhar quem está lendo. */
export async function markConversationRead(conversationId: string) {
  await db
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", conversationId)
    .gt("unread_count", 0);
}
