/**
 * Normaliza uma resposta para comparação:
 * ignora maiúsculas, acentos, pontuação e espaços extras.
 * Datas como "1/1/2024", "01-01-2024" ou "01012024" viram "01/01/2024".
 */
export function normalize(value: string): string {
  const t = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

  const spaced = t.match(/^(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{2,4})$/);
  const compact = t.match(/^(\d{2})(\d{2})(\d{4})$/);
  const m = spaced ?? compact;
  if (m) return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;

  return t
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrect(input: string, accepted: string[]): boolean {
  const n = normalize(input);
  if (!n) return false;
  return accepted.some((a) => normalize(a) === n);
}
