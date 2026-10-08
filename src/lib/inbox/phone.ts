/**
 * Telefones no Inbox ficam no formato que a Meta usa: só dígitos, com DDI, sem "+"
 * (ex.: 5511999998888). Este arquivo não importa nada de propósito, para ser testado
 * sozinho e reaproveitado pelo webhook na Fase 4.
 */

/** Devolve o número normalizado ou null se não parecer um telefone válido. */
export function normalizePhone(input: string): string | null {
  const international = input.trim().startsWith("+"); // com "+", o DDI já está no número
  let digits = input.replace(/\D/g, "").replace(/^0+/, "");
  if (!international && (digits.length === 10 || digits.length === 11)) digits = `55${digits}`; // DDD + número, sem DDI
  if (digits.length < 8 || digits.length > 15) return null;
  if (digits.startsWith("55") && digits.length !== 12 && digits.length !== 13) return null;
  return digits;
}

/**
 * Celulares brasileiros chegam ora com o nono dígito (13 dígitos), ora sem (12).
 * Para não duplicar contatos, a busca por duplicidade usa as duas formas.
 */
export function phoneVariants(normalized: string): string[] {
  if (normalized.startsWith("55") && normalized.length === 13 && normalized[4] === "9") {
    return [normalized, normalized.slice(0, 4) + normalized.slice(5)];
  }
  if (
    normalized.startsWith("55") &&
    normalized.length === 12 &&
    /[6-9]/.test(normalized[4] ?? "")
  ) {
    return [normalized, normalized.slice(0, 4) + "9" + normalized.slice(4)];
  }
  return [normalized];
}

/** Mostra 5511999998888 como +55 (11) 99999-8888. Outros países ficam com "+" e dígitos. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  if (phone.startsWith("55") && (phone.length === 12 || phone.length === 13)) {
    const ddd = phone.slice(2, 4);
    const rest = phone.slice(4);
    const split = rest.length - 4;
    return `+55 (${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
  }
  return `+${phone}`;
}

/** "@usuario", "instagram.com/usuario/" ou "usuario" viram "@usuario". Vazio vira null. */
export function normalizeInstagram(input: string): string | null {
  const handle = input
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "");
  return handle ? `@${handle}` : null;
}
