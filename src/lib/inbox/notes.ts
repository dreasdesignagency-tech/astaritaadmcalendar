import { db } from "@/lib/inbox/client";

export type InternalNote = {
  id: string;
  contact_id: string;
  body: string;
  created_by: string | null;
  created_at: string;
};

export async function fetchNotes(contactId: string): Promise<InternalNote[]> {
  const { data, error } = await db
    .from("internal_notes")
    .select("id, contact_id, body, created_by, created_at")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as InternalNote[];
}

export async function addNote(contactId: string, body: string, userId: string): Promise<void> {
  const text = body.trim();
  if (!text) throw new Error("Escreva a observação.");
  // created_by precisa ser o próprio usuário (a política do banco exige).
  const { error } = await db
    .from("internal_notes")
    .insert({ contact_id: contactId, body: text, created_by: userId });
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await db.from("internal_notes").delete().eq("id", id);
  if (error) throw error;
}
