import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { AddToFunnelDialog } from "@/components/inbox/AddToFunnelDialog";
import { FunnelBoard } from "@/components/inbox/FunnelBoard";
import { PageHeader } from "@/components/inbox/PageHeader";
import { Button } from "@/components/ui/button";
import { fetchPipelineStages } from "@/lib/inbox/api";

export const Route = createFileRoute("/inbox/_app/funil")({
  head: () => ({ meta: [{ title: "Funil comercial | Astarita Inbox" }] }),
  component: PipelinePage,
});

function PipelinePage() {
  const stages = useQuery({ queryKey: ["inbox", "stages"], queryFn: fetchPipelineStages });
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  return (
    <>
      <PageHeader
        title="Funil comercial"
        subtitle="Do primeiro contato ao fechamento. Arraste os cartões entre as etapas."
        search={{ value: search, onChange: setSearch, placeholder: "Buscar no funil" }}
        action={
          <Button className="rounded-full" disabled={!stages.data} onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Adicionar ao funil
          </Button>
        }
      />
      <section className="inbox-surface min-h-0 flex-1 overflow-x-auto rounded-[2rem] p-4 sm:p-5">
        <FunnelBoard search={search} />
      </section>
      {stages.data && (
        <AddToFunnelDialog open={adding} onOpenChange={setAdding} stages={stages.data} />
      )}
    </>
  );
}
