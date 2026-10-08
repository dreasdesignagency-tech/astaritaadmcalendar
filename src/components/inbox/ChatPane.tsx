import { ArrowLeft, MessageSquare, PanelRight, Send } from "lucide-react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { UserAvatar } from "@/components/inbox/UserAvatar";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, type ConversationRow, type InboxProfile } from "@/lib/inbox/types";

export function ChatPane({
  conversation,
  team,
  onBack,
  onOpenDetails,
}: {
  conversation: ConversationRow | undefined;
  team: InboxProfile[];
  onBack: () => void;
  onOpenDetails: () => void;
}) {
  if (!conversation) {
    return (
      <section className="inbox-surface hidden min-h-0 items-center justify-center rounded-[2rem] md:flex">
        <EmptyState icon={MessageSquare} title="Selecione uma conversa">
          O histórico e o campo de resposta aparecem aqui.
        </EmptyState>
      </section>
    );
  }

  const owner = team.find((p) => p.id === conversation.assigned_to)?.full_name;

  return (
    <section
      className="inbox-surface flex min-h-0 flex-col overflow-hidden rounded-[2rem]"
      aria-label="Conversa"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          onClick={onBack}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <UserAvatar name={conversation.contact.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversation.contact.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {STATUS_LABEL[conversation.status]} · {owner ?? "Sem responsável"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full lg:hidden"
          onClick={onOpenDetails}
          aria-label="Abrir detalhes do contato"
        >
          <PanelRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center bg-secondary/50">
        <EmptyState icon={MessageSquare} title="Histórico de mensagens">
          A exibição das mensagens chega na Fase 2.
        </EmptyState>
      </div>

      <div className="shrink-0 border-t border-border p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <textarea
            disabled
            rows={2}
            placeholder="O envio pelo WhatsApp entra na Fase 4."
            className="min-h-[52px] flex-1 resize-none rounded-3xl border border-border bg-secondary px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Mensagem"
          />
          <Button
            disabled
            className="h-[52px] w-[52px] rounded-full"
            size="icon"
            aria-label="Enviar"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
