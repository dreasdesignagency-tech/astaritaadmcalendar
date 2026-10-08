/**
 * Respostas rápidas aceitam {nome} (primeiro nome do contato). O texto continua editável antes de enviar.
 * Sem imports, para ser testada sozinha.
 */
export function firstName(fullName: string | null | undefined): string {
  const t = (fullName ?? "").trim();
  if (!t || t.startsWith("+") || /^\d/.test(t)) return ""; // contato só com telefone: não há nome
  return t.split(/\s+/)[0] ?? "";
}

export function renderQuickReply(body: string, contactName: string | null | undefined): string {
  const name = firstName(contactName);
  // Sem nome conhecido, remove o marcador e a vírgula/espaço que o acompanham ("Oi, {nome}!" -> "Oi!").
  const withName = body.replace(/\{nome\}/gi, name);
  if (name) return withName;
  return withName
    .replace(/\s*,\s*(?=[!.?]|$)/g, "")
    .replace(/[ \t]+([!.?,])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

export const QUICK_REPLY_CATEGORIES = [
  "primeiro_contato",
  "apresentacao",
  "servicos",
  "google_meet",
  "propostas",
  "acompanhamento",
  "agradecimento",
] as const;
export type QuickReplyCategory = (typeof QUICK_REPLY_CATEGORIES)[number];

export const QUICK_REPLY_LABEL: Record<QuickReplyCategory, string> = {
  primeiro_contato: "Primeiro contato",
  apresentacao: "Apresentação",
  servicos: "Serviços",
  google_meet: "Google Meet",
  propostas: "Propostas",
  acompanhamento: "Acompanhamento",
  agradecimento: "Agradecimento",
};
