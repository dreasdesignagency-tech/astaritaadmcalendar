import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, MessageSquare, PanelRight, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Composer } from "@/components/inbox/Composer";
import { EmptyState } from "@/components/inbox/EmptyState";
import { MessageList } from "@/components/inbox/MessageList";
import { retrySend } from "@/lib/inbox/messaging";
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
  draft,
  onDraftChange,
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
  draft: string;
  onDraftChange: (text: string) => void;
}) {
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const conversationId = conversation?.id;
  useEffect(() => setReplyTo(null), [conversationId]);

  const retry = async (m: MessageRow) => {
    const r = await retrySend(m.id);
    await queryClient.invalidateQueries({ queryKey: ["inbox", "messages", m.conversation_id] });
    if (!r.ok) toast.error(r.error);
  };

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
          onReply={setReplyTo}
          onRetrySend={(m) => void retry(m)}
        />
      </div>

      <Composer
        conversation={conversation}
        draft={draft}
        onDraftChange={onDraftChange}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
      />
    </section>
  );
}
