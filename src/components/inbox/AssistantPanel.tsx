import { Asterisk, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AI_STATE } from "@/lib/inbox/api";
import type { ConversationRow } from "@/lib/inbox/types";

const AI_ACTIONS = [
  "Sugerir resposta",
  "Mais natural",
  "Mais curta",
  "Mais profissional",
  "Mais acolhedora",
  "Resumir conversa",
];

/** Assistente Astarita. Substituído pela versão ligada à IA na Fase 5. */
export function AssistantPanel(_props: {
  conversation: ConversationRow | undefined;
  onUseDraft: (text: string) => void;
}) {
  return (
    <section className="inbox-surface rounded-[2rem] p-5" aria-label="Assistente Astarita">
      <h2 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold">
        Assistente Astarita <Asterisk className="h-4 w-4 text-primary" strokeWidth={3} />
      </h2>
      {AI_STATE === "not_configured" && (
        <p className="mb-3 flex items-start gap-2 rounded-2xl bg-highlight/70 px-3 py-2 text-xs text-foreground/80">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          IA não configurada. Nenhuma sugestão é simulada. O atendimento e as respostas rápidas
          funcionam sem ela.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {AI_ACTIONS.map((label) => (
          <Button key={label} variant="outline" size="sm" className="rounded-full" disabled>
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
