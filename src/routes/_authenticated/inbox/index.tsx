import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ChatPane } from "@/components/inbox/ChatPane";
import { ConversationList, type ConversationFilter } from "@/components/inbox/ConversationList";
import { DetailsPanel } from "@/components/inbox/DetailsPanel";
import { PageHeader } from "@/components/inbox/PageHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fetchConversations, fetchTeam } from "@/lib/inbox/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inbox/")({
  validateSearch: (search: Record<string, unknown>): { c?: string } => {
    const c = search["c"];
    return typeof c === "string" && c.length > 0 ? { c } : {};
  },
  component: InboxPage,
});

function InboxPage() {
  const { c: selectedId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const conversations = useQuery({
    queryKey: ["inbox", "conversations"],
    queryFn: fetchConversations,
  });
  const teamQuery = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });

  const rows = conversations.data ?? [];
  const team = teamQuery.data ?? [];
  const selected = rows.find((r) => r.id === selectedId);
  // Um id que não existe mais (ou que ainda carrega) volta para a lista no celular.
  const activeId = selected?.id;

  const select = (id: string) => void navigate({ search: { c: id } });
  const back = () => void navigate({ search: {} });

  const subtitle = conversations.isPending
    ? "Carregando conversas…"
    : rows.length === 0
      ? "Nenhuma conversa ainda"
      : `${rows.length} ${rows.length === 1 ? "conversa" : "conversas"}`;

  return (
    <>
      <PageHeader
        title="Caixa de entrada"
        subtitle={subtitle}
        search={{ value: query, onChange: setQuery, placeholder: "Buscar conversas" }}
      />

      <div className="grid min-h-0 flex-1 gap-3 sm:gap-4 md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(260px,320px)]">
        {/* No celular, lista e chat são telas separadas. */}
        <div className={cn("min-h-0", activeId ? "hidden md:grid" : "grid")}>
          <ConversationList
            rows={rows}
            loading={conversations.isPending}
            error={conversations.isError}
            onRetry={() => void conversations.refetch()}
            filter={filter}
            onFilterChange={setFilter}
            query={query}
            selectedId={activeId}
            onSelect={select}
            team={team}
            totalCount={rows.length}
          />
        </div>

        <div className={cn("min-h-0", activeId ? "grid" : "hidden md:grid")}>
          <ChatPane
            conversation={selected}
            team={team}
            onBack={back}
            onOpenDetails={() => setDetailsOpen(true)}
          />
        </div>

        <div className="hidden min-h-0 lg:grid">
          <DetailsPanel conversation={selected} team={team} />
        </div>
      </div>

      {/* Tablet e celular: o painel de detalhes abre sob demanda. */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="inbox-theme w-[92vw] overflow-y-auto bg-background sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Detalhes</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <DetailsPanel conversation={selected} team={team} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
