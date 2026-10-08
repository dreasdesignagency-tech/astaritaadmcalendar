import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchQuickReplies } from "@/lib/inbox/quick-replies";
import { QUICK_REPLY_CATEGORIES, QUICK_REPLY_LABEL, renderQuickReply } from "@/lib/inbox/templates";

/** Insere uma resposta rápida no campo de mensagem. O texto continua editável e NADA é enviado. */
export function QuickReplyPicker({
  contactName,
  onPick,
  disabled,
}: {
  contactName: string;
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const replies = useQuery({
    queryKey: ["inbox", "quick-replies"],
    queryFn: fetchQuickReplies,
    enabled: open,
  });
  const query = q.trim().toLowerCase();
  const rows = (replies.data ?? []).filter(
    (r) => !query || `${r.title} ${r.body}`.toLowerCase().includes(query),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-[52px] w-[52px] shrink-0 rounded-full"
          aria-label="Respostas rápidas"
          disabled={disabled}
        >
          <Zap className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="inbox-theme w-[min(92vw,24rem)] rounded-3xl p-3"
      >
        <Input
          placeholder="Buscar resposta"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar resposta rápida"
          className="mb-2"
          autoFocus
        />
        <div className="max-h-72 space-y-3 overflow-y-auto">
          {replies.isPending && <p className="px-2 text-sm text-muted-foreground">Carregando…</p>}
          {replies.isError && (
            <p className="px-2 text-sm text-destructive">Não foi possível carregar as respostas.</p>
          )}
          {replies.data && replies.data.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground">
              Nenhuma resposta cadastrada. Crie na tela Respostas rápidas.
            </p>
          )}
          {replies.data && replies.data.length > 0 && rows.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground">Sem resultados.</p>
          )}
          {QUICK_REPLY_CATEGORIES.map((cat) => {
            const items = rows.filter((r) => r.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {QUICK_REPLY_LABEL[cat]}
                </p>
                <ul>
                  {items.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="w-full rounded-2xl px-3 py-2 text-left hover:bg-secondary"
                        onClick={() => {
                          onPick(renderQuickReply(r.body, contactName));
                          setOpen(false);
                          setQ("");
                        }}
                      >
                        <span className="block text-sm font-medium">{r.title}</span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{r.body}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
