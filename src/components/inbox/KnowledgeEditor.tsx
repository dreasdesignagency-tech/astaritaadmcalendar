import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import {
  KNOWLEDGE_HINTS,
  fetchKnowledge,
  saveKnowledge,
  type KnowledgeRow,
} from "@/lib/inbox/knowledge";

function Section({ row }: { row: KnowledgeRow }) {
  const me = useInboxProfile();
  const qc = useQueryClient();
  const [text, setText] = useState(row.content);
  useEffect(() => setText(row.content), [row.content]);
  const dirty = text !== row.content;
  const save = useMutation({
    mutationFn: () => saveKnowledge(row.id, text, me.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["inbox", "knowledge"] });
      toast.success(`${row.title} salvo.`);
    },
    onError: () => toast.error("Não foi possível salvar. Tente de novo."),
  });
  return (
    <div className="space-y-1.5">
      <label htmlFor={`kb-${row.section}`} className="block text-sm font-medium">
        {row.title}
      </label>
      <p className="text-xs text-muted-foreground">{KNOWLEDGE_HINTS[row.section]}</p>
      <Textarea
        id={`kb-${row.section}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={8000}
        className="min-h-24 rounded-2xl text-sm"
        placeholder="Ainda vazio. A IA não inventa o que não estiver escrito aqui."
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          className="rounded-full"
          aria-label={`Salvar ${row.title}`}
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

/** Base de conhecimento que o Assistente Astarita usa. Quem escreve é a equipe; nada vem preenchido por nós. */
export function KnowledgeEditor() {
  const q = useQuery({ queryKey: ["inbox", "knowledge"], queryFn: fetchKnowledge });
  if (q.isPending) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (q.isError)
    return (
      <div className="text-sm">
        <p className="text-destructive">Não foi possível carregar a base de conhecimento.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 rounded-full"
          onClick={() => void q.refetch()}
        >
          Tentar de novo
        </Button>
      </div>
    );
  return (
    <div className="space-y-5">
      {q.data.map((row) => (
        <Section key={row.id} row={row} />
      ))}
    </div>
  );
}
