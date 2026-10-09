/**
 * Criptografia dos segredos de cada empresa (token e App Secret do WhatsApp) guardados no banco.
 * AES-256-GCM com Web Crypto (roda em Node e em Workers). A chave vem de INBOX_SECRETS_KEY (32 bytes em base64) e
 * existe só no servidor: quem lê o banco sem a chave vê apenas texto cifrado. Formato: v1.<iv>.<cifrado>, tudo em base64.
 */
const te = new TextEncoder();
const td = new TextDecoder();

const toB64 = (b: Uint8Array) => {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
};
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export type KeyCheck = { ok: true } | { ok: false; reason: string };

/** Confere o formato da chave (nunca devolve o valor). */
export function checkSecretsKey(raw: string | undefined): KeyCheck {
  if (!raw) return { ok: false, reason: "ausente" };
  try {
    return fromB64(raw.trim()).length === 32
      ? { ok: true }
      : { ok: false, reason: "precisa ter 32 bytes em base64" };
  } catch {
    return { ok: false, reason: "não é base64 válido" };
  }
}

async function importKey(raw: string): Promise<CryptoKey> {
  const chk = checkSecretsKey(raw);
  if (!chk.ok) throw new Error(`INBOX_SECRETS_KEY ${chk.reason}`);
  return crypto.subtle.importKey("raw", fromB64(raw.trim()), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(plain: string, keyB64: string): Promise<string> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(plain)),
  );
  return `v1.${toB64(iv)}.${toB64(ct)}`;
}

/** Devolve null se o texto estiver corrompido ou a chave for outra (nunca lança com dados do usuário). */
export async function decryptSecret(token: string, keyB64: string): Promise<string | null> {
  try {
    const [v, iv, ct] = token.split(".");
    if (v !== "v1" || !iv || !ct) return null;
    const key = await importKey(keyB64);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, key, fromB64(ct));
    return td.decode(pt);
  } catch {
    return null;
  }
}

/** Texto aleatório em hexadecimal (verify token, chave do webhook). */
export function randomHex(bytes: number): string {
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Senha temporária legível, sem caracteres que se confundem (0/O, 1/l). */
export function tempPassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const out: string[] = [];
  const rnd = crypto.getRandomValues(new Uint8Array(length));
  for (const b of rnd) out.push(chars[b % chars.length] as string);
  return `${out.join("")}9!`;
}
