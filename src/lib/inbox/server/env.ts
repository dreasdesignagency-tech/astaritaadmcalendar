import { PUBLIC_INBOX_PROJECT } from "@/lib/inbox/config";
import {
  whatsappMissing,
  normalizeApiVersion,
  type WhatsAppEnv,
} from "@/lib/inbox/server/whatsapp-core";

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

export function whatsappEnv(): WhatsAppEnv {
  return {
    WHATSAPP_ACCESS_TOKEN: env("WHATSAPP_ACCESS_TOKEN"),
    WHATSAPP_PHONE_NUMBER_ID: env("WHATSAPP_PHONE_NUMBER_ID"),
    WHATSAPP_VERIFY_TOKEN: env("WHATSAPP_VERIFY_TOKEN"),
    META_APP_SECRET: env("META_APP_SECRET"),
    WHATSAPP_API_VERSION: env("WHATSAPP_API_VERSION"),
  };
}

/** Para ENVIAR: precisa de token, número e versão. (Verify token e app secret são do webhook.) */
export function sendConfig():
  | { ok: true; token: string; phoneNumberId: string; version: string }
  | { ok: false; missing: string[] } {
  const e = whatsappEnv();
  const missing = whatsappMissing(e, [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_API_VERSION",
  ]);
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    token: e.WHATSAPP_ACCESS_TOKEN as string,
    phoneNumberId: e.WHATSAPP_PHONE_NUMBER_ID as string,
    version: normalizeApiVersion(e.WHATSAPP_API_VERSION) as string,
  };
}

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
