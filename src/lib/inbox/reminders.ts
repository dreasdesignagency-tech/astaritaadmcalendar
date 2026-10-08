import { db } from "@/lib/inbox/client";

export type Reminder = {
  id: string;
  contact_id: string;
  description: string;
  due_at: string;
  assigned_to: string | null;
  status: "pending" | "done" | "cancelled";
  contact: { id: string; name: string };
};

const SELECT =
  "id, contact_id, description, due_at, assigned_to, status, contact:contacts!inner(id, name)";

export async function fetchPendingReminders(): Promise<Reminder[]> {
  const { data, error } = await db
    .from("reminders")
    .select(SELECT)
    .eq("status", "pending")
    .order("due_at")
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as Reminder[];
}

export type ReminderInput = {
  contact_id: string;
  description: string;
  due_at: string;
  assigned_to: string | null;
};

export async function createReminder(input: ReminderInput, userId: string): Promise<void> {
  const description = input.description.trim();
  if (!description) throw new Error("Descreva o lembrete.");
  const { error } = await db
    .from("reminders")
    .insert({ ...input, description, created_by: userId });
  if (error) throw error;
}

export async function setReminderStatus(
  id: string,
  status: "done" | "cancelled" | "pending",
): Promise<void> {
  const { error } = await db.from("reminders").update({ status }).eq("id", id);
  if (error) throw error;
}
