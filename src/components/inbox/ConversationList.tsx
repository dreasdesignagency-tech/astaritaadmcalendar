import { Inbox, SearchX, WifiOff } from "lucide-react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { UserAvatar } from "@/components/inbox/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABEL, type ConversationRow, type InboxProfile } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

export type ConversationFilter = "all" | "unread" | "waiting" | "in_progress" | "resolved";

export const FILTERS: { id: ConversationFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "Não lidas" },
  { id: "waiting", label: "Aguardando resposta" },
  { id: "in_progress", label: "Em atendimento" },
  { id: "resolved", label: "Resolvidas" },
];

export function applyFilter(
  rows: ConversationRow[],
  filter: ConversationFilter,
  query: string,
): ConversationRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter === "unread" && row.unread_count === 0) return false;
    if (filter !== "all" && filter !== "unread" && row.status !== filter) return false;
    if (!q) return true;
    const haystack = [
      row.contact.name,
      row.contact.phone,
      row.contact.company,
      row.last_message_preview,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function ConversationList({
  rows,
  loading,
  error,
  onRetry,
  filter,
  onFilterChange,
  query,
  selectedId,
  onSelect,
  team,
  totalCount,
}: {
  rows: ConversationRow[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  filter: ConversationFilter;
  onFilterChange: (f: ConversationFilter) => void;
  query: string;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  team: InboxProfile[];
  totalCount: number;
}) {
  const visible = applyFilter(rows, filter, query);
  const owner = (id: string | null) => team.find((p) => p.id === id)?.full_name;

  return (
    <section
      className="inbox-surface flex min-h-0 flex-col overflow-hidden rounded-[2rem]"
      aria-label="Conversas"
    >
      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 pt-4 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-accent",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="space-y-2 px-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[68px] rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState tone="error" icon={WifiOff} title="Erro de conexão">
            Não foi possível carregar as conversas.
            <button
              onClick={onRetry}
              className="mt-2 block w-full font-medium text-primary hover:underline"
            >
              Tentar de novo
            </button>
          </EmptyState>
        ) : totalCount === 0 ? (
          <EmptyState icon={Inbox} title="Sem conversas ainda">
            Quando alguém escrever para o WhatsApp da Astarita, a conversa aparece aqui. A conexão
            com o WhatsApp ainda não foi feita.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState icon={SearchX} title="Sem resultados">
            Nenhuma conversa corresponde a este filtro ou busca.
          </EmptyState>
        ) : (
          <ul className="space-y-1">
            {visible.map((row) => {
              const active = row.id === selectedId;
              return (
                <li key={row.id}>
                  <button
                    onClick={() => onSelect(row.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                      active ? "bg-accent" : "hover:bg-secondary",
                    )}
                  >
                    <UserAvatar name={row.contact.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{row.contact.name}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTime(row.last_message_at)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {row.last_message_preview ?? "Sem mensagens"}
                        </span>
                        {row.unread_count > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                            {row.unread_count}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/80">
                        {STATUS_LABEL[row.status]}
                        {owner(row.assigned_to)
                          ? ` · ${owner(row.assigned_to)}`
                          : " · Sem responsável"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
