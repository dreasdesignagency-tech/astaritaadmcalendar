import type { AdminClient } from "@/lib/inbox/server/admin";
import {
  AI_ERROR_TEXT,
  AI_KINDS,
  REWRITE_KINDS,
  buildPrompt,
  buildRequest,
  describeMessage,
  parseResponse,
  statusToError,
  type AiErrorCode,
  type AiKind,
} from "@/lib/inbox/server/ai-core";
import { aiConfig } from "@/lib/inbox/server/env";

type Result = { status: number; body: Record<string, unknown> };

const HISTORY_LIMIT = 30;
const MAX_TEXT = 4000;
/** Limite simples por pessoa: no máximo 12 pedidos por minuto (contados pelas sugestões gravadas). */
const RATE_PER_MINUTE = 12;
const TIMEOUT_MS = 45_000;

export function isAiKind(v: unknown): v is AiKind {
  return typeof v === "string" && (AI_KINDS as readonly string[]).includes(v);
}

async function callProvider(
  cfg: Extract<ReturnType<typeof aiConfig>, { ok: true }>,
  prompt: { system: string; user: string },
): Promise<{ ok: true; text: string } | { ok: false; code: AiErrorCode }> {
  const req = buildRequest(cfg, prompt);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(req.body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      // Só o status vai para o log: o corpo do provedor pode conter dados do pedido.
      console.error("[inbox-ai] provedor respondeu", res.status);
      return { ok: false, code: statusToError(res.status) };
    }
    const body = await res.json().catch(() => null);
    return parseResponse(cfg.provider, body);
  } catch (e) {
    const aborted = (e as { name?: string })?.name === "AbortError";
    return { ok: false, code: aborted ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

export async function generateSuggestion(
  admin: AdminClient,
  p: { userId: string; conversationId: string; kind: AiKind; text?: string },
): Promise<Result> {
  const cfg = aiConfig();
  if (!cfg.ok)
    return {
      status: 503,
      body: {
        error: "A IA ainda não está configurada.",
        code: "ai_not_configured",
        missing: cfg.missing,
      },
    };

  const text = (p.text ?? "").trim();
  if (REWRITE_KINDS.includes(p.kind) && !text)
    return {
      status: 400,
      body: { error: "Escreva ou gere um texto antes de pedir este ajuste.", code: "bad_request" },
    };
  if (text.length > MAX_TEXT)
    return { status: 400, body: { error: "O texto é grande demais.", code: "bad_request" } };

  const since = new Date(Date.now() - 60_000).toISOString();
  const recent = await admin
    .from("ai_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("created_by", p.userId)
    .gte("created_at", since);
  if (!recent.error && (recent.count ?? 0) >= RATE_PER_MINUTE)
    return {
      status: 429,
      body: { error: "Muitos pedidos seguidos. Espere um minuto.", code: "rate_limited" },
    };

  const conv = await admin
    .from("conversations")
    .select("id, contact:contacts(id, name, company)")
    .eq("id", p.conversationId)
    .maybeSingle();
  if (conv.error)
    return { status: 503, body: { error: "Não foi possível ler a conversa.", code: "db_error" } };
  const contact = conv.data?.contact as { id: string; name: string; company: string | null } | null;
  if (!conv.data || !contact)
    return { status: 404, body: { error: "Conversa não encontrada.", code: "not_found" } };

  const [msgs, kb, opp] = await Promise.all([
    admin
      .from("messages")
      .select("direction, type, body, created_at")
      .eq("conversation_id", p.conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    admin.from("knowledge_base").select("section, title, content"),
    admin
      .from("opportunities")
      .select("stage:pipeline_stages(name)")
      .eq("contact_id", contact.id)
      .maybeSingle(),
  ]);
  if (msgs.error || kb.error)
    return { status: 503, body: { error: "Não foi possível ler os dados.", code: "db_error" } };

  const history = [...(msgs.data ?? [])].reverse().map((m) => ({
    direction: (m.direction === "out" ? "out" : "in") as "in" | "out",
    text: describeMessage(m),
  }));
  const stage = (opp.data?.stage as { name: string } | null)?.name ?? null;

  const prompt = buildPrompt({
    kind: p.kind,
    contactName: contact.name,
    company: contact.company,
    stage,
    messages: history,
    knowledge: kb.data ?? [],
    text,
  });

  const out = await callProvider(cfg, prompt);
  if (!out.ok) {
    const status =
      out.code === "unauthorized" || out.code === "bad_model"
        ? 502
        : out.code === "rate_limited"
          ? 429
          : 502;
    return { status, body: { error: AI_ERROR_TEXT[out.code], code: `ai_${out.code}` } };
  }

  const saved = await admin
    .from("ai_suggestions")
    .insert({
      conversation_id: p.conversationId,
      kind: p.kind,
      content: out.text,
      provider: cfg.provider,
      model: cfg.model,
      created_by: p.userId,
    })
    .select("id")
    .single();
  return {
    status: 200,
    body: { ok: true, id: saved.data?.id ?? null, content: out.text, kind: p.kind },
  };
}
