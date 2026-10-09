/**
 * Configuração do projeto Supabase exclusivo do Inbox.
 *
 * Função pura (sem imports) para ser testada sozinha. As variáveis têm prefixo próprio
 * (VITE_INBOX_*) de propósito: o calendário continua usando VITE_SUPABASE_*, e as duas
 * configurações nunca se misturam.
 */
export type InboxConfigEnv = {
  inboxUrl?: string | undefined;
  inboxKey?: string | undefined;
  /** URL do projeto do calendário, só para impedir que o Inbox aponte para ela por engano. */
  calendarUrl?: string | undefined;
};

export type InboxConfig =
  | { ok: true; url: string; key: string }
  | { ok: false; reason: "missing"; missing: string[] }
  | { ok: false; reason: "invalid"; message: string };

export const INBOX_URL_VAR = "VITE_INBOX_SUPABASE_URL";
export const INBOX_KEY_VAR = "VITE_INBOX_SUPABASE_PUBLISHABLE_KEY";

/** Detecta chave de serviço (secreta) para nunca deixá-la chegar ao navegador. */
function looksLikeSecretKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;
  const parts = key.split(".");
  if (parts.length === 3 && parts[1]) {
    try {
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="))) as {
        role?: string;
      };
      return payload.role === "service_role";
    } catch {
      return false;
    }
  }
  return false;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

export function readInboxConfig(env: InboxConfigEnv): InboxConfig {
  const url = env.inboxUrl?.trim() ?? "";
  const key = env.inboxKey?.trim() ?? "";

  const missing = [!url && INBOX_URL_VAR, !key && INBOX_KEY_VAR].filter((v): v is string => !!v);
  if (missing.length) return { ok: false, reason: "missing", missing };

  const host = hostOf(url);
  if (!host)
    return { ok: false, reason: "invalid", message: `${INBOX_URL_VAR} não é uma URL válida.` };

  const local = host.startsWith("127.0.0.1") || host.startsWith("localhost");
  if (!local && !url.startsWith("https://")) {
    return {
      ok: false,
      reason: "invalid",
      message: `${INBOX_URL_VAR} precisa começar com https://.`,
    };
  }

  if (looksLikeSecretKey(key)) {
    return {
      ok: false,
      reason: "invalid",
      message: `${INBOX_KEY_VAR} contém uma chave secreta (service role). Use somente a chave publicável (anon/publishable).`,
    };
  }

  const calendarHost = env.calendarUrl ? hostOf(env.calendarUrl) : null;
  if (calendarHost && calendarHost === host) {
    return {
      ok: false,
      reason: "invalid",
      message: `${INBOX_URL_VAR} aponta para o mesmo projeto do calendário. O Inbox usa um projeto Supabase próprio.`,
    };
  }

  return { ok: true, url: url.replace(/\/+$/, ""), key };
}

/**
 * Valores PÚBLICOS do projeto Astarita Inbox. A URL e a chave publicável (sb_publishable_) são feitas para ir no navegador
 * de qualquer usuário; quem protege os dados é a RLS. Usados só em build de produção, quando as variáveis não foram definidas.
 * Nunca colocar aqui a service role.
 */
export const PUBLIC_INBOX_PROJECT = {
  url: "https://yappbzpayqejqpkfebho.supabase.co",
  key: "sb_publishable_hexMlR3tMeRXkupSt8qZrQ_c9RYQbJl",
} as const;
