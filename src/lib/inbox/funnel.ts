import { db } from "@/lib/inbox/client";
import { InboxUserError } from "@/lib/inbox/errors";
import type { ContactCategory } from "@/lib/inbox/types";

export type OpportunityCard = {
  id: string;
  contact_id: string;
  stage_id: string;
  title: string | null;
  assigned_to: string | null;
  position: number;
  last_interaction_at: string | null;
  created_at: string;
  contact: {
    id: string;
    name: string;
    company: string | null;
    phone: string | null;
    category: ContactCategory;
  };
};

export async function fetchOpportunities(): Promise<OpportunityCard[]> {
  const { data, error } = await db
    .from("opportunities")
    .select(
      "id, contact_id, stage_id, title, assigned_to, position, last_interaction_at, created_at, contact:contacts!inner(id, name, company, phone, category)",
    )
    .order("position")
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as unknown as OpportunityCard[];
}

/** Move o cartão e persiste no banco. Falha explícita se a linha não existir mais (outra pessoa removeu). */
export async function moveOpportunity(
  id: string,
  stageId: string,
  position: number,
): Promise<void> {
  const { data, error } = await db
    .from("opportunities")
    .update({ stage_id: stageId, position })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0)
    throw new InboxUserError("Este cartão não existe mais. Atualizei o funil.");
}

export async function setOpportunityOwner(id: string, assignedTo: string | null): Promise<void> {
  const { error } = await db.from("opportunities").update({ assigned_to: assignedTo }).eq("id", id);
  if (error) throw error;
}

export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await db.from("opportunities").delete().eq("id", id);
  if (error) throw error;
}

async function nextPosition(stageId: string): Promise<number> {
  const { data, error } = await db
    .from("opportunities")
    .select("position")
    .eq("stage_id", stageId)
    .order("position", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0]?.position ?? 0) + 1;
}

export async function stageIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await db
    .from("pipeline_stages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Garante uma oportunidade para o contato (uma por contato no app). Devolve a existente se já houver. */
export async function ensureOpportunity(
  contactId: string,
  stageId: string,
  title: string | null = null,
): Promise<{ id: string; created: boolean }> {
  const found = await db.from("opportunities").select("id").eq("contact_id", contactId).limit(1);
  if (found.error) throw found.error;
  if (found.data && found.data[0]) return { id: found.data[0].id, created: false };
  const position = await nextPosition(stageId);
  const ins = await db
    .from("opportunities")
    .insert({
      contact_id: contactId,
      stage_id: stageId,
      title,
      position,
      last_interaction_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (ins.error) throw ins.error;
  return { id: ins.data.id, created: true };
}

/** Define a etapa do contato: cria a oportunidade se ainda não existir, senão move para o fim da etapa. */
export async function setContactStage(contactId: string, stageId: string): Promise<void> {
  const found = await db
    .from("opportunities")
    .select("id, stage_id")
    .eq("contact_id", contactId)
    .limit(1);
  if (found.error) throw found.error;
  const existing = found.data?.[0];
  if (!existing) {
    await ensureOpportunity(contactId, stageId);
    return;
  }
  if (existing.stage_id === stageId) return;
  await moveOpportunity(existing.id, stageId, await nextPosition(stageId));
}

export async function fetchContactStage(
  contactId: string,
): Promise<{ id: string; stage_id: string } | null> {
  const { data, error } = await db
    .from("opportunities")
    .select("id, stage_id")
    .eq("contact_id", contactId)
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}
