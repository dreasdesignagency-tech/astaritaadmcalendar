import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { PageHeader } from "@/components/inbox/PageHeader";

export const Route = createFileRoute("/_authenticated/inbox/respostas")({
  head: () => ({ meta: [{ title: "Respostas rápidas | Astarita Inbox" }] }),
  component: QuickRepliesPage,
});

function QuickRepliesPage() {
  return (
    <>
      <PageHeader title="Respostas rápidas" subtitle="Textos prontos para usar no chat" />
      <section className="inbox-surface flex min-h-0 flex-1 items-center justify-center rounded-[2rem]">
        <EmptyState icon={Zap} title="Nenhuma resposta cadastrada">
          A biblioteca de respostas, com criar, editar e excluir, chega na Fase 3.
        </EmptyState>
      </section>
    </>
  );
}
