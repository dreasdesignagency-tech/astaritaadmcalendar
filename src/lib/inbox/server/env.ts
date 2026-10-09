import { PUBLIC_INBOX_PROJECT } from "@/lib/inbox/config";

/**
 * Leitura de variáveis de ambiente NO SERVIDOR. Nada daqui vai para o navegador.
 * Nunca registrar valores em logs: use só os nomes (ver `missing`).
 */
export function env(name: string): string | undefined {
  const fromProcess = typeof process !== "undefined" ? process.env[name] : undefined;
  const fromVite = (import.meta.env as Record<string, string | undefined>)[name];
  const v = (fromProcess ?? fromVite ?? "").trim();
  return v === "" ? undefined : v;
}

export const graphBase = () =>
  (env("WHATSAPP_GRAPH_BASE_URL") ?? "https://graph.facebook.com").replace(/\/+$/, "");

export function supabaseServerEnv():
  { ok: true; url: string; serviceKey: string } | { ok: false; missing: string[] } {
  const url =
    env("INBOX_SUPABASE_URL") ??
    env("VITE_INBOX_SUPABASE_URL") ??
    (import.meta.env.PROD ? PUBLIC_INBOX_PROJECT.url : undefined);
  const serviceKey = env("INBOX_SUPABASE_SERVICE_ROLE_KEY");
  const missing = [
    !url && "INBOX_SUPABASE_URL",
    !serviceKey && "INBOX_SUPABASE_SERVICE_ROLE_KEY",
  ].filter((x): x is string => !!x);
  if (missing.length || !url || !serviceKey) return { ok: false, missing };
  return { ok: true, url: url.replace(/\/+$/, ""), serviceKey };
}

/** Estado da IA a partir do ambiente do servidor (só nomes e configuração não secreta; nunca a chave). */
export function aiEnvStatus(): {
  configured: boolean;
  provider: string | null;
  model: string | null;
  missing: string[];
} {
  const provider = env("INBOX_AI_PROVIDER") ?? null;
  const missing: string[] = [];
  if (!provider) missing.push("INBOX_AI_PROVIDER");
  else if (provider !== "anthropic" && provider !== "openai")
    missing.push("INBOX_AI_PROVIDER (use anthropic ou openai)");
  if (!env("INBOX_AI_API_KEY")) missing.push("INBOX_AI_API_KEY");
  if (!env("INBOX_AI_MODEL")) missing.push("INBOX_AI_MODEL");
  return {
    configured: missing.length === 0,
    provider,
    model: env("INBOX_AI_MODEL") ?? null,
    missing,
  };
}

/** Configuração completa da IA (inclui a chave). Só no servidor; nunca devolver ao navegador. */
export function aiConfig():
  | { ok: true; provider: "anthropic" | "openai"; apiKey: string; model: string; baseUrl?: string }
  | { ok: false; missing: string[] } {
  const st = aiEnvStatus();
  const provider = env("INBOX_AI_PROVIDER");
  const apiKey = env("INBOX_AI_API_KEY");
  const model = env("INBOX_AI_MODEL");
  if (!st.configured || !apiKey || !model || (provider !== "anthropic" && provider !== "openai"))
    return { ok: false, missing: st.missing };
  const baseUrl = env("INBOX_AI_BASE_URL");
  return { ok: true, provider, apiKey, model, ...(baseUrl ? { baseUrl } : {}) };
}

/** Chave que criptografa os segredos de cada empresa no banco. Só no servidor. */
export const secretsKey = () => env("INBOX_SECRETS_KEY");
