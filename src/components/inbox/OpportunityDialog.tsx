import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { openConversationFor } from "@/lib/inbox/contacts";
import { InboxUserError } from "@/lib/inbox/errors";
import { cardsOfStage } from "@/lib/inbox/funnel-logic";
import {
  deleteOpportunity,
  moveOpportunity,
  setOpportunityOwner,
  type OpportunityCard,
} from "@/lib/inbox/funnel";
import { formatPhone } from "@/lib/inbox/phone";
import { CATEGORY_LABEL, type InboxProfile, type PipelineStage } from "@/lib/inbox/types";

const NONE = "none";

/** Detalhes do cartão: mover de etapa (também no celular, onde arrastar não funciona), responsável, abrir conversa, remover. */
export function OpportunityDialog({
  card,
  stages,
  team,
  onClose,
  onOpenConversation,
}: {
  card: OpportunityCard | null;
  stages: PipelineStage[];
  team: InboxProfile[];
  onClose: () => void;
  onOpenConversation: (conversationId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const run = async (action: () => Promise<void>, ok?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      if (ok) toast.success(ok);
    } catch (e) {
      toast.error(
        e instanceof InboxUserError ? e.message : "Não foi possível salvar. Tente de novo.",
      );
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["inbox", "opportunities"] });
      setBusy(false);
    }
  };

  if (!card) return null;
  const all = (
    queryClient.getQueryData<OpportunityCard[]>(["inbox", "opportunities"]) ?? []
  ).filter((c) => c.id !== card.id);

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="inbox-theme rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{card.contact.name}</DialogTitle>
            <DialogDescription>
              {[
                card.contact.company,
                formatPhone(card.contact.phone),
                CATEGORY_LABEL[card.contact.category],
              ]
                .filter(Boolean)
                .join(" · ")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Etapa comercial</Label>
              <Select
                value={card.stage_id}
                disabled={busy}
                onValueChange={(stageId) => {
                  if (stageId === card.stage_id) return;
                  const pos = cardsOfStage(all, stageId).slice(-1)[0]?.position ?? 0;
                  void run(
                    () => moveOpportunity(card.id, stageId, pos + 1),
                    "Etapa atualizada.",
                  ).then(onClose);
                }}
              >
                <SelectTrigger aria-label="Etapa comercial">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="inbox-theme">
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Responsável</Label>
              <Select
                value={card.assigned_to ?? NONE}
                disabled={busy}
                onValueChange={(v) =>
                  void run(
                    () => setOpportunityOwner(card.id, v === NONE ? null : v),
                    "Responsável atualizado.",
                  ).then(onClose)
                }
              >
                <SelectTrigger aria-label="Responsável do cartão">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="inbox-theme">
                  <SelectItem value={NONE}>Sem responsável</SelectItem>
                  {team
                    .filter((p) => p.active)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-2 flex flex-wrap justify-between gap-2">
              <Button
                className="rounded-full"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const id = await openConversationFor(card.contact_id, card.assigned_to);
                    onClose();
                    onOpenConversation(id);
                  })
                }
              >
                <MessageSquare className="mr-1.5 h-4 w-4" /> Abrir conversa
              </Button>
              <Button
                variant="outline"
                className="rounded-full text-destructive"
                disabled={busy}
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Remover do funil
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent className="inbox-theme rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {card.contact.name} do funil?</AlertDialogTitle>
            <AlertDialogDescription>
              O contato e a conversa continuam. Só a oportunidade comercial sai do funil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() =>
                void run(() => deleteOpportunity(card.id), "Removido do funil.").then(() => {
                  setConfirmRemove(false);
                  onClose();
                })
              }
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
