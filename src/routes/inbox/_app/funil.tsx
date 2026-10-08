import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { PageHeader } from "@/components/inbox/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPipelineStages } from "@/lib/inbox/api";

export const Route = createFileRoute("/inbox/_app/funil")({
  head: () => ({ meta: [{ title: "Funil comercial | Astarita Inbox" }] }),
  component: PipelinePage,
});

function PipelinePage() {
  const stages = useQuery({ queryKey: ["inbox", "stages"], queryFn: fetchPipelineStages });

  return (
    <>
      <PageHeader title="Funil comercial" subtitle="Do primeiro contato ao fechamento" />
      <section className="inbox-surface min-h-0 flex-1 overflow-x-auto rounded-[2rem] p-4 sm:p-5">
        {stages.isError ? (
          <EmptyState tone="error" icon={WifiOff} title="Erro de conexão">
            Não foi possível carregar as etapas do funil.
          </EmptyState>
        ) : (
          <div className="flex h-full min-w-max gap-3">
            {stages.isPending
              ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-full w-56 rounded-3xl" />
                ))
              : stages.data.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex h-full w-56 flex-col rounded-3xl bg-secondary p-3"
                  >
                    <p className="px-1 text-sm font-semibold">{stage.name}</p>
                    <p className="px-1 text-xs text-muted-foreground">0 oportunidades</p>
                    <div className="mt-3 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                      Vazio
                    </div>
                  </div>
                ))}
          </div>
        )}
      </section>
      <p className="shrink-0 px-2 text-xs text-muted-foreground">
        As etapas vêm do banco. Cartões e arrastar entre etapas chegam na Fase 3.
      </p>
    </>
  );
}
