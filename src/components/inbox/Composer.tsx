import { useQueryClient } from "@tanstack/react-query";
import { CornerUpLeft, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { QuickReplyPicker } from "@/components/inbox/QuickReplyPicker";
import { TemplateDialog } from "@/components/inbox/TemplateDialog";
import { Button } from "@/components/ui/button";
import { useChannelStatus } from "@/lib/inbox/channel";
import { queueAndSend } from "@/lib/inbox/messaging";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import type { ConversationRow, MessageRow } from "@/lib/inbox/types";
import { formatTimeLeft, windowState } from "@/lib/inbox/window";

/**
 * Campo de mensagem. Regras:
 *  - nada é enviado sem clique (ou Enter) de uma pessoa; respostas rápidas e IA só PREENCHEM o campo;
 *  - a mensagem só aparece como enviada depois que o banco confirma (o backend atualiza o status);
 *  - fora da janela de 24h da Meta só modelos aprovados; sem WhatsApp configurado, não envia.
 */
export function Composer({
  conversation,
  draft,
  onDraftChange,
  replyTo,
  onClearReply,
}: {
  conversation: ConversationRow;
  draft: string;
  onDraftChange: (text: string) => void;
  replyTo: MessageRow | null;
  onClearReply: () => void;
}) {
  const profile = useInboxProfile();
  const queryClient = useQueryClient();
  const channel = useChannelStatus();
  const [sending, setSending] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  const win = windowState(conversation.last_inbound_at);
  const configured = channel.data?.whatsapp.configured === true;
  const canType = win.open;
  const canSend = configured && win.open && draft.trim().length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    const { messageId, result } = await queueAndSend({
      conversationId: conversation.id,
      body: draft,
      replyToId: replyTo?.id ?? null,
      userId: profile.id,
    });
    setSending(false);
    if (messageId) {
      // A mensagem existe no banco (enviada ou com a falha visível e botão de tentar de novo): limpa o campo.
      onDraftChange("");
      onClearReply();
      void queryClient.invalidateQueries({ queryKey: ["inbox", "messages", conversation.id] });
      void queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] });
    }
    if (!result.ok) toast.error(result.error);
    area.current?.focus();
  };

  let notice: { tone: "info" | "warn"; text: string } | null = null;
  if (channel.isPending) notice = { tone: "info", text: "Verificando a conexão com o WhatsApp…" };
  else if (channel.isError)
    notice = {
      tone: "warn",
      text: "Não foi possível verificar a conexão com o WhatsApp. Você pode escrever, mas o envio fica bloqueado até a verificação funcionar.",
    };
  else if (!configured)
    notice = {
      tone: "warn",
      text: "WhatsApp não conectado. Você pode preparar a mensagem, mas ela não será enviada até a conexão ser configurada.",
    };
  else if (!win.open)
    notice = {
      tone: "warn",
      text: "A janela de 24 horas desta conversa acabou. A Meta só permite enviar um modelo aprovado agora.",
    };

  return (
    <div className="shrink-0 border-t border-border p-3 sm:p-4">
      {notice && (
        <p
          className={`mb-2 rounded-2xl px-3 py-2 text-xs ${notice.tone === "warn" ? "bg-highlight/70" : "bg-secondary text-muted-foreground"}`}
          role="status"
        >
          {notice.text}
          {configured && !win.open && (
            <Button
              type="button"
              size="sm"
              className="ml-2 h-7 rounded-full"
              onClick={() => setTemplateOpen(true)}
            >
              Enviar modelo aprovado
            </Button>
          )}
        </p>
      )}
      {configured && win.open && (
        <p className="mb-2 px-1 text-[11px] text-muted-foreground">
          Janela de resposta aberta. Faltam {formatTimeLeft(win.msLeft)}.
        </p>
      )}

      {replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-2xl bg-secondary px-3 py-2 text-xs">
          <CornerUpLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 truncate">
            Respondendo: <span className="text-muted-foreground">{replyTo.body ?? "mensagem"}</span>
          </p>
          <button
            type="button"
            onClick={onClearReply}
            aria-label="Cancelar resposta"
            className="rounded-full p-0.5 hover:bg-card"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <QuickReplyPicker
          contactName={conversation.contact.name}
          disabled={!canType}
          onPick={(text) => {
            onDraftChange(draft.trim() ? `${draft.replace(/\s+$/, "")}\n${text}` : text);
            area.current?.focus();
          }}
        />
        <textarea
          ref={area}
          rows={2}
          value={draft}
          disabled={!canType}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              window.matchMedia("(min-width: 768px)").matches
            ) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={
            canType
              ? "Escreva sua mensagem. Enter envia, Shift+Enter quebra a linha."
              : "Campo bloqueado: janela de 24 horas encerrada."
          }
          maxLength={4096}
          className="min-h-[52px] flex-1 resize-none rounded-3xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Mensagem"
        />
        <Button
          type="button"
          className="h-[52px] w-[52px] rounded-full"
          size="icon"
          aria-label="Enviar"
          disabled={!canSend}
          onClick={() => void send()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <TemplateDialog
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        conversationId={conversation.id}
      />
    </div>
  );
}
