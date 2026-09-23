import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ContentDialog } from "@/components/ContentDialog";
import { FunnelSummary } from "@/components/FunnelSummary";
import { Button } from "@/components/ui/button";
import {
  FUNNEL_CLASSES,
  FUNNEL_LABEL,
  FUNNEL_STAGES,
  MONTHS,
  WEEKDAYS,
  fetchClients,
  fetchContents,
  iso,
  monthGrid,
  type Content,
} from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Calendário de conteúdo | Astarita" },
      {
        name: "description",
        content:
          "Planejamento mensal de conteúdo da Astarita: calendário editorial por cliente com análise de funil.",
      },
      { property: "og:title", content: "Calendário de conteúdo | Astarita" },
      {
        property: "og:description",
        content: "Calendário editorial por cliente com análise de funil de conteúdo.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(9); // Outubro
  const [clientFilter, setClientFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Content | null>(null);
  const [defaultDate, setDefaultDate] = useState(iso(2026, 9, 1));

  const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: fetchClients });
  const clients = clientsQuery.data ?? [];
  const currentClient = clients.find((c) => c.id === clientFilter);

  const monthStart = iso(year, month, 1);
  const monthEnd = iso(year, month, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());

  const contentsQuery = useQuery({
    queryKey: ["contents", monthStart],
    queryFn: () => fetchContents(monthStart, monthEnd),
  });

  const visible = useMemo(() => {
    const all = contentsQuery.data ?? [];
    return clientFilter === "all" ? all : all.filter((c) => c.client_id === clientFilter);
  }, [contentsQuery.data, clientFilter]);

  const byDay = useMemo(() => {
    const map = new Map<string, Content[]>();
    for (const c of visible) {
      const list = map.get(c.publication_date) ?? [];
      list.push(c);
      map.set(c.publication_date, list);
    }
    return map;
  }, [visible]);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";
  const clientColor = (id: string) => clients.find((c) => c.id === id)?.color ?? "#0805f1";

  // Abre o calendário do primeiro cliente automaticamente.
  useEffect(() => {
    if (clientFilter === "all" && clients[0]) setClientFilter(clients[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients.length]);

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  };

  const openNew = (date: string) => {
    setEditing(null);
    setDefaultDate(date);
    setDialogOpen(true);
  };

  const openEdit = (content: Content) => {
    setEditing(content);
    setDialogOpen(true);
  };

  const refresh = () => contentsQuery.refetch();
  const cells = monthGrid(year, month);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <p className="text-xs font-semibold uppercase text-primary/65">Centro de planejamento</p>
            <h1 className="font-display mt-1 text-2xl font-bold text-primary sm:text-3xl">
              {currentClient ? `Calendário de ${currentClient.name}` : "Calendário editorial"}
            </h1>
          </div>

          <div className="glass-soft flex items-center gap-1 rounded-2xl px-1">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium uppercase tracking-wide">
              {MONTHS[month]} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => openNew(iso(year, month, 1))}>
            <Plus className="h-4 w-4" /> Novo conteúdo
          </Button>
        </div>

        {/* Cada cliente tem seu próprio calendário */}
        <div className="flex flex-wrap gap-2">
          {clients.map((c) => {
            const active = clientFilter === c.id;
            return (
              <Button
                key={c.id}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => setClientFilter(c.id)}
                className="rounded-xl"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: active ? "currentColor" : c.color }}
                />
                {c.name}
              </Button>
            );
          })}
          <Button
            type="button"
            variant={clientFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setClientFilter("all")}
            className="rounded-xl"
          >
            Todos os clientes
          </Button>
        </div>

        <FunnelSummary
          title={clientFilter === "all" ? "Todos os clientes" : clientName(clientFilter)}
          subtitle={`${MONTHS[month]?.toUpperCase()} ${year}`}
          contents={visible}
        />

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {FUNNEL_STAGES.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${FUNNEL_CLASSES[s].dot}`} />
              {FUNNEL_LABEL[s]}
            </span>
          ))}
        </div>

        {/* Desktop: grid do mês */}
        <div className="glass-soft hidden overflow-hidden rounded-[1.75rem] md:block">
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const date = day ? iso(year, month, day) : "";
              const items = day ? byDay.get(date) ?? [] : [];
              return (
                <div
                  key={i}
                  className="min-h-28 border-b border-r border-border/70 p-1.5 last:border-r-0"
                >
                  {day && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => openNew(date)}
                        className="mb-1 h-7 w-full justify-start px-2 text-[11px] text-muted-foreground"
                      >
                        {day}
                      </Button>
                      <div className="space-y-1">
                        {items.map((c) => (
                          <ContentBlock
                            key={c.id}
                            content={c}
                            clientName={clientName(c.client_id)}
                             onClick={() => openEdit(c)}
                             fallbackColor={clientColor(c.client_id)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: agenda por data */}
        <div className="space-y-3 md:hidden">
          {[...byDay.keys()].sort().length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum conteúdo neste mês.</p>
          )}
          {[...byDay.keys()]
            .sort()
            .map((date) => (
              <div key={date} className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {Number(date.slice(8, 10))} de {MONTHS[month]}
                </p>
                <div className="space-y-1">
                  {(byDay.get(date) ?? []).map((c) => (
                    <ContentBlock
                      key={c.id}
                      content={c}
                      clientName={clientName(c.client_id)}
                      onClick={() => openEdit(c)}
                      fallbackColor={clientColor(c.client_id)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      <ContentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients}
        content={editing}
        defaultDate={defaultDate}
        {...(clientFilter !== "all" ? { defaultClientId: clientFilter } : {})}
        onSaved={refresh}
      />
    </>
  );
}

function ContentBlock({
  content,
  clientName,
  fallbackColor,
  onClick,
}: {
  content: Content;
  clientName: string;
  fallbackColor: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      style={{ borderLeftColor: content.color ?? fallbackColor }}
      className="glass-lift h-auto w-full justify-start rounded-xl border border-border/70 border-l-4 bg-card/55 px-2 py-1.5 text-left hover:bg-card/80"
    >
      <span className="block truncate text-[10px] font-semibold uppercase tracking-wide opacity-80">
        {clientName}
      </span>
      <span className="block truncate text-[11px] font-semibold text-foreground">
        {content.title}
      </span>
      <span className="block truncate text-[10px] uppercase opacity-70">{content.format}</span>
    </Button>
  );
}
