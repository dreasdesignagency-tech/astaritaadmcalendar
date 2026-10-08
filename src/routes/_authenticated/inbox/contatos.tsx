import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { PageHeader } from "@/components/inbox/PageHeader";

export const Route = createFileRoute("/_authenticated/inbox/contatos")({
  head: () => ({ meta: [{ title: "Contatos | Astarita Inbox" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <>
      <PageHeader title="Contatos" subtitle="Leads, clientes e parceiros" />
      <section className="inbox-surface flex min-h-0 flex-1 items-center justify-center rounded-[2rem]">
        <EmptyState icon={Users} title="Sem contatos ainda">
          O cadastro, a busca e o histórico de contatos chegam na Fase 2. A tabela já existe no
          banco.
        </EmptyState>
      </section>
    </>
  );
}
