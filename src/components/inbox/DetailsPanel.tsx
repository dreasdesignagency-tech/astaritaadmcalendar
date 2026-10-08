import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { AssistantPanel } from "@/components/inbox/AssistantPanel";
import { NotesSection } from "@/components/inbox/NotesSection";
import { RemindersSection } from "@/components/inbox/RemindersSection";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchPipelineStages } from "@/lib/inbox/api";
import { fetchContactStage, setContactStage } from "@/lib/inbox/funnel";
import { formatPhone } from "@/lib/inbox/phone";
import { CATEGORY_LABEL, type ConversationRow, type InboxProfile } from "@/lib/inbox/types";

const NO_STAGE = "none";

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

/** Etapa comercial do contato: cria a oportunidade no funil na primeira escolha e move nas seguintes. */
function StageField({ contactId }: { contactId: string }) {
  const queryClient = useQueryClient();
  const stages = useQuery({ queryKey: ["inbox", "stages"], queryFn: fetchPipelineStages });
  const current = useQuery({
    queryKey: ["inbox", "contact-stage", contactId],
    queryFn: () => fetchContactStage(contactId),
  });

  const change = async (stageId: string) => {
    if (stageId === NO_STAGE) return;
    try {
      await setContactStage(contactId, stageId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inbox", "contact-stage", contactId] }),
        queryClient.invalidateQueries({ queryKey: ["inbox", "opportunities"] }),
      ]);
      toast.success("Etapa comercial atualizada.");
    } catch {
      toast.error("Não foi possível atualizar a etapa. Tente de novo.");
    }
  };

  return (
    <div>
      <dt className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        Etapa comercial
      </dt>
      <dd>
        <Select
          value={current.data?.stage_id ?? NO_STAGE}
          onValueChange={(v) => void change(v)}
          disabled={stages.isPending || current.isPending}
        >
          <SelectTrigger
            className="h-9 rounded-full text-sm"
            aria-label="Etapa comercial do contato"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="inbox-theme">
            {!current.data && <SelectItem value={NO_STAGE}>Fora do funil</SelectItem>}
            {stages.data?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </dd>
    </div>
  );
}

export function DetailsPanel({
  conversation,
  team,
  tags,
  onEditContact,
  onUseDraft,
}: {
  conversation: ConversationRow | undefined;
  team: InboxProfile[];
  tags: string[];
  onEditContact: () => void;
  onUseDraft: (text: string) => void;
}) {
  const contact = conversation?.contact;
  const owner = team.find((p) => p.id === conversation?.assigned_to)?.full_name;

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
      <section className="inbox-surface rounded-[2rem] p-5" aria-label="Informações do contato">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Contato</h2>
          {contact && (
            <Button variant="outline" size="sm" className="rounded-full" onClick={onEditContact}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
            </Button>
          )}
        </div>
        {contact ? (
          <dl className="space-y-3">
            <Field label="Nome" value={contact.name} />
            <Field label="Telefone" value={formatPhone(contact.phone)} />
            <Field label="Empresa" value={contact.company} />
            <Field label="Instagram" value={contact.instagram} />
            <Field label="Categoria" value={CATEGORY_LABEL[contact.category]} />
            <Field label="Responsável" value={owner} />
            <StageField contactId={contact.id} />
            <Field label="Etiquetas" value={tags.join(", ")} />
            <Field label="Anotação fixa" value={contact.notes} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione uma conversa para ver os dados do contato.
          </p>
        )}
      </section>

      <AssistantPanel conversation={conversation} onUseDraft={onUseDraft} />

      {contact && (
        <>
          <RemindersSection contactId={contact.id} />
          <NotesSection contactId={contact.id} />
        </>
      )}
    </div>
  );
}
