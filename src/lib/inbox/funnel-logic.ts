/** Ordem dos cartões do funil. Sem imports, para ser testada sozinha. */
export type CardLike = { id: string; stage_id: string; position: number };

/** Cartões de uma etapa, na ordem exibida. */
export function cardsOfStage<T extends CardLike>(cards: T[], stageId: string): T[] {
  return cards.filter((c) => c.stage_id === stageId).sort((a, b) => a.position - b.position);
}

/**
 * Posição para soltar um cartão no índice `index` de uma etapa, entre os vizinhos (sem renumerar a coluna inteira).
 * `column` é a coluna SEM o cartão que está sendo movido.
 */
export function dropPosition(column: { position: number }[], index: number): number {
  const sorted = [...column].sort((a, b) => a.position - b.position);
  const i = Math.max(0, Math.min(index, sorted.length));
  const before = sorted[i - 1]?.position;
  const after = sorted[i]?.position;
  if (before === undefined && after === undefined) return 1;
  if (before === undefined) return (after as number) - 1;
  if (after === undefined) return before + 1;
  return (before + after) / 2;
}

/** Número de dias desde a última interação (para destacar oportunidades paradas). */
export function daysSince(iso: string | null | undefined, now: number = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.floor((now - t) / 86_400_000);
}
