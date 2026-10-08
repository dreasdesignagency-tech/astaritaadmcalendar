import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, SearchX, Trash2, WifiOff, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/inbox/EmptyState";
import { PageHeader } from "@/components/inbox/PageHeader";
import { QuickReplyDialog } from "@/components/inbox/QuickReplyDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteQuickReply, fetchQuickReplies, type QuickReply } from "@/lib/inbox/quick-replies";
import { useFallbackInterval } from "@/lib/inbox/realtime";
import { QUICK_REPLY_CATEGORIES, QUICK_REPLY_LABEL } from "@/lib/inbox/templates";

export const Route = createFileRoute("/inbox/_app/respostas")({
  head: () => ({ meta: [{ title: "Respostas rápidas | Astarita Inbox" }] }),
  component: QuickRepliesPage,
});

function QuickRepliesPage() {
  const queryClient = useQueryClient();
  const interval = useFallbackInterval();
  const replies = useQuery({
    queryKey: ["inbox", "quick-replies"],
    queryFn: fetchQuickReplies,
    refetchInterval: interval,
  });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<QuickReply | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<QuickReply | null>(null);

  const rows = replies.data ?? [];
  const q = search.trim().toLowerCase();
  const visible = useMemo(
    () => rows.filter((r) => !q || `${r.title} ${r.body}`.toLowerCase().includes(q)),
    [rows, q],
  );

  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const remove = async () => {
    if (!removing) return;
    try {
      await deleteQuickReply(removing.id);
      await queryClient.invalidateQueries({ queryKey: ["inbox", "quick-replies"] });
      toast.success("Resposta excluída.");
    } catch {
      toast.error("Não foi possível excluir. Tente de novo.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Respostas rápidas"
        subtitle="Textos prontos para usar no chat. Sempre editáveis antes de enviar."
        search={{ value: search, onChange: setSearch, placeholder: "Buscar respostas" }}
        action={
          <Button className="rounded-full" onClick={openNew}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova resposta
          </Button>
        }
      />
      <section className="inbox-surface min-h-0 flex-1 overflow-y-auto rounded-[2rem] p-4 sm:p-6">
        {replies.isPending ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : replies.isError ? (
          <EmptyState tone="error" icon={WifiOff} title="Erro de conexão">
            Não foi possível carregar as respostas.
            <button
              onClick={() => void replies.refetch()}
              className="mt-2 block w-full font-medium text-primary hover:underline"
            >
              Tentar de novo
            </button>
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState icon={Zap} title="Nenhuma resposta cadastrada">
            Crie respostas para os assuntos que se repetem: primeiro contato, serviços, Google Meet,
            propostas e outros.
            <Button className="mt-3 rounded-full" size="sm" onClick={openNew}>
              <Plus className="mr-1.5 h-4 w-4" /> Nova resposta
            </Button>
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState icon={SearchX} title="Sem resultados">
            Nenhuma resposta corresponde à busca.
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {QUICK_REPLY_CATEGORIES.map((cat) => {
              const items = visible.filter((r) => r.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {QUICK_REPLY_LABEL[cat]}
                  </h2>
                  <ul className="grid gap-2 lg:grid-cols-2">
                    {items.map((r) => (
                      <li key={r.id} className="flex flex-col gap-2 rounded-2xl bg-secondary p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{r.title}</p>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full"
                              aria-label={`Editar ${r.title}`}
                              onClick={() => {
                                setEditing(r);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full text-destructive"
                              aria-label={`Excluir ${r.title}`}
                              onClick={() => setRemoving(r)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                          {r.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <QuickReplyDialog open={dialogOpen} onOpenChange={setDialogOpen} reply={editing} />
      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent className="inbox-theme rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{removing?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              A resposta sai da biblioteca. Mensagens já enviadas com ela não mudam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full" onClick={() => void remove()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
