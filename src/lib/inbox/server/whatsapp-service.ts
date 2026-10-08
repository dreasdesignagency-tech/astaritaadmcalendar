import type { Json } from "@/lib/inbox/database.types";
import type { ChannelStatus } from "@/lib/inbox/messaging";
import type { AdminClient } from "@/lib/inbox/server/admin";
import { aiEnvStatus, env, graphBase, sendConfig, whatsappEnv } from "@/lib/inbox/server/env";
import {
  buildTemplateBody,
  buildTextBody,
  eventKey,
  mapGraphError,
  parseWebhook,
  verifySignature,
  whatsappMissing,
  type EchoMessage,
  type InboundMessage,
  type StatusEvent,
} from "@/lib/inbox/server/whatsapp-core";
import { windowState } from "@/lib/inbox/window";

type Result = { status: number; body: Record<string, unknown> };

// ---------------------------------------------------------------- Graph API
async function graph(path: string, token: string, init: RequestInit = {}, timeoutMs = 15_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${graphBase()}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => null)) as unknown;
    return { ok: res.ok, status: res.status, body, network: false };
  } catch {
    return { ok: false, status: 0, body: null as unknown, network: true };
  } finally {
    clearTimeout(timer);
  }
}

const now = () => new Date().toISOString();
const isDataError = (e: unknown) => {
  const code = (e as { code?: string })?.code ?? "";
  return code === "P0001" || /^2[23]/.test(code); // raise_exception da função, ou erro de dado (22xxx, 23xxx)
};

// ---------------------------------------------------------------- webhook
type Step = "ok" | "defer";

/**
 * Registra o evento (histórico + idempotência) e executa `fn`. Reentrega de evento já processado não repete nada.
 * Erro de dado (ex.: telefone inválido) fica registrado e não é reenviado; erro de infraestrutura devolve 500 (a Meta tenta de novo).
 */
async function track(
  admin: AdminClient,
  key: string,
  payload: unknown,
  fn: () => Promise<Step>,
): Promise<"processed" | "duplicate" | "deferred"> {
  const ins = await admin
    .from("webhook_events")
    .insert({
      provider: "whatsapp",
      event_key: key,
      signature_valid: true,
      payload: payload as Json,
    })
    .select("id")
    .single();
  let id: string;
  if (ins.error) {
    if (ins.error.code !== "23505") throw ins.error;
    const ex = await admin
      .from("webhook_events")
      .select("id, processed_at")
      .eq("provider", "whatsapp")
      .eq("event_key", key)
      .single();
    if (ex.error) throw ex.error;
    if (ex.data.processed_at) return "duplicate";
    id = ex.data.id;
  } else {
    id = ins.data.id;
  }
  try {
    if ((await fn()) === "defer") {
      await admin
        .from("webhook_events")
        .update({ error: "mensagem ainda não registrada; será reaplicada" })
        .eq("id", id);
      return "deferred";
    }
    await admin.from("webhook_events").update({ processed_at: now(), error: null }).eq("id", id);
    return "processed";
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? e).slice(0, 500);
    if (isDataError(e)) {
      await admin.from("webhook_events").update({ processed_at: now(), error: msg }).eq("id", id);
      return "processed";
    }
    await admin.from("webhook_events").update({ error: msg }).eq("id", id);
    throw e;
  }
}

async function ingestMessage(admin: AdminClient, m: InboundMessage): Promise<Step> {
  const { data, error } = await admin.rpc("inbox_ingest_inbound", {
    p_wa_id: m.waId,
    p_profile_name: m.profileName,
    p_wa_message_id: m.waMessageId,
    p_type: m.type,
    p_body: m.body,
    p_media_mime: m.mime,
    p_wa_media_id: m.mediaId,
    p_sent_at: m.sentAt,
  });
  if (error) throw error;
  const r = data as { duplicate?: boolean; message_id?: string | null } | null;
  if (!r?.duplicate && m.contextWaId && r?.message_id) {
    // Resposta a uma mensagem anterior: liga ao original (melhor esforço).
    const target = await admin
      .from("messages")
      .select("id")
      .eq("wa_message_id", m.contextWaId)
      .maybeSingle();
    if (target.data)
      await admin.from("messages").update({ reply_to_id: target.data.id }).eq("id", r.message_id);
  }
  return "ok";
}

async function ingestEcho(admin: AdminClient, m: EchoMessage): Promise<Step> {
  const { error } = await admin.rpc("inbox_ingest_echo", {
    p_to_wa_id: m.toWaId,
    p_wa_message_id: m.waMessageId,
    p_type: m.type,
    p_body: m.body,
    p_media_mime: m.mime,
    p_wa_media_id: m.mediaId,
    p_sent_at: m.sentAt,
  });
  if (error) throw error;
  return "ok";
}

async function applyStatus(admin: AdminClient, s: StatusEvent): Promise<Step> {
  const { data, error } = await admin.rpc("inbox_apply_status", {
    p_wa_message_id: s.waMessageId,
    p_status: s.status,
    p_at: s.sentAt,
    p_error_code: s.errorCode,
    p_error_message: s.errorMessage,
  });
  if (error) throw error;
  if (data === 0) {
    // Zero pode ser "status mais antigo, ignorado" ou "mensagem ainda não registrada" (o status chegou antes de gravarmos o id).
    const exists = await admin
      .from("messages")
      .select("id")
      .eq("wa_message_id", s.waMessageId)
      .maybeSingle();
    if (!exists.data) return "defer";
  }
  return "ok";
}

export async function handleWebhookPost(
  admin: AdminClient,
  raw: string,
  signature: string | null,
): Promise<Result> {
  const secrets = (env("META_APP_SECRET") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (secrets.length === 0)
    return { status: 503, body: { error: "META_APP_SECRET não configurado no servidor." } };

  if (!(await verifySignature(raw, signature, secrets))) {
    // Não guarda o conteúdo de quem não provou ser a Meta: só o tamanho.
    await admin.from("webhook_events").insert({
      provider: "whatsapp",
      signature_valid: false,
      payload: { rejected: true, bytes: raw.length },
      error: "assinatura inválida",
    });
    return { status: 401, body: { error: "assinatura inválida" } };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { status: 400, body: { error: "JSON inválido" } };
  }

  const parsed = parseWebhook(payload);
  const counts = {
    messages: 0,
    statuses: 0,
    echoes: 0,
    duplicates: 0,
    deferred: 0,
    ignored: parsed.ignored.length,
  };
  const bump = (
    o: "processed" | "duplicate" | "deferred",
    kind: "messages" | "statuses" | "echoes",
  ) => {
    if (o === "duplicate") counts.duplicates += 1;
    else if (o === "deferred") counts.deferred += 1;
    else counts[kind] += 1;
  };

  try {
    for (const m of parsed.messages)
      bump(
        await track(admin, eventKey.message(m.waMessageId), m, () => ingestMessage(admin, m)),
        "messages",
      );
    for (const e of parsed.echoes)
      bump(
        await track(admin, eventKey.echo(e.waMessageId), e, () => ingestEcho(admin, e)),
        "echoes",
      );
    for (const s of parsed.statuses)
      bump(
        await track(admin, eventKey.status(s.waMessageId, s.status), s, () =>
          applyStatus(admin, s),
        ),
        "statuses",
      );
  } catch (e) {
    console.error(
      "[whatsapp-webhook] falha de infraestrutura",
      (e as { message?: string })?.message,
    );
    return { status: 500, body: { error: "falha temporária; a Meta deve reenviar" } };
  }
  return { status: 200, body: { ok: true, ...counts } };
}

/** Status que chegaram antes de a mensagem ter o id da Meta gravado: aplica na ordem em que a Meta os enviou. */
async function reapplyDeferredStatuses(admin: AdminClient, waMessageId: string) {
  const { data } = await admin
    .from("webhook_events")
    .select("id, payload")
    .eq("provider", "whatsapp")
    .is("processed_at", null)
    .like("event_key", `st:${waMessageId}:%`);
  for (const row of data ?? []) {
    const s = row.payload as unknown as StatusEvent;
    try {
      await admin.rpc("inbox_apply_status", {
        p_wa_message_id: s.waMessageId,
        p_status: s.status,
        p_at: s.sentAt,
        p_error_code: s.errorCode,
        p_error_message: s.errorMessage,
      });
      await admin
        .from("webhook_events")
        .update({ processed_at: now(), error: null })
        .eq("id", row.id);
    } catch {
      /* fica para a próxima */
    }
  }
}

// ---------------------------------------------------------------- envio
export type SendInput = {
  userId: string;
  messageId: string;
  retry: boolean;
  template: { name: string; language: string; variables: string[] } | null;
};

async function fail(admin: AdminClient, messageId: string, code: string, message: string) {
  await admin
    .from("messages")
    .update({
      status: "failed",
      error_code: code.slice(0, 60),
      error_message: message.slice(0, 500),
      status_updated_at: now(),
    })
    .eq("id", messageId)
    .is("wa_message_id", null);
}

export async function sendMessage(admin: AdminClient, input: SendInput): Promise<Result> {
  const msg = await admin
    .from("messages")
    .select(
      "id, conversation_id, direction, type, body, status, sent_by, wa_message_id, reply_to_id, status_updated_at",
    )
    .eq("id", input.messageId)
    .maybeSingle();
  if (msg.error)
    return {
      status: 503,
      body: { error: "Não foi possível ler a mensagem. Tente de novo.", code: "db_error" },
    };
  const m = msg.data;
  if (!m || m.direction !== "out")
    return { status: 404, body: { error: "Mensagem não encontrada.", code: "not_found" } };
  if (m.sent_by !== input.userId)
    return {
      status: 403,
      body: { error: "Só quem escreveu a mensagem pode enviá-la.", code: "forbidden" },
    };
  if (m.wa_message_id) return { status: 200, body: { ok: true, duplicate: true } }; // já enviada: idempotente
  if (m.type !== "text" && m.type !== "template")
    return {
      status: 400,
      body: { error: "Tipo de mensagem não suportado para envio.", code: "unsupported_type" },
    };
  if (m.type === "template" && !input.template)
    return {
      status: 400,
      body: { error: "Informe o modelo aprovado a enviar.", code: "template_required" },
    };

  const cfg = sendConfig();
  if (!cfg.ok) {
    await fail(admin, m.id, "not_configured", "WhatsApp não configurado no servidor.");
    return {
      status: 503,
      body: {
        error: `WhatsApp não configurado no servidor (faltam: ${cfg.missing.join(", ")}).`,
        code: "not_configured",
      },
    };
  }

  const conv = await admin
    .from("conversations")
    .select("id, last_inbound_at, assigned_to, status, contact:contacts!inner(phone)")
    .eq("id", m.conversation_id)
    .single();
  const phone = (conv.data?.contact as unknown as { phone: string | null } | undefined)?.phone;
  if (conv.error || !conv.data || !phone) {
    await fail(admin, m.id, "no_phone", "Contato sem telefone.");
    return {
      status: 422,
      body: { error: "Este contato não tem telefone para envio.", code: "no_phone" },
    };
  }

  // Regra da Meta: mensagem livre só até 24h depois da última mensagem do cliente. O servidor confere de novo.
  if (m.type === "text" && !windowState(conv.data.last_inbound_at).open) {
    const text = "Fora da janela de 24 horas: a Meta só permite enviar um modelo aprovado agora.";
    await fail(admin, m.id, "window_closed", text);
    return { status: 409, body: { error: text, code: "window_closed" } };
  }

  // Reserva a mensagem (evita envio em duplicidade com duplo clique ou duas abas).
  if (input.retry) {
    await admin
      .from("messages")
      .update({ status: "pending", status_updated_at: null, error_code: null, error_message: null })
      .eq("id", m.id)
      .is("wa_message_id", null)
      .in("status", ["failed", "pending"]);
  }
  const claim = await admin
    .from("messages")
    .update({ status_updated_at: now() })
    .eq("id", m.id)
    .eq("status", "pending")
    .is("status_updated_at", null)
    .is("wa_message_id", null)
    .select("id");
  if (claim.error)
    return {
      status: 503,
      body: { error: "Não foi possível reservar a mensagem. Tente de novo.", code: "db_error" },
    };
  if (!claim.data || claim.data.length === 0)
    return { status: 200, body: { ok: true, duplicate: true } };

  let replyWa: string | null = null;
  if (m.reply_to_id) {
    const target = await admin
      .from("messages")
      .select("wa_message_id")
      .eq("id", m.reply_to_id)
      .maybeSingle();
    replyWa = target.data?.wa_message_id ?? null;
  }

  const body =
    m.type === "template" && input.template
      ? buildTemplateBody(
          phone,
          input.template.name,
          input.template.language,
          input.template.variables,
        )
      : buildTextBody(phone, m.body ?? "", replyWa);

  const res = await graph(`/${cfg.version}/${cfg.phoneNumberId}/messages`, cfg.token, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const waId = (res.body as { messages?: { id?: string }[] } | null)?.messages?.[0]?.id;
  if (res.ok && waId) {
    // A Meta aceitou: só agora a mensagem vira "enviada" no banco.
    await admin
      .from("messages")
      .update({
        wa_message_id: waId,
        status: "sent",
        status_updated_at: now(),
        error_code: null,
        error_message: null,
      })
      .eq("id", m.id);
    await reapplyDeferredStatuses(admin, waId);
    const text = (m.body ?? "").slice(0, 140);
    await admin
      .from("conversations")
      .update({
        last_message_at: now(),
        last_message_preview: text || "Mensagem",
        assigned_to: conv.data.assigned_to ?? input.userId,
        status: "in_progress",
      })
      .eq("id", m.conversation_id);
    await admin
      .from("opportunities")
      .update({ last_interaction_at: now() })
      .eq(
        "contact_id",
        (
          await admin
            .from("conversations")
            .select("contact_id")
            .eq("id", m.conversation_id)
            .single()
        ).data?.contact_id ?? "",
      );
    return { status: 200, body: { ok: true, waMessageId: waId } };
  }

  const err = res.network
    ? {
        code: "network",
        kind: "other",
        message:
          "Não foi possível falar com a Meta (rede ou tempo esgotado). Nada foi enviado; tente de novo.",
      }
    : mapGraphError(res.status, res.body);
  await fail(admin, m.id, err.code, err.message);
  return {
    status: err.kind === "window" ? 409 : res.network ? 504 : 502,
    body: { error: err.message, code: err.kind === "window" ? "window_closed" : err.code },
  };
}

// ---------------------------------------------------------------- estado dos canais
let waCache: { at: number; key: string; value: ChannelStatus["whatsapp"] } | null = null;

export async function channelStatus(): Promise<ChannelStatus> {
  const e = whatsappEnv();
  const missing = whatsappMissing(e);
  const base: ChannelStatus["whatsapp"] = {
    configured: missing.length === 0,
    missing,
    reachable: null,
    phone: null,
    verifiedName: null,
    error: null,
  };
  const ai = aiEnvStatus();
  const cfg = sendConfig();
  if (!base.configured || !cfg.ok) return { whatsapp: base, ai };

  const key = `${cfg.phoneNumberId}|${cfg.version}|${cfg.token.length}`;
  if (waCache && waCache.key === key && Date.now() - waCache.at < 60_000)
    return { whatsapp: waCache.value, ai };

  const res = await graph(
    `/${cfg.version}/${cfg.phoneNumberId}?fields=display_phone_number,verified_name`,
    cfg.token,
    {},
    8_000,
  );
  let value: ChannelStatus["whatsapp"];
  if (res.ok) {
    const b = res.body as { display_phone_number?: string; verified_name?: string } | null;
    value = {
      ...base,
      reachable: true,
      phone: b?.display_phone_number ?? null,
      verifiedName: b?.verified_name ?? null,
    };
  } else if (res.network) {
    value = { ...base, reachable: null, error: "Não foi possível falar com a Meta agora." };
  } else {
    value = { ...base, reachable: false, error: mapGraphError(res.status, res.body).message };
  }
  waCache = { at: Date.now(), key, value };
  return { whatsapp: value, ai };
}

// ---------------------------------------------------------------- mídia
const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "audio/ogg": ".ogg",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
  "audio/amr": ".amr",
  "video/mp4": ".mp4",
  "video/3gpp": ".3gp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
};
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

/** Devolve uma URL assinada de curta duração. Baixa da Meta para o bucket privado na primeira vez. */
export async function getMediaUrl(admin: AdminClient, messageId: string): Promise<Result> {
  const msg = await admin
    .from("messages")
    .select("id, conversation_id, type, media_path, media_mime, wa_media_id")
    .eq("id", messageId)
    .maybeSingle();
  if (msg.error)
    return { status: 503, body: { error: "Não foi possível ler a mensagem.", code: "db_error" } };
  const m = msg.data;
  if (!m || (!m.media_path && !m.wa_media_id))
    return { status: 404, body: { error: "Esta mensagem não tem anexo.", code: "not_found" } };

  let path = m.media_path;
  let mime = m.media_mime;
  if (!path) {
    const cfg = sendConfig();
    if (!cfg.ok)
      return {
        status: 503,
        body: {
          error: `WhatsApp não configurado no servidor (faltam: ${cfg.missing.join(", ")}).`,
          code: "not_configured",
        },
      };
    const meta = await graph(`/${cfg.version}/${m.wa_media_id}`, cfg.token, {}, 10_000);
    const info = meta.body as { url?: string; mime_type?: string; file_size?: number } | null;
    if (!meta.ok || !info?.url) {
      const err = meta.network
        ? { message: "Não foi possível falar com a Meta.", code: "network" }
        : mapGraphError(meta.status, meta.body);
      return {
        status: 502,
        body: { error: `Não foi possível obter o anexo na Meta. ${err.message}`, code: err.code },
      };
    }
    if ((info.file_size ?? 0) > MAX_MEDIA_BYTES)
      return {
        status: 413,
        body: { error: "Anexo grande demais para ser carregado aqui.", code: "too_large" },
      };

    // A URL de download da Meta também exige o token e vale poucos minutos.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30_000);
    let bytes: ArrayBuffer;
    try {
      const dl = await fetch(info.url, {
        headers: { Authorization: `Bearer ${cfg.token}` },
        signal: ctrl.signal,
      });
      if (!dl.ok)
        return {
          status: 502,
          body: { error: "A Meta recusou o download do anexo.", code: String(dl.status) },
        };
      if (Number(dl.headers.get("content-length") ?? 0) > MAX_MEDIA_BYTES)
        return { status: 413, body: { error: "Anexo grande demais.", code: "too_large" } };
      bytes = await dl.arrayBuffer();
      if (bytes.byteLength > MAX_MEDIA_BYTES)
        return { status: 413, body: { error: "Anexo grande demais.", code: "too_large" } };
    } catch {
      return { status: 504, body: { error: "Tempo esgotado ao baixar o anexo.", code: "network" } };
    } finally {
      clearTimeout(timer);
    }
    mime =
      (info.mime_type ?? m.media_mime ?? "application/octet-stream").split(";")[0]?.trim() ??
      "application/octet-stream";
    path = `${m.conversation_id}/${m.id}${EXT[mime] ?? ""}`;
    const up = await admin.storage
      .from("inbox-media")
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (up.error)
      return {
        status: 503,
        body: { error: "Não foi possível guardar o anexo.", code: "storage_error" },
      };
    await admin.from("messages").update({ media_path: path, media_mime: mime }).eq("id", m.id);
  }

  const signed = await admin.storage.from("inbox-media").createSignedUrl(path, 300);
  if (signed.error || !signed.data)
    return {
      status: 503,
      body: { error: "Não foi possível gerar o link do anexo.", code: "storage_error" },
    };
  return { status: 200, body: { ok: true, url: signed.data.signedUrl, mime } };
}
