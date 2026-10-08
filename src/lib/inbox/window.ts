/**
 * Janela de atendimento da Meta (WhatsApp Business Platform): mensagens livres só podem ser enviadas
 * até 24 horas depois da última mensagem RECEBIDA do cliente. Depois disso, só modelos aprovados.
 * Sem imports, para ser testada sozinha. O servidor aplica a mesma regra (a tela só avisa).
 */
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type WindowState = { open: boolean; closesAt: Date | null; msLeft: number };

export function windowState(
  lastInboundAt: string | null | undefined,
  now: number = Date.now(),
): WindowState {
  if (!lastInboundAt) return { open: false, closesAt: null, msLeft: 0 };
  const start = Date.parse(lastInboundAt);
  if (Number.isNaN(start)) return { open: false, closesAt: null, msLeft: 0 };
  const closes = start + SERVICE_WINDOW_MS;
  return { open: now < closes, closesAt: new Date(closes), msLeft: Math.max(0, closes - now) };
}

/** "faltam 3 h 20 min" / "faltam 12 min" */
export function formatTimeLeft(msLeft: number): string {
  const totalMin = Math.floor(msLeft / 60000);
  if (totalMin <= 0) return "menos de 1 min";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
