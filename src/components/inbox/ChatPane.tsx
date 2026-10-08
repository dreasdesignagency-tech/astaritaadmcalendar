import { ArrowLeft, CheckCircle2, MessageSquare, PanelRight, RotateCcw, Send } from "lucide-react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { MessageList } from "@/components/inbox/MessageList";
import { UserAvatar } from "@/components/inbox/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_LABEL,
  type ConversationRow,
  type InboxProfile,
  type MessageRow,
} from "@/lib/inbox/types";

const NONE = "none";

export function ChatPane({
  conversation,
  team,
  messages,
  messagesLoading,
  messagesError,
  onRetryMessages,
  busy,
  onBack,
  onOpenDetails,
  onResolve,
  onReopen,
  onAssign,
}: {
  conversation: ConversationRow | undefined;
  team: InboxProfile[];
  messages: MessageRow[];
  messagesLoading: boolean;
  messagesError: boolean;
  onRetryMessages: () => void;
  busy: boolean;
  onBack: () => void;
  onOpenDetails: () => void;
  onResolve: () => void;
  onReopen: () => void;
  onAssign: (assigneeId: string | null) => void;
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

  const resolved = conversation.status === "resolved";

  return (
    <section
      className="inbox-surface flex min-h-0 flex-col overflow-hidden rounded-[2rem]"
      aria-label="Conversa"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3 sm:px-6">
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
        <div className="min-w-0 flex-1 basis-40">
          <p className="truncate text-sm font-semibold">{conversation.contact.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {STATUS_LABEL[conversation.status]}
          </p>
        </div>

        <Select
          value={conversation.assigned_to ?? NONE}
          onValueChange={(v) => onAssign(v === NONE ? null : v)}
          disabled={busy}
        >
          <SelectTrigger
            className="h-9 w-40 rounded-full text-xs"
            aria-label="Responsável pela conversa"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="inbox-theme">
            <SelectItem value={NONE}>Sem responsável</SelectItem>
            {team
              .filter((p) => p.active || p.id === conversation.assigned_to)
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {resolved ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={busy}
            onClick={onReopen}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reabrir
          </Button>
        ) : (
          <Button size="sm" className="rounded-full" disabled={busy} onClick={onResolve}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Resolver
          </Button>
        )}

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

      <div className="flex min-h-0 flex-1 flex-col bg-secondary/50">
        {resolved && (
          <p className="shrink-0 bg-highlight/70 px-4 py-2 text-center text-xs">
            Conversa resolvida. Reabra para voltar ao atendimento.
          </p>
        )}
        <MessageList
          messages={messages}
          loading={messagesLoading}
          error={messagesError}
          onRetry={onRetryMessages}
        />
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
