import { db } from "@/lib/inbox/api";
import { normalizeInstagram, normalizePhone, phoneVariants } from "@/lib/inbox/phone";
import type { ContactCategory, ContactRow, TagRow } from "@/lib/inbox/types";

/** Erro com mensagem pronta para mostrar a quem usa o sistema. */
export class InboxUserError extends Error {}

type RawContact = Omit<ContactRow, "tags" | "conversation"> & {
  contact_tags: { tag: TagRow | null }[] | null;
  conversations: NonNullable<ContactRow["conversation"]>[] | null;
};

export async function fetchContacts(): Promise<ContactRow[]> {
  const { data, error } = await db
    .from("contacts")
    .select(
      "id, name, phone, company, instagram, category, assigned_to, notes, created_at, contact_tags(tag:tags(id, name, color)), conversations(id, status, last_message_at)",
    )
    .order("name")
    .limit(2000);
  if (error) throw error;
  return ((data ?? []) as unknown as RawContact[]).map(({ contact_tags, conversations, ...c }) => ({
    ...c,
    tags: (contact_tags ?? []).map((ct) => ct.tag).filter((t): t is TagRow => !!t),
    conversation: conversations?.[0] ?? null,
  }));
}

export async function fetchTags(): Promise<TagRow[]> {
  const { data, error } = await db.from("tags").select("id, name, color").order("name");
  if (error) throw error;
  return (data ?? []) as TagRow[];
}

export type ContactInput = {
  name: string;
  phone: string;
  company: string;
  instagram: string;
  category: ContactCategory;
  assigned_to: string | null;
  notes: string;
  tags: string[]; // nomes
};

const blank = (v: string) => (v.trim() === "" ? null : v.trim());

/** Cria ou atualiza um contato, barrando duplicidade de telefone (inclusive o nono dígito). */
export async function saveContact(input: ContactInput, id?: string): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new InboxUserError("Informe o nome do contato.");
  const phone = normalizePhone(input.phone);
  if (!phone)
    throw new InboxUserError("Telefone inválido. Use DDD + número, por exemplo (11) 99999-8888.");

  const dup = await db
    .from("contacts")
    .select("id, name")
    .in("phone", phoneVariants(phone))
    .limit(2);
  if (dup.error) throw dup.error;
  const clash = (dup.data ?? []).find((c: { id: string }) => c.id !== id);
  if (clash)
    throw new InboxUserError(`Esse telefone já pertence a ${(clash as { name: string }).name}.`);

  const row = {
    name,
    phone,
    company: blank(input.company),
    instagram: normalizeInstagram(input.instagram),
    category: input.category,
    assigned_to: input.assigned_to,
    notes: blank(input.notes),
  };

  let contactId = id;
  if (id) {
    const { error } = await db.from("contacts").update(row).eq("id", id);
    if (error) throw mapError(error);
  } else {
    const { data, error } = await db.from("contacts").insert(row).select("id").single();
    if (error) throw mapError(error);
    contactId = (data as { id: string }).id;
  }
  await syncTags(contactId as string, input.tags);
  return contactId as string;
}

function mapError(error: { code?: string; message?: string }): Error {
  // Outra pessoa pode ter cadastrado o mesmo número entre a checagem e o insert.
  if (error.code === "23505") return new InboxUserError("Esse telefone já está cadastrado.");
  return error as unknown as Error;
}

/** Deixa o contato com exatamente as etiquetas informadas, criando as que ainda não existem. */
async function syncTags(contactId: string, names: string[]) {
  const wanted = [...new Map(names.map((n) => [n.trim().toLowerCase(), n.trim()])).entries()]
    .filter(([key]) => key)
    .map(([, name]) => name);

  const existing = await fetchTags();
  const byKey = new Map(existing.map((t) => [t.name.toLowerCase(), t]));

  const toCreate = wanted.filter((n) => !byKey.has(n.toLowerCase()));
  if (toCreate.length) {
    const { data, error } = await db
      .from("tags")
      .insert(toCreate.map((name) => ({ name })))
      .select("id, name, color");
    if (error) throw error;
    for (const t of (data ?? []) as TagRow[]) byKey.set(t.name.toLowerCase(), t);
  }

  const targetIds = new Set(
    wanted.map((n) => byKey.get(n.toLowerCase())?.id).filter((v): v is string => !!v),
  );
  const current = await db.from("contact_tags").select("tag_id").eq("contact_id", contactId);
  if (current.error) throw current.error;
  const currentIds = new Set((current.data ?? []).map((r: { tag_id: string }) => r.tag_id));

  const add = [...targetIds].filter((t) => !currentIds.has(t));
  const remove = [...currentIds].filter((t) => !targetIds.has(t));
  if (add.length) {
    const { error } = await db
      .from("contact_tags")
      .insert(add.map((tag_id) => ({ contact_id: contactId, tag_id })));
    if (error) throw error;
  }
  if (remove.length) {
    // Só remove o vínculo desta pessoa com a etiqueta; a etiqueta em si continua existindo.
    const { error } = await db
      .from("contact_tags")
      .delete()
      .eq("contact_id", contactId)
      .in("tag_id", remove);
    if (error) throw error;
  }
}

/** Devolve o id da conversa do contato, criando-a se ainda não existir. */
export async function openConversationFor(
  contactId: string,
  defaultAssignee: string | null,
): Promise<string> {
  const found = await db
    .from("conversations")
    .select("id")
    .eq("contact_id", contactId)
    .maybeSingle();
  if (found.error) throw found.error;
  if (found.data) return (found.data as { id: string }).id;

  // ignoreDuplicates: se outra pessoa criou ao mesmo tempo, nada é sobrescrito.
  const up = await db.from("conversations").upsert(
    {
      contact_id: contactId,
      assigned_to: defaultAssignee,
      status: defaultAssignee ? "in_progress" : "waiting",
    },
    { onConflict: "contact_id", ignoreDuplicates: true },
  );
  if (up.error) throw up.error;
  const again = await db.from("conversations").select("id").eq("contact_id", contactId).single();
  if (again.error) throw again.error;
  return (again.data as { id: string }).id;
}
