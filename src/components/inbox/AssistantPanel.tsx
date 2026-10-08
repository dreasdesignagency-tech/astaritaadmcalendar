import { Asterisk, Copy, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AI_ACTIONS, markSuggestionUsed, requestAi, type AiKind } from "@/lib/inbox/ai";
import { useChannelStatus } from "@/lib/inbox/channel";
import type { ConversationRow } from "@/lib/inbox/types";

type Suggestion = { id: string | null; kind: AiKind; text: string };

/**
 * Assistente Astarita. A IA só SUGERE: o texto aparece aqui para a pessoa editar e só vai para o campo de resposta
 * quando ela clica em "Usar resposta". O envio ao cliente continua sendo sempre manual.
 */
export function AssistantPanel({
  conversation,
  draft,
  onUseDraft,
}: {
  conversation: ConversationRow | undefined;
  /** Texto que a pessoa já tem no campo de resposta (base dos ajustes de tom). */
  draft: string;
  onUseDraft: (text: string) => void;
}) {
  const status = useChannelStatus();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState<AiKind | null>(null);
  const [lastKind, setLastKind] = useState<AiKind>("suggest");
  const conversationId = conversation?.id;

  useEffect(() => {
    setSuggestion(null);
    setLoading(null);
  }, [conversationId]);

  const ai = status.data?.ai;
  const unavailable = status.isError ? "Não foi possível verificar a IA agora." : null;
  const notConfigured = ai && !ai.configured;

  const run = async (kind: AiKind) => {
    if (!conversationId || loading) return;
    const action = AI_ACTIONS.find((a) => a.kind === kind);
    const source = draft.trim() || (suggestion?.kind !== "summary" ? (suggestion?.text ?? "") : "");
    if (action?.needsText && !source.trim()) {
      toast.error(
        "Escreva um texto no campo de resposta, ou gere uma sugestão, antes de ajustar o tom.",
      );
      return;
    }
    const forConversation = conversationId;
    setLoading(kind);
    setLastKind(kind);
    const r = await requestAi({
      conversationId,
      kind,
      ...(action?.needsText ? { text: source } : {}),
    });
    setLoading(null);
    if (forConversation !== conversationId) return;
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setSuggestion({ id: r.id, kind: r.kind, text: r.content });
  };

  const copy = async () => {
    if (!suggestion) return;
    try {
      await navigator.clipboard.writeText(suggestion.text);
      toast.success("Texto copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  const use = () => {
    if (!suggestion || !suggestion.text.trim()) return;
    onUseDraft(suggestion.text.trim());
    if (suggestion.id) void markSuggestionUsed(suggestion.id);
    setSuggestion(null);
    toast.success("Texto colocado no campo de resposta. Revise e envie quando quiser.");
  };

  const disabled = !conversationId || !!notConfigured || !!unavailable || status.isPending;

  return (
    <section className="inbox-surface rounded-[2rem] p-5" aria-label="Assistente Astarita">
      <h2 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold">
        Assistente Astarita <Asterisk className="h-4 w-4 text-primary" strokeWidth={3} />
      </h2>
      {(notConfigured || unavailable) && (
        <p className="mb-3 flex items-start gap-2 rounded-2xl bg-highlight/70 px-3 py-2 text-xs text-foreground/80">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {notConfigured
            ? "A IA ainda não foi ligada. Nenhuma sugestão é simulada. O atendimento e as respostas rápidas funcionam normalmente."
            : unavailable}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {AI_ACTIONS.map((a) => (
          <Button
            key={a.kind}
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={disabled || !!loading}
            onClick={() => void run(a.kind)}
          >
            {loading === a.kind && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {a.label}
          </Button>
        ))}
      </div>

      {loading && !suggestion && (
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          Preparando a sugestão…
        </p>
      )}

      {suggestion && (
        <div className="mt-4 space-y-2" data-testid="ai-suggestion">
          <label htmlFor="ai-suggestion-text" className="text-xs font-medium text-muted-foreground">
            {suggestion.kind === "summary"
              ? "Resumo (só para você)"
              : "Sugestão (edite antes de usar)"}
          </label>
          <Textarea
            id="ai-suggestion-text"
            value={suggestion.text}
            onChange={(e) => setSuggestion({ ...suggestion, text: e.target.value })}
            className="min-h-28 rounded-2xl text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {suggestion.kind !== "summary" && (
              <Button size="sm" className="rounded-full" onClick={use}>
                Usar resposta
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={!!loading}
              onClick={() => void run(lastKind)}
            >
              Gerar novamente
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void copy()}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setSuggestion(null)}
            >
              <X className="mr-1.5 h-3.5 w-3.5" /> Descartar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Nada é enviado ao cliente. Você revisa e envia pelo campo de resposta.
          </p>
        </div>
      )}
    </section>
  );
}
