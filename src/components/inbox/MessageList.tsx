import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  CornerUpLeft,
  MessageSquare,
  RotateCw,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { MediaView } from "@/components/inbox/MediaView";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageRow } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

const MEDIA_TYPES = new Set(["image", "document", "audio", "video", "sticker"]);
/** Pendente há mais que isso, sem confirmação do backend: oferece tentar de novo. */
const STUCK_AFTER_MS = 20_000;

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

/** Indicador de envio: só mostra "enviada" quando o banco confirma (o backend atualiza o status). */
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

const STATUS_TEXT: Record<string, string> = {
  pending: "Enviando…",
  sent: "Enviada",
  delivered: "Entregue",
  read: "Lida",
};

export function MessageList({
  messages,
  loading,
  error,
  onRetry,
  onReply,
  onRetrySend,
}: {
  messages: MessageRow[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onReply: (message: MessageRow) => void;
  onRetrySend: (message: MessageRow) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1];
  const lastKey = last ? `${last.id}:${last.status}` : "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastKey]);

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
          As mensagens aparecem aqui assim que chegarem ou forem enviadas.
        </EmptyState>
      </div>
    );
  }

  const byId = new Map(messages.map((m) => [m.id, m]));
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
          const quoted = m.reply_to_id ? byId.get(m.reply_to_id) : undefined;
          const failed = m.status === "failed";
          const stuck =
            m.status === "pending" && Date.now() - Date.parse(m.created_at) > STUCK_AFTER_MS;
          const hasMedia = MEDIA_TYPES.has(m.type) && (m.media_path || m.wa_media_id);
          return (
            <li key={m.id} className="group flex flex-col">
              {showDay && (
                <span className="my-3 self-center rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
                  {dayLabel(m.created_at)}
                </span>
              )}
              <div
                className={cn(
                  "flex items-end gap-1",
                  out ? "flex-row-reverse self-end" : "self-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-3xl px-4 py-2.5 text-sm sm:max-w-[28rem]",
                    out
                      ? "rounded-br-lg bg-primary text-primary-foreground"
                      : "rounded-bl-lg border border-border bg-card",
                    failed && "bg-destructive text-destructive-foreground",
                  )}
                >
                  {quoted && (
                    <p
                      className={cn(
                        "mb-1.5 line-clamp-2 rounded-xl border-l-2 px-2 py-1 text-xs",
                        out
                          ? "border-white/60 bg-white/15"
                          : "border-primary bg-secondary text-muted-foreground",
                      )}
                    >
                      {quoted.body ?? "mensagem"}
                    </p>
                  )}
                  {hasMedia && (
                    <div className="mb-1">
                      <MediaView message={m} />
                    </div>
                  )}
                  {MEDIA_TYPES.has(m.type) && !hasMedia && (
                    <p className="mb-1 text-xs opacity-80">Anexo ainda não disponível</p>
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
                    {out && !failed && !stuck && STATUS_TEXT[m.status] && (
                      <span className="sr-only">{STATUS_TEXT[m.status]}</span>
                    )}
                  </p>
                  {(failed || stuck) && (
                    <p className="mt-1 text-[11px]">
                      {failed
                        ? `Não enviada${m.error_message ? `: ${m.error_message}` : "."}`
                        : "Sem confirmação de envio."}{" "}
                      <button
                        className="inline-flex items-center gap-1 underline"
                        onClick={() => onRetrySend(m)}
                      >
                        <RotateCw className="h-3 w-3" /> Tentar de novo
                      </button>
                    </p>
                  )}
                </div>
                {m.type !== "template" && (
                  <button
                    onClick={() => onReply(m)}
                    aria-label="Responder esta mensagem"
                    className="mb-1 rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-card hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <CornerUpLeft className="h-4 w-4" />
                  </button>
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
