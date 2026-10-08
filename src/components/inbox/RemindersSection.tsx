import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchTeam } from "@/lib/inbox/api";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { useFallbackInterval } from "@/lib/inbox/realtime";
import { createReminder, fetchPendingReminders, setReminderStatus } from "@/lib/inbox/reminders";
import {
  formatDue,
  isoToLocalInput,
  localInputToIso,
  reminderBucket,
} from "@/lib/inbox/reminders-logic";
import { cn } from "@/lib/utils";

const NONE = "none";

/** Lembretes internos de um contato (retornar contato, confirmar reunião, acompanhar proposta…). Sem notificação externa. */
export function RemindersSection({ contactId }: { contactId: string }) {
  const profile = useInboxProfile();
  const queryClient = useQueryClient();
  const interval = useFallbackInterval();
  const reminders = useQuery({
    queryKey: ["inbox", "reminders"],
    queryFn: fetchPendingReminders,
    refetchInterval: interval,
  });
  const team = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });

  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [due, setDue] = useState(() =>
    isoToLocalInput(new Date(Date.now() + 24 * 3600_000).toISOString()),
  );
  const [assignee, setAssignee] = useState<string>(profile.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mine = (reminders.data ?? []).filter((r) => r.contact_id === contactId);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["inbox", "reminders"] });
  const ownerName = (id: string | null) => team.data?.find((p) => p.id === id)?.full_name;

  const submit = async () => {
    if (busy) return;
    const iso = localInputToIso(due);
    if (!description.trim()) return setError("Descreva o lembrete.");
    if (!iso) return setError("Informe uma data e hora válidas.");
    setBusy(true);
    setError(null);
    try {
      await createReminder(
        {
          contact_id: contactId,
          description,
          due_at: iso,
          assigned_to: assignee === NONE ? null : assignee,
        },
        profile.id,
      );
      setDescription("");
      setOpen(false);
      toast.success("Lembrete criado.");
      await refresh();
    } catch {
      setError("Não foi possível salvar. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const mark = async (id: string, status: "done" | "cancelled") => {
    try {
      await setReminderStatus(id, status);
      await refresh();
    } catch {
      toast.error("Não foi possível atualizar o lembrete.");
    }
  };

  return (
    <section className="inbox-surface rounded-[2rem] p-5" aria-label="Lembretes do contato">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Lembretes</h2>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Fechar" : "Novo lembrete"}
        </Button>
      </div>

      {open && (
        <form
          className="mb-3 grid gap-2 rounded-2xl bg-secondary p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Input
            placeholder="Ex.: retornar sobre a proposta"
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Descrição do lembrete"
          />
          <Input
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Data e hora do lembrete"
          />
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger aria-label="Responsável pelo lembrete">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="inbox-theme">
              <SelectItem value={NONE}>Sem responsável</SelectItem>
              {team.data
                ?.filter((p) => p.active)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="sm" className="justify-self-end rounded-full" disabled={busy}>
            Salvar lembrete
          </Button>
        </form>
      )}

      <ul className="space-y-2">
        {reminders.isPending && <li className="text-sm text-muted-foreground">Carregando…</li>}
        {reminders.isError && (
          <li className="text-sm text-destructive">Não foi possível carregar os lembretes.</li>
        )}
        {!reminders.isPending && !reminders.isError && mine.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum lembrete pendente.</li>
        )}
        {mine.map((r) => (
          <li key={r.id} className="flex items-start gap-2 rounded-2xl bg-secondary px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm">{r.description}</p>
              <p
                className={cn(
                  "text-[11px]",
                  reminderBucket(r.due_at) === "overdue"
                    ? "font-medium text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {reminderBucket(r.due_at) === "overdue" ? "Atrasado: " : ""}
                {formatDue(r.due_at)}
                {ownerName(r.assigned_to) ? ` · ${ownerName(r.assigned_to)}` : ""}
              </p>
            </div>
            <button
              onClick={() => void mark(r.id, "done")}
              aria-label="Concluir lembrete"
              className="rounded-full p-1.5 hover:bg-card hover:text-primary"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => void mark(r.id, "cancelled")}
              aria-label="Cancelar lembrete"
              className="rounded-full p-1.5 hover:bg-card hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
