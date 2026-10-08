/** Agrupamento de lembretes por urgência. Sem imports, para ser testada sozinha. */
export type ReminderLike = { id: string; due_at: string; status: string };

export type ReminderBucket = "overdue" | "today" | "upcoming";

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function reminderBucket(dueAt: string, now: number = Date.now()): ReminderBucket {
  const due = Date.parse(dueAt);
  if (due < now) return "overdue";
  const endOfToday = startOfDay(now) + 24 * 60 * 60 * 1000;
  return due < endOfToday ? "today" : "upcoming";
}

export function bucketReminders<T extends ReminderLike>(
  list: T[],
  now: number = Date.now(),
): Record<ReminderBucket, T[]> {
  const out: Record<ReminderBucket, T[]> = { overdue: [], today: [], upcoming: [] };
  for (const r of list) {
    if (r.status !== "pending") continue;
    out[reminderBucket(r.due_at, now)].push(r);
  }
  for (const k of Object.keys(out) as ReminderBucket[])
    out[k].sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at));
  return out;
}

export function formatDue(dueAt: string, now: number = Date.now()): string {
  const d = new Date(dueAt);
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const b = reminderBucket(dueAt, now);
  if (b === "today") return `hoje às ${time}`;
  if (b === "overdue" && startOfDay(now) <= d.getTime()) return `hoje às ${time}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${time}`;
}

/** Valor do <input type="datetime-local"> (hora local) para ISO UTC, e o contrário. */
export function localInputToIso(value: string): string | null {
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
