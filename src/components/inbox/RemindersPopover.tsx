import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchTeam } from "@/lib/inbox/api";
import { openConversationFor } from "@/lib/inbox/contacts";
import { useFallbackInterval } from "@/lib/inbox/realtime";
import { fetchPendingReminders, setReminderStatus } from "@/lib/inbox/reminders";
import { bucketReminders, formatDue } from "@/lib/inbox/reminders-logic";
import { cn } from "@/lib/utils";

const LABEL = { overdue: "Atrasados", today: "Hoje", upcoming: "Próximos" } as const;

/** Seção discreta de lembretes pendentes: um sino no cabeçalho com a contagem do que está atrasado ou vence hoje. */
export function RemindersPopover() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const interval = useFallbackInterval();
  const reminders = useQuery({
    queryKey: ["inbox", "reminders"],
    queryFn: fetchPendingReminders,
    refetchInterval: interval,
  });
  const team = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });
  const [open, setOpen] = useState(false);

  const groups = bucketReminders(reminders.data ?? []);
  const urgent = groups.overdue.length + groups.today.length;
  const total = urgent + groups.upcoming.length;
  const owner = (id: string | null) => team.data?.find((p) => p.id === id)?.full_name;

  const done = async (id: string) => {
    try {
      await setReminderStatus(id, "done");
      await queryClient.invalidateQueries({ queryKey: ["inbox", "reminders"] });
    } catch {
      toast.error("Não foi possível concluir o lembrete.");
    }
  };

  const openChat = async (contactId: string) => {
    try {
      const id = await openConversationFor(contactId, null);
      setOpen(false);
      void navigate({ to: "/inbox", search: { c: id } });
    } catch {
      toast.error("Não foi possível abrir a conversa.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={
            urgent > 0
              ? `Lembretes pendentes, ${urgent} atrasados ou para hoje`
              : "Lembretes pendentes"
          }
        >
          <Bell className="h-5 w-5" />
          {urgent > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {urgent}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="inbox-theme w-[min(92vw,22rem)] rounded-3xl p-4">
        <p className="mb-2 font-display text-sm font-semibold">Lembretes pendentes</p>
        {reminders.isPending && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {reminders.isError && (
          <p className="text-sm text-destructive">Não foi possível carregar.</p>
        )}
        {!reminders.isPending && !reminders.isError && total === 0 && (
          <p className="text-sm text-muted-foreground">
            Nada pendente. Crie lembretes pelo painel de um contato.
          </p>
        )}
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {(["overdue", "today", "upcoming"] as const).map((k) =>
            groups[k].length === 0 ? null : (
              <div key={k}>
                <p
                  className={cn(
                    "mb-1 text-[11px] font-semibold uppercase tracking-wide",
                    k === "overdue" ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {LABEL[k]}
                </p>
                <ul className="space-y-1.5">
                  {groups[k].map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start gap-2 rounded-2xl bg-secondary px-3 py-2"
                    >
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => void openChat(r.contact_id)}
                      >
                        <span className="block truncate text-sm font-medium">{r.contact.name}</span>
                        <span className="block break-words text-xs text-muted-foreground">
                          {r.description}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {formatDue(r.due_at)}
                          {owner(r.assigned_to) ? ` · ${owner(r.assigned_to)}` : ""}
                        </span>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        aria-label="Concluir lembrete"
                        onClick={() => void done(r.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
