import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Clock, WifiOff } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/inbox/EmptyState";
import { OpportunityDialog } from "@/components/inbox/OpportunityDialog";
import { UserAvatar } from "@/components/inbox/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPipelineStages, fetchTeam } from "@/lib/inbox/api";
import { InboxUserError } from "@/lib/inbox/errors";
import { cardsOfStage, daysSince, dropPosition } from "@/lib/inbox/funnel-logic";
import { fetchOpportunities, moveOpportunity, type OpportunityCard } from "@/lib/inbox/funnel";
import { useFallbackInterval } from "@/lib/inbox/realtime";
import type { PipelineStage } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

const KEY = ["inbox", "opportunities"] as const;

function lastInteractionLabel(iso: string | null): string {
  const d = daysSince(iso);
  if (d === null) return "Sem interação";
  if (d === 0) return "Hoje";
  return d === 1 ? "Há 1 dia" : `Há ${d} dias`;
}

export function FunnelBoard({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const interval = useFallbackInterval();
  const stages = useQuery({ queryKey: ["inbox", "stages"], queryFn: fetchPipelineStages });
  const opps = useQuery({ queryKey: KEY, queryFn: fetchOpportunities, refetchInterval: interval });
  const team = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });

  const dragId = useRef<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [selected, setSelected] = useState<OpportunityCard | null>(null);

  const q = search.trim().toLowerCase();
  const cards = useMemo(() => {
    const all = opps.data ?? [];
    if (!q) return all;
    return all.filter((c) =>
      [c.contact.name, c.contact.company, c.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [opps.data, q]);

  const owner = (id: string | null) => team.data?.find((p) => p.id === id);

  /** Solta o cartão numa etapa, antes do cartão `beforeId` (ou no fim). Atualiza a tela na hora e confirma no banco. */
  const drop = async (stageId: string, beforeId: string | null) => {
    const id = dragId.current;
    dragId.current = null;
    setOverStage(null);
    if (!id) return;
    const all = opps.data ?? [];
    const moving = all.find((c) => c.id === id);
    if (!moving) return;
    const column = cardsOfStage(
      all.filter((c) => c.id !== id),
      stageId,
    );
    const index = beforeId
      ? Math.max(
          0,
          column.findIndex((c) => c.id === beforeId),
        )
      : column.length;
    const position = dropPosition(column, index);
    if (moving.stage_id === stageId && moving.position === position) return;

    queryClient.setQueryData<OpportunityCard[]>(KEY, (old) =>
      (old ?? []).map((c) => (c.id === id ? { ...c, stage_id: stageId, position } : c)),
    );
    try {
      await moveOpportunity(id, stageId, position);
    } catch (e) {
      toast.error(
        e instanceof InboxUserError
          ? e.message
          : "Não foi possível mover o cartão. Voltei ao estado anterior.",
      );
    } finally {
      void queryClient.invalidateQueries({ queryKey: KEY });
    }
  };

  if (stages.isError || opps.isError) {
    return (
      <EmptyState tone="error" icon={WifiOff} title="Erro de conexão">
        Não foi possível carregar o funil.
        <button
          onClick={() => {
            void stages.refetch();
            void opps.refetch();
          }}
          className="mt-2 block w-full font-medium text-primary hover:underline"
        >
          Tentar de novo
        </button>
      </EmptyState>
    );
  }

  if (stages.isPending || opps.isPending) {
    return (
      <div className="flex h-full min-w-max gap-3">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-full w-60 rounded-3xl" />
        ))}
      </div>
    );
  }

  const stageList: PipelineStage[] = stages.data;
  return (
    <>
      <div className="flex h-full min-w-max gap-3" role="list" aria-label="Etapas do funil">
        {stageList.map((stage) => {
          const column = cardsOfStage(cards, stage.id);
          const active = overStage === stage.id;
          return (
            <section
              key={stage.id}
              role="listitem"
              aria-label={`${stage.name}, ${column.length} oportunidades`}
              onDragOver={(e) => {
                if (!dragId.current) return;
                e.preventDefault();
                if (overStage !== stage.id) setOverStage(stage.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                  setOverStage((s) => (s === stage.id ? null : s));
              }}
              onDrop={(e) => {
                e.preventDefault();
                void drop(stage.id, null);
              }}
              className={cn(
                "flex h-full w-60 shrink-0 flex-col rounded-3xl bg-secondary p-3 transition-colors",
                active && "bg-accent ring-2 ring-primary/40",
              )}
            >
              <header className="px-1 pb-2">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {stage.name}
                  <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {column.length}
                  </span>
                </p>
                {(stage.is_won || stage.is_lost) && (
                  <p className="text-[11px] text-muted-foreground">
                    {stage.is_won ? "Negócios fechados" : "Negócios perdidos"}
                  </p>
                )}
              </header>
              <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                {column.map((card) => {
                  const o = owner(card.assigned_to);
                  const idle = daysSince(card.last_interaction_at);
                  return (
                    <li key={card.id}>
                      <button
                        draggable
                        onDragStart={(e) => {
                          dragId.current = card.id;
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", card.id);
                        }}
                        onDragEnd={() => {
                          dragId.current = null;
                          setOverStage(null);
                        }}
                        onDragOver={(e) => {
                          if (dragId.current && dragId.current !== card.id) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void drop(stage.id, card.id);
                        }}
                        onClick={() => setSelected(card)}
                        className="w-full cursor-grab rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:shadow-md active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="block truncate text-sm font-semibold">
                          {card.contact.name}
                        </span>
                        {card.contact.company && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {card.contact.company}
                          </span>
                        )}
                        <span className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "flex items-center gap-1 text-[11px]",
                              idle !== null && idle >= 7
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {lastInteractionLabel(card.last_interaction_at)}
                          </span>
                          {o ? (
                            <UserAvatar
                              name={o.full_name}
                              src={o.avatar_url}
                              className="h-6 w-6 text-[10px]"
                            />
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              Sem responsável
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {column.length === 0 && (
                  <li className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border py-6 text-xs text-muted-foreground">
                    {q ? "Nada aqui" : "Arraste um cartão para cá"}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      <OpportunityDialog
        card={selected}
        stages={stageList}
        team={team.data ?? []}
        onClose={() => setSelected(null)}
        onOpenConversation={(conversationId) =>
          void navigate({ to: "/inbox", search: { c: conversationId } })
        }
      />
    </>
  );
}
