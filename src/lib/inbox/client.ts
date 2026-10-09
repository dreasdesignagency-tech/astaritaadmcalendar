import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/inbox/database.types";
import { readInboxConfig, type InboxConfig } from "@/lib/inbox/config";

/**
 * Cliente Supabase exclusivo do Inbox.
 *
 * - Variáveis próprias (VITE_INBOX_*), lidas só aqui.
 * - Criado sob demanda, na primeira vez que o Inbox é usado. Quem abre só o calendário nunca o cria,
 *   então a falta destas variáveis não afeta o calendário.
 * - Sessão guardada em localStorage com chave própria. Não usa o armazenamento intermediado do
 *   calendário (que repassa a sessão ao editor do Lovable) e nunca lê a sessão do calendário.
 * - Não importa nada de @/integrations/supabase: os dois mundos ficam separados.
 */
export const INBOX_STORAGE_KEY = "astarita-inbox-auth";

/**
 * Valores PÚBLICOS do projeto Astarita Inbox, usados só em build de produção quando as variáveis VITE_INBOX_* não foram
 * definidas na hospedagem. A URL e a chave publicável (sb_publishable_) são feitas para ir no navegador de qualquer usuário;
 * quem protege os dados é a RLS. Nunca colocar aqui a service role. Em desenvolvimento e nos testes não há fallback.
 */
const PUBLIC_FALLBACK = {
  url: "https://yappbzpayqejqpkfebho.supabase.co",
  key: "sb_publishable_hexMlR3tMeRXkupSt8qZrQ_c9RYQbJl",
};

export function getInboxConfig(): InboxConfig {
  const prod = import.meta.env.PROD === true;
  return readInboxConfig({
    inboxUrl:
      (import.meta.env["VITE_INBOX_SUPABASE_URL"] as string | undefined) ||
      (prod ? PUBLIC_FALLBACK.url : undefined),
    inboxKey:
      (import.meta.env["VITE_INBOX_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ||
      (prod ? PUBLIC_FALLBACK.key : undefined),
    calendarUrl: import.meta.env["VITE_SUPABASE_URL"] as string | undefined,
  });
}

export class InboxNotConfiguredError extends Error {
  constructor(public readonly config: Exclude<InboxConfig, { ok: true }>) {
    super("Inbox não configurado");
  }
}

export type InboxClient = SupabaseClient<Database>;

let client: InboxClient | undefined;

export function getInboxClient(): InboxClient {
  if (client) return client;
  const config = getInboxConfig();
  if (!config.ok) throw new InboxNotConfiguredError(config);

  client = createClient<Database>(config.url, config.key, {
    auth: {
      storageKey: INBOX_STORAGE_KEY,
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
      // Convite e recuperação de senha chegam por link com token na URL.
      detectSessionInUrl: true,
    },
  });
  return client;
}

/** Atalho para consultas: resolve o cliente só quando alguma consulta de fato roda. */
export const db: InboxClient = new Proxy({} as InboxClient, {
  get(_, prop, receiver) {
    return Reflect.get(getInboxClient(), prop, receiver);
  },
});
