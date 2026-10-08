import { Asterisk, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AI_STATE } from "@/lib/inbox/api";
import { CATEGORY_LABEL, type ConversationRow, type InboxProfile } from "@/lib/inbox/types";

const AI_ACTIONS = [
  "Sugerir resposta",
  "Mais natural",
  "Mais curta",
  "Mais profissional",
  "Mais acolhedora",
  "Resumir conversa",
];

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">
        {value || <span className="text-muted-foreground">Não informado</span>}
      </dd>
    </div>
  );
}

export function DetailsPanel({
  conversation,
  team,
}: {
  conversation: ConversationRow | undefined;
  team: InboxProfile[];
}) {
  const contact = conversation?.contact;
  const owner = team.find((p) => p.id === conversation?.assigned_to)?.full_name;

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
      <section className="inbox-surface rounded-[2rem] p-5" aria-label="Informações do contato">
        <h2 className="mb-3 font-display text-base font-semibold">Contato</h2>
        {contact ? (
          <dl className="space-y-3">
            <Field label="Nome" value={contact.name} />
            <Field label="Telefone" value={contact.phone} />
            <Field label="Empresa" value={contact.company} />
            <Field label="Instagram" value={contact.instagram} />
            <Field label="Categoria" value={CATEGORY_LABEL[contact.category]} />
            <Field label="Responsável" value={owner} />
            <Field label="Observações" value={contact.notes} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione uma conversa para ver os dados do contato.
          </p>
        )}
      </section>

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
    </div>
  );
}
