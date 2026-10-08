import { db } from "@/lib/inbox/client";
import type { QuickReplyCategory } from "@/lib/inbox/templates";

export type QuickReply = {
  id: string;
  category: QuickReplyCategory;
  title: string;
  body: string;
  updated_at: string;
};

export async function fetchQuickReplies(): Promise<QuickReply[]> {
  const { data, error } = await db
    .from("quick_replies")
    .select("id, category, title, body, updated_at")
    .order("category")
    .order("title");
  if (error) throw error;
  return (data ?? []) as QuickReply[];
}

export type QuickReplyInput = { category: QuickReplyCategory; title: string; body: string };

export async function saveQuickReply(
  input: QuickReplyInput,
  userId: string,
  id?: string,
): Promise<void> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) throw new Error("Preencha título e texto.");
  if (id) {
    const { error } = await db
      .from("quick_replies")
      .update({ category: input.category, title, body })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await db
      .from("quick_replies")
      .insert({ category: input.category, title, body, created_by: userId });
    if (error) throw error;
  }
}

export async function deleteQuickReply(id: string): Promise<void> {
  const { error } = await db.from("quick_replies").delete().eq("id", id);
  if (error) throw error;
}
