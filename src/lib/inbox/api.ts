import { db } from "@/lib/inbox/client";
import type { ConversationRow, InboxProfile, PipelineStage } from "./types";

/**
 * As consultas do Inbox usam o cliente do projeto Supabase do Inbox (ver ./client.ts).
 * Ainda não há tipos gerados desse projeto (pendente, ver inbox-db/README.md): o formato
 * de retorno é garantido pelos tipos de ./types.
 */
export { db };

/** Postgres 42P01 / PostgREST PGRST205: a migration do Inbox ainda não foi aplicada. */
export function isMissingSchemaError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === "42P01" ||
    e?.code === "PGRST205" ||
    /schema cache|does not exist/i.test(e?.message ?? "")
  );
}

export async function fetchMyProfile(userId: string): Promise<InboxProfile | null> {
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, role, avatar_url, active")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as InboxProfile | null) ?? null;
}

export async function fetchTeam(): Promise<InboxProfile[]> {
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, role, avatar_url, active")
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as InboxProfile[];
}

export async function fetchConversations(): Promise<ConversationRow[]> {
  const { data, error } = await db
    .from("conversations")
    .select(
      "id, status, assigned_to, unread_count, last_message_at, last_message_preview, updated_at, contact:contacts!inner(id, name, phone, company, instagram, category, notes, assigned_to)",
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as ConversationRow[];
}

export async function fetchPipelineStages(): Promise<PipelineStage[]> {
  const { data, error } = await db
    .from("pipeline_stages")
    .select("id, slug, name, position")
    .order("position");
  if (error) throw error;
  return (data ?? []) as PipelineStage[];
}

/** Estado da integração. Só muda quando a Fase 4 existir de verdade e for testada com a Meta. */
export const WHATSAPP_STATE = "not_connected" as "not_connected" | "connected";
export const AI_STATE = "not_configured" as "not_configured" | "configured";
