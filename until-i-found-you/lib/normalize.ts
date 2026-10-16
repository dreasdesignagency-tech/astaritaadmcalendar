/**
 * Normaliza uma resposta para comparação:
 * ignora maiúsculas, acentos, pontuação e espaços extras.
 * Datas como "1/1/24", "01-01-2024" ou "01012024" viram "01/01/2024".
 */
export function normalize(value: string): string {
  const t = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

  const dm = t.match(/^(\d{1,2})\s*[/.\-]\s*(\d{1,2})(?:\s*[/.\-]\s*(\d{2}|\d{4}))?$/);
  const compact = t.match(/^(\d{2})(\d{2})(\d{4})$/);
  const m = dm ?? compact;
  if (m) {
    const day = m[1]!.padStart(2, "0");
    const month = m[2]!.padStart(2, "0");
    const year = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : "";
    return year ? `${day}/${month}/${year}` : `${day}/${month}`;
  }

  return t
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrect(input: string, accepted: string[]): boolean {
  const n = normalize(input);
  if (!n) return false;
  return accepted.some((a) => {
    const na = normalize(a);
    if (na === n) return true;
    // resposta cadastrada só com dia/mês (DD/MM) aceita qualquer ano digitado
    return /^\d{2}\/\d{2}$/.test(na) && n.startsWith(`${na}/`);
  });
}
