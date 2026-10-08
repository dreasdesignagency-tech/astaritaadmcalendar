/** Regras de status da conversa, sem dependências para poderem ser testadas sozinhas. */
export type ConvStatus = "waiting" | "in_progress" | "resolved";

/** Ao reabrir: quem já tem responsável volta "em atendimento"; sem responsável, "aguardando". */
export function reopenedStatus(assignedTo: string | null): ConvStatus {
  return assignedTo ? "in_progress" : "waiting";
}

/**
 * Ao atribuir um responsável a uma conversa que aguardava resposta, ela passa a "em atendimento".
 * Conversas resolvidas continuam resolvidas; remover o responsável não muda o status.
 */
export function statusAfterAssign(current: ConvStatus, newAssignee: string | null): ConvStatus {
  if (current === "waiting" && newAssignee) return "in_progress";
  return current;
}
