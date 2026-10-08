import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Image as ImageIcon,
  Mic,
  MessageSquare,
  Video,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageRow } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

const MEDIA_LABEL: Partial<
  Record<MessageRow["type"], { label: string; received: string; icon: typeof FileText }>
> = {
  image: { label: "Imagem", received: "Imagem recebida", icon: ImageIcon },
  document: { label: "Documento", received: "Documento recebido", icon: FileText },
  audio: { label: "Áudio", received: "Áudio recebido", icon: Mic },
  video: { label: "Vídeo", received: "Vídeo recebido", icon: Video },
  sticker: { label: "Figurinha", received: "Figurinha recebida", icon: ImageIcon },
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Indicador de envio: só mostra "enviado" quando o banco confirma (o backend atualiza o status). */
function DeliveryMark({ message }: { message: MessageRow }) {
  switch (message.status) {
    case "pending":
      return <Clock className="h-3 w-3" aria-label="Enviando" />;
    case "sent":
      return <Check className="h-3 w-3" aria-label="Enviada" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3" aria-label="Entregue" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-sky-200" aria-label="Lida" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-red-200" aria-label="Falha no envio" />;
    default:
      return null;
  }
}

export function MessageList({
  messages,
  loading,
  error,
  onRetry,
}: {
  messages: MessageRow[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  if (loading) {
    return (
      <div className="flex-1 space-y-3 p-6">
        <Skeleton className="h-12 w-2/3 rounded-3xl" />
        <Skeleton className="ml-auto h-12 w-1/2 rounded-3xl" />
        <Skeleton className="h-12 w-3/5 rounded-3xl" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState tone="error" icon={WifiOff} title="Erro de conexão">
          Não foi possível carregar as mensagens.
          <button
            onClick={onRetry}
            className="mt-2 block w-full font-medium text-primary hover:underline"
          >
            Tentar de novo
          </button>
        </EmptyState>
      </div>
    );
  }
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={MessageSquare} title="Nenhuma mensagem ainda">
          As mensagens recebidas aparecem aqui assim que chegarem.
        </EmptyState>
      </div>
    );
  }

  let currentDay = "";
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      role="log"
      aria-live="polite"
      aria-label="Histórico de mensagens"
    >
      <ul className="flex flex-col gap-1.5">
        {messages.map((m) => {
          const day = new Date(m.created_at).toDateString();
          const showDay = day !== currentDay;
          currentDay = day;
          const out = m.direction === "out";
          const media = MEDIA_LABEL[m.type];
          return (
            <li key={m.id} className="flex flex-col">
              {showDay && (
                <span className="my-3 self-center rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
                  {dayLabel(m.created_at)}
                </span>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-3xl px-4 py-2.5 text-sm sm:max-w-[70%]",
                  out
                    ? "self-end rounded-br-lg bg-primary text-primary-foreground"
                    : "self-start rounded-bl-lg border border-border bg-card",
                  m.status === "failed" && "bg-destructive text-destructive-foreground",
                )}
              >
                {media && (
                  <p className="mb-1 flex items-center gap-1.5 text-xs opacity-80">
                    <media.icon className="h-3.5 w-3.5" />{" "}
                    {m.direction === "in" ? media.received : media.label}
                  </p>
                )}
                {m.type === "unsupported" && (
                  <p className="text-xs opacity-80">Tipo de mensagem não suportado</p>
                )}
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                <p
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[10px]",
                    out ? "opacity-80" : "text-muted-foreground",
                  )}
                >
                  {time(m.created_at)}
                  {out && <DeliveryMark message={m} />}
                </p>
                {m.status === "failed" && (
                  <p className="mt-1 text-[11px]">
                    Não enviada{m.error_message ? `: ${m.error_message}` : "."}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={endRef} />
    </div>
  );
}
