import { db, getInboxClient } from "@/lib/inbox/client";
import { serverNotReadyStatus } from "@/lib/inbox/whatsapp-setup";

/**
 * Envio de mensagens pelo WhatsApp (cliente). Fluxo:
 *  1. grava a mensagem como `pending` (a RLS só deixa o próprio usuário fazer isso, com client_token único);
 *  2. pede ao backend (/api/inbox/send) para enviar pela Cloud API oficial;
 *  3. o backend confirma e atualiza o status. A tela só mostra "enviada" depois que o banco diz isso.
 * Tokens da Meta nunca passam pelo navegador.
 */
export type ApiResult<T = Record<string, never>> =
  ({ ok: true } & T) | { ok: false; error: string; code?: string; missing?: string[] };

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await getInboxClient().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function inboxApi<T>(
  path: string,
  body?: unknown,
  method: "GET" | "POST" = "POST",
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: { "content-type": "application/json", ...(await authHeader()) },
      ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}),
    });
    const json = (await res.json().catch(() => null)) as
      (Partial<{ error: string; code: string; missing: string[] }> & T) | null;
    if (!res.ok || !json) {
      return {
        ok: false,
        error: json?.error ?? `O servidor respondeu com erro (${res.status}).`,
        ...(json?.code ? { code: json.code } : {}),
        ...(Array.isArray(json?.missing) ? { missing: json.missing } : {}),
      };
    }
    return { ok: true, ...(json as T) };
  } catch {
    return {
      ok: false,
      error: "Não foi possível falar com o servidor. Verifique sua internet e tente de novo.",
      code: "network",
    };
  }
}

export type SendParams = {
  conversationId: string;
  body: string;
  replyToId: string | null;
  userId: string;
};

/** Grava como pendente e pede o envio. Devolve o id da mensagem mesmo se o envio falhar (ela fica visível como falha). */
export async function queueAndSend(
  p: SendParams,
): Promise<{ messageId: string | null; result: ApiResult }> {
  const text = p.body.trim();
  if (!text) return { messageId: null, result: { ok: false, error: "Escreva a mensagem." } };
  const ins = await db
    .from("messages")
    .insert({
      conversation_id: p.conversationId,
      direction: "out",
      type: "text",
      body: text,
      status: "pending",
      sent_by: p.userId,
      client_token: crypto.randomUUID(),
      reply_to_id: p.replyToId,
    })
    .select("id")
    .single();
  if (ins.error || !ins.data)
    return {
      messageId: null,
      result: { ok: false, error: "Não foi possível registrar a mensagem. Tente de novo." },
    };
  return {
    messageId: ins.data.id,
    result: await inboxApi("/api/inbox/send", { messageId: ins.data.id }),
  };
}

/** Tenta de novo uma mensagem que falhou ou ficou sem confirmação. */
export function retrySend(messageId: string): Promise<ApiResult> {
  return inboxApi("/api/inbox/send", { messageId, retry: true });
}

export type TemplateParams = {
  conversationId: string;
  name: string;
  language: string;
  variables: string[];
  userId: string;
};

/** Fora da janela de 24h: só modelo aprovado pela Meta. */
export async function queueAndSendTemplate(
  p: TemplateParams,
): Promise<{ messageId: string | null; result: ApiResult }> {
  const name = p.name.trim();
  if (!name)
    return { messageId: null, result: { ok: false, error: "Informe o nome do modelo aprovado." } };
  const ins = await db
    .from("messages")
    .insert({
      conversation_id: p.conversationId,
      direction: "out",
      type: "template",
      body: `Modelo aprovado: ${name}${p.variables.length ? ` (${p.variables.join(", ")})` : ""}`,
      status: "pending",
      sent_by: p.userId,
      client_token: crypto.randomUUID(),
    })
    .select("id")
    .single();
  if (ins.error || !ins.data)
    return {
      messageId: null,
      result: { ok: false, error: "Não foi possível registrar a mensagem. Tente de novo." },
    };
  return {
    messageId: ins.data.id,
    result: await inboxApi("/api/inbox/send", {
      messageId: ins.data.id,
      template: { name, language: p.language.trim() || "pt_BR", variables: p.variables },
    }),
  };
}

export type ChannelStatus = {
  whatsapp: {
    /** Todas as variáveis de ambiente do backend existem. */
    configured: boolean;
    missing: string[];
    /** O backend conseguiu falar com a Meta com essas credenciais (null = não testado). */
    reachable: boolean | null;
    phone: string | null;
    verifiedName: string | null;
    error: string | null;
  };
  ai: { configured: boolean; provider: string | null; model: string | null; missing: string[] };
  /** Eventos recebidos da Meta (só datas e contagem). null = não foi possível ler. */
  webhook: { lastValidAt: string | null; invalidLast24h: number } | null;
  /** Tabela de variáveis (só nomes e sim/não), montada pelo servidor. */
  envRows: { name: string; scope: "banco" | "whatsapp"; present: boolean; hint: string }[];
  /** Variáveis do SERVIDOR do Inbox que faltam (acesso ao banco). Só presente quando o servidor não está pronto. */
  serverMissing?: string[];
};

export async function fetchChannelStatus(): Promise<ChannelStatus> {
  const r = await inboxApi<{ status: ChannelStatus }>("/api/inbox/status", undefined, "GET");
  if (!r.ok) {
    if (r.code === "server_not_configured")
      return serverNotReadyStatus(
        r.missing && r.missing.length ? r.missing : ["variáveis do servidor do Inbox"],
      );
    throw new Error(r.error);
  }
  return r.status;
}

/** URL assinada, de curta duração, para ver mídia de uma mensagem (só membros). */
export async function fetchMediaUrl(
  messageId: string,
): Promise<ApiResult<{ url: string; mime: string | null }>> {
  return inboxApi<{ url: string; mime: string | null }>("/api/inbox/media", { messageId });
}
