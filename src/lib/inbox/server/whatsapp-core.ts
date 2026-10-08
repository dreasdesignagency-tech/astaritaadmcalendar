/**
 * Núcleo da integração com a WhatsApp Business Platform (Cloud API oficial).
 * Funções puras, sem imports, para rodar em qualquer ambiente (Node, Workers) e serem testadas sozinhas.
 *
 * ATENÇÃO: os formatos abaixo seguem a Cloud API conforme o conhecimento do autor. A documentação oficial da Meta não
 * pôde ser aberta durante o desenvolvimento (o ambiente bloqueia developers.facebook.com), então NADA aqui foi conferido
 * contra a documentação atual nem contra a Meta de verdade. O parser é defensivo: formato inesperado vira "ignorado",
 * nunca derruba o webhook.
 */

// ---------------------------------------------------------------- assinatura do webhook
const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparação em tempo constante (não vaza em qual posição as strings diferem). */
export function timingSafeEqual(a: string, b: string): boolean {
  const ea = enc.encode(a);
  const eb = enc.encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/**
 * Valida o cabeçalho X-Hub-Signature-256 ("sha256=<hex>") sobre o corpo BRUTO da requisição.
 * `secrets` aceita mais de um segredo, para a janela de rotação do segredo do app.
 */
export async function verifySignature(
  rawBody: string,
  header: string | null | undefined,
  secrets: string[],
): Promise<boolean> {
  if (!header || !header.startsWith("sha256=")) return false;
  const given = header.slice("sha256=".length).trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(given)) return false;
  let ok = false;
  for (const secret of secrets.filter(Boolean)) {
    const expected = await hmacSha256Hex(secret, rawBody);
    if (timingSafeEqual(expected, given)) ok = true; // não interrompe: tempo igual para todos os segredos
  }
  return ok;
}

/** GET de verificação do webhook (hub.mode, hub.verify_token, hub.challenge). */
export function checkVerification(
  params: URLSearchParams,
  expectedToken: string | undefined,
): { ok: true; challenge: string } | { ok: false } {
  if (!expectedToken) return { ok: false };
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token") ?? "";
  const challenge = params.get("hub.challenge");
  if (mode === "subscribe" && challenge !== null && timingSafeEqual(token, expectedToken))
    return { ok: true, challenge };
  return { ok: false };
}

// ---------------------------------------------------------------- eventos recebidos
export type MsgType = "text" | "image" | "document" | "audio" | "video" | "sticker" | "unsupported";

export type InboundMessage = {
  waId: string;
  profileName: string | null;
  waMessageId: string;
  type: MsgType;
  body: string | null;
  mime: string | null;
  mediaId: string | null;
  sentAt: string;
  contextWaId: string | null;
};

export type StatusEvent = {
  waMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  sentAt: string;
  recipientId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type EchoMessage = {
  toWaId: string;
  waMessageId: string;
  type: MsgType;
  body: string | null;
  mime: string | null;
  mediaId: string | null;
  sentAt: string;
};

export type ParsedWebhook = {
  messages: InboundMessage[];
  statuses: StatusEvent[];
  echoes: EchoMessage[];
  /** Campos e tipos que o parser reconheceu mas deliberadamente não processa (ex.: reações). */
  ignored: string[];
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null =>
  typeof v === "string" && v !== "" ? v : typeof v === "number" ? String(v) : null;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function isoFromUnix(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : new Date().toISOString();
}

/** Extrai tipo, texto, mime e id de mídia de uma mensagem (recebida ou eco). Devolve null para o que deve ser ignorado. */
export function readContent(
  m: Obj,
): { type: MsgType; body: string | null; mime: string | null; mediaId: string | null } | null {
  const type = str(m["type"]) ?? "unknown";
  const media = (key: "image" | "video" | "audio" | "document" | "sticker") => {
    const o = isObj(m[key]) ? (m[key] as Obj) : {};
    return {
      caption: str(o["caption"]) ?? (key === "document" ? str(o["filename"]) : null),
      mime: str(o["mime_type"]),
      id: str(o["id"]),
    };
  };
  switch (type) {
    case "text": {
      const t = isObj(m["text"]) ? str((m["text"] as Obj)["body"]) : null;
      return { type: "text", body: t, mime: null, mediaId: null };
    }
    case "image":
    case "video":
    case "audio":
    case "document":
    case "sticker": {
      const x = media(type);
      return { type, body: x.caption, mime: x.mime, mediaId: x.id };
    }
    case "button": {
      const b = isObj(m["button"]) ? str((m["button"] as Obj)["text"]) : null;
      return { type: "text", body: b, mime: null, mediaId: null };
    }
    case "interactive": {
      const i = isObj(m["interactive"]) ? (m["interactive"] as Obj) : {};
      const reply = isObj(i["button_reply"])
        ? (i["button_reply"] as Obj)
        : isObj(i["list_reply"])
          ? (i["list_reply"] as Obj)
          : {};
      return { type: "text", body: str(reply["title"]), mime: null, mediaId: null };
    }
    case "location": {
      const l = isObj(m["location"]) ? (m["location"] as Obj) : {};
      const bits = [str(l["name"]), str(l["address"])].filter(Boolean).join(", ");
      const coords =
        l["latitude"] !== undefined ? `(${String(l["latitude"])}, ${String(l["longitude"])})` : "";
      return {
        type: "text",
        body: `[Localização] ${[bits, coords].filter(Boolean).join(" ")}`.trim(),
        mime: null,
        mediaId: null,
      };
    }
    case "contacts": {
      const names = arr(m["contacts"])
        .map((c) =>
          isObj(c) && isObj(c["name"]) ? str((c["name"] as Obj)["formatted_name"]) : null,
        )
        .filter(Boolean);
      return {
        type: "text",
        body: `[Contato compartilhado] ${names.join(", ")}`.trim(),
        mime: null,
        mediaId: null,
      };
    }
    case "reaction":
      return null; // reação a uma mensagem: não é mensagem nova nem conta como não lida
    default:
      return {
        type: "unsupported",
        body: `[Tipo de mensagem não suportado: ${type}]`,
        mime: null,
        mediaId: null,
      };
  }
}

/** Interpreta o corpo de um POST do webhook. Nunca lança exceção. */
export function parseWebhook(payload: unknown): ParsedWebhook {
  const out: ParsedWebhook = { messages: [], statuses: [], echoes: [], ignored: [] };
  if (!isObj(payload)) return out;

  for (const entry of arr(payload["entry"])) {
    if (!isObj(entry)) continue;
    for (const change of arr(entry["changes"])) {
      if (!isObj(change)) continue;
      const field = str(change["field"]) ?? "";
      const value = isObj(change["value"]) ? change["value"] : null;
      if (!value) continue;

      if (field === "messages") {
        const names = new Map<string, string>();
        for (const c of arr(value["contacts"])) {
          if (isObj(c)) {
            const id = str(c["wa_id"]);
            const name = isObj(c["profile"]) ? str((c["profile"] as Obj)["name"]) : null;
            if (id && name) names.set(id, name);
          }
        }
        for (const m of arr(value["messages"])) {
          if (!isObj(m)) continue;
          const from = str(m["from"]);
          const id = str(m["id"]);
          if (!from || !id) continue;
          const content = readContent(m);
          if (!content) {
            out.ignored.push(`messages:${str(m["type"]) ?? "?"}`);
            continue;
          }
          out.messages.push({
            waId: from,
            profileName: names.get(from) ?? null,
            waMessageId: id,
            ...content,
            sentAt: isoFromUnix(m["timestamp"]),
            contextWaId: isObj(m["context"]) ? str((m["context"] as Obj)["id"]) : null,
          });
        }
        for (const s of arr(value["statuses"])) {
          if (!isObj(s)) continue;
          const id = str(s["id"]);
          const status = str(s["status"]);
          if (
            !id ||
            (status !== "sent" &&
              status !== "delivered" &&
              status !== "read" &&
              status !== "failed")
          ) {
            if (status) out.ignored.push(`status:${status}`);
            continue;
          }
          const err = arr(s["errors"]).find(isObj) as Obj | undefined;
          const details =
            err && isObj(err["error_data"]) ? str((err["error_data"] as Obj)["details"]) : null;
          out.statuses.push({
            waMessageId: id,
            status,
            sentAt: isoFromUnix(s["timestamp"]),
            recipientId: str(s["recipient_id"]),
            errorCode: err ? str(err["code"]) : null,
            errorMessage: err
              ? [str(err["title"]), details ?? str(err["message"])].filter(Boolean).join(": ") ||
                null
              : null,
          });
        }
      } else if (field === "smb_message_echoes") {
        // Coexistência: mensagens enviadas pelo app WhatsApp Business no celular.
        for (const m of arr(value["message_echoes"])) {
          if (!isObj(m)) continue;
          const to = str(m["to"]) ?? str(m["recipient"]);
          const id = str(m["id"]);
          if (!to || !id) continue;
          const content = readContent(m);
          if (!content) continue;
          out.echoes.push({
            toWaId: to,
            waMessageId: id,
            ...content,
            sentAt: isoFromUnix(m["timestamp"]),
          });
        }
      } else {
        out.ignored.push(`field:${field || "?"}`);
      }
    }
  }
  return out;
}

export const eventKey = {
  message: (waMessageId: string) => `msg:${waMessageId}`,
  status: (waMessageId: string, status: string) => `st:${waMessageId}:${status}`,
  echo: (waMessageId: string) => `echo:${waMessageId}`,
};

// ---------------------------------------------------------------- envio
export function normalizeApiVersion(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return /^v\d{1,3}\.\d{1,2}$/.test(t) ? t : null;
}

export function buildTextBody(to: string, text: string, replyToWaId: string | null) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
    ...(replyToWaId ? { context: { message_id: replyToWaId } } : {}),
  };
}

export function buildTemplateBody(to: string, name: string, language: string, variables: string[]) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name,
      language: { code: language },
      ...(variables.length
        ? {
            components: [
              { type: "body", parameters: variables.map((text) => ({ type: "text", text })) },
            ],
          }
        : {}),
    },
  };
}

export type GraphErrorKind =
  "window" | "auth" | "recipient" | "rate" | "template" | "config" | "other";

/** Traduz erros da Graph API para uma mensagem clara e um tipo. A mensagem original da Meta vai junto, truncada. */
export function mapGraphError(
  httpStatus: number,
  body: unknown,
): { code: string; kind: GraphErrorKind; message: string } {
  const err = isObj(body) && isObj(body["error"]) ? (body["error"] as Obj) : {};
  const code = str(err["code"]) ?? String(httpStatus);
  const sub = str(err["error_subcode"]);
  const metaMsg = (
    str(
      err["error_data"] && isObj(err["error_data"]) ? (err["error_data"] as Obj)["details"] : null,
    ) ??
    str(err["message"]) ??
    ""
  ).slice(0, 160);
  const c = Number(code);
  const tail = metaMsg ? ` (Meta: ${metaMsg})` : "";
  if (c === 131047)
    return {
      code,
      kind: "window",
      message: `Fora da janela de 24 horas: a Meta só permite enviar um modelo aprovado agora.${tail}`,
    };
  if (c === 190 || c === 102 || httpStatus === 401)
    return {
      code,
      kind: "auth",
      message: `A Meta recusou o token de acesso (expirado ou inválido). Gere um novo token e atualize a configuração.${tail}`,
    };
  if (c === 10 || c === 200 || c === 299)
    return {
      code,
      kind: "auth",
      message: `O token não tem permissão para enviar por este número.${tail}`,
    };
  if (c === 131030)
    return {
      code,
      kind: "recipient",
      message: `Este número não está na lista de destinatários permitidos (modo de teste da Meta).${tail}`,
    };
  if (c === 131026)
    return {
      code,
      kind: "recipient",
      message: `A mensagem não pôde ser entregue: o número pode não usar WhatsApp ou ter bloqueado contatos novos.${tail}`,
    };
  if (c === 131049)
    return {
      code,
      kind: "recipient",
      message: `A Meta não entregou para preservar a qualidade do ecossistema (limite de mensagens de marketing por pessoa).${tail}`,
    };
  if (c === 130429 || c === 131056 || c === 80007 || httpStatus === 429)
    return {
      code,
      kind: "rate",
      message: `Limite de envio da Meta atingido. Aguarde um pouco e tente de novo.${tail}`,
    };
  if (c === 132001 || sub === "2494010")
    return {
      code,
      kind: "template",
      message: `O modelo não existe ou não foi aprovado nesse idioma. Confira o nome e o idioma no Gerenciador do WhatsApp.${tail}`,
    };
  if (c >= 132000 && c < 133000)
    return {
      code,
      kind: "template",
      message: `Os parâmetros do modelo não conferem com o que foi aprovado.${tail}`,
    };
  if (c === 133010 || c === 133000)
    return {
      code,
      kind: "config",
      message: `O número de telefone do WhatsApp não está registrado na Cloud API.${tail}`,
    };
  if (c === 100)
    return {
      code,
      kind: "config",
      message: `Pedido inválido para a Meta (confira o ID do número e a versão da API).${tail}`,
    };
  return { code, kind: "other", message: `A Meta não aceitou o envio (código ${code}).${tail}` };
}

// ---------------------------------------------------------------- configuração do servidor
export type WhatsAppEnv = Partial<
  Record<
    | "WHATSAPP_ACCESS_TOKEN"
    | "WHATSAPP_PHONE_NUMBER_ID"
    | "WHATSAPP_VERIFY_TOKEN"
    | "META_APP_SECRET"
    | "WHATSAPP_API_VERSION",
    string | undefined
  >
>;

export const WHATSAPP_REQUIRED = [
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "META_APP_SECRET",
  "WHATSAPP_API_VERSION",
] as const;

/** Quais variáveis faltam (só os nomes; nunca valores). A versão da API precisa ter formato válido. */
export function whatsappMissing(
  env: WhatsAppEnv,
  only: readonly (typeof WHATSAPP_REQUIRED)[number][] = WHATSAPP_REQUIRED,
): string[] {
  const missing: string[] = [];
  for (const k of only) {
    const v = (env[k] ?? "").trim();
    if (!v) missing.push(k);
    else if (k === "WHATSAPP_API_VERSION" && !normalizeApiVersion(v))
      missing.push(`${k} (formato inválido; use algo como v21.0)`);
  }
  return missing;
}
