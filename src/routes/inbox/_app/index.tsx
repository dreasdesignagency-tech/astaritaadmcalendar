import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ChatPane } from "@/components/inbox/ChatPane";
import { ContactDialog } from "@/components/inbox/ContactDialog";
import { ConversationList, type ConversationFilter } from "@/components/inbox/ConversationList";
import { DetailsPanel } from "@/components/inbox/DetailsPanel";
import { PageHeader } from "@/components/inbox/PageHeader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fetchConversations, fetchTeam } from "@/lib/inbox/api";
import { fetchContacts, InboxUserError, openConversationFor } from "@/lib/inbox/contacts";
import {
  assignConversation,
  fetchMessages,
  markConversationRead,
  reopenConversation,
  resolveConversation,
} from "@/lib/inbox/conversations";
import { useFallbackInterval } from "@/lib/inbox/realtime";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inbox/_app/")({
  validateSearch: (search: Record<string, unknown>): { c?: string } => {
    const c = search["c"];
    return typeof c === "string" && c.length > 0 ? { c } : {};
  },
  component: InboxPage,
});

function InboxPage() {
  const { c: selectedId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const interval = useFallbackInterval();

  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [contactDialog, setContactDialog] = useState<"new" | "edit" | null>(null);
  const [busy, setBusy] = useState(false);
  // Rascunhos por conversa: trocar de conversa não perde o que foi digitado. Nada daqui é enviado sozinho.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const conversations = useQuery({
    queryKey: ["inbox", "conversations"],
    queryFn: fetchConversations,
    refetchInterval: interval,
  });
  const teamQuery = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });
  const contactsQuery = useQuery({ queryKey: ["inbox", "contacts"], queryFn: fetchContacts });

  const rows = conversations.data ?? [];
  const team = teamQuery.data ?? [];
  const selected = rows.find((r) => r.id === selectedId);
  // Um id que não existe mais (ou que ainda carrega) volta para a lista no celular.
  const activeId = selected?.id;
  const fullContact = contactsQuery.data?.find((c) => c.id === selected?.contact.id);

  const messages = useQuery({
    queryKey: ["inbox", "messages", activeId],
    queryFn: () => fetchMessages(activeId as string),
    enabled: !!activeId,
    refetchInterval: interval,
  });

  // Abrir a conversa marca como lida. Mensagens que chegam com ela aberta também.
  const unread = selected?.unread_count ?? 0;
  useEffect(() => {
    if (activeId && unread > 0) {
      void markConversationRead(activeId).then(() =>
        queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] }),
      );
    }
  }, [activeId, unread, queryClient]);

  const draft = activeId ? (drafts[activeId] ?? "") : "";
  const setDraft = (text: string) => {
    if (activeId) setDrafts((d) => ({ ...d, [activeId]: text }));
  };
  const applyDraft = (text: string) => setDraft(text);

  const select = (id: string) => void navigate({ search: { c: id } });
  const back = () => void navigate({ search: {} });

  /** Executa uma ação sobre a conversa e trata conflito (outra pessoa mexeu primeiro). */
  const act = async (action: () => Promise<void>, okMessage: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      toast.success(okMessage);
    } catch (e) {
      toast.error(
        e instanceof InboxUserError
          ? e.message
          : "Não foi possível salvar a alteração. Tente de novo.",
      );
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] });
      setBusy(false);
    }
  };

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
        action={
          <Button className="rounded-full" onClick={() => setContactDialog("new")}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo contato
          </Button>
        }
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
            messages={messages.data ?? []}
            messagesLoading={messages.isPending && !!activeId}
            messagesError={messages.isError}
            onRetryMessages={() => void messages.refetch()}
            busy={busy}
            onBack={back}
            onOpenDetails={() => setDetailsOpen(true)}
            onResolve={() =>
              selected && void act(() => resolveConversation(selected), "Conversa resolvida.")
            }
            onReopen={() =>
              selected && void act(() => reopenConversation(selected), "Conversa reaberta.")
            }
            draft={draft}
            onDraftChange={setDraft}
            onAssign={(id) =>
              selected &&
              void act(
                () => assignConversation(selected, id),
                id ? "Responsável atribuído." : "Responsável removido.",
              )
            }
          />
        </div>

        <div className="hidden min-h-0 lg:grid">
          <DetailsPanel
            conversation={selected}
            team={team}
            tags={fullContact?.tags.map((t) => t.name) ?? []}
            onEditContact={() => setContactDialog("edit")}
            onUseDraft={applyDraft}
          />
        </div>
      </div>

      {/* Tablet e celular: o painel de detalhes abre sob demanda. */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="inbox-theme w-[92vw] overflow-y-auto bg-background sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Detalhes</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <DetailsPanel
              conversation={selected}
              team={team}
              tags={fullContact?.tags.map((t) => t.name) ?? []}
              onUseDraft={(text) => {
                applyDraft(text);
                setDetailsOpen(false);
              }}
              onEditContact={() => {
                setDetailsOpen(false);
                setContactDialog("edit");
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ContactDialog
        open={contactDialog !== null}
        onOpenChange={(open) => !open && setContactDialog(null)}
        contact={contactDialog === "edit" ? fullContact : undefined}
        onSaved={(contactId) => {
          // Contato novo: já abre a conversa para começar o atendimento.
          if (contactDialog === "new") {
            void openConversationFor(contactId, null)
              .then(async (id) => {
                await queryClient.invalidateQueries({ queryKey: ["inbox"] });
                select(id);
              })
              .catch(() => toast.error("Contato salvo, mas não foi possível abrir a conversa."));
          }
        }}
      />
    </>
  );
}
