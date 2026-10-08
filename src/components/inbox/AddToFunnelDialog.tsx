import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchContacts } from "@/lib/inbox/contacts";
import { ensureOpportunity, type OpportunityCard } from "@/lib/inbox/funnel";
import { formatPhone } from "@/lib/inbox/phone";
import type { PipelineStage } from "@/lib/inbox/types";

/** Coloca um contato existente no funil. Cada contato tem no máximo uma oportunidade. */
export function AddToFunnelDialog({
  open,
  onOpenChange,
  stages,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: PipelineStage[];
}) {
  const queryClient = useQueryClient();
  const contacts = useQuery({
    queryKey: ["inbox", "contacts"],
    queryFn: fetchContacts,
    enabled: open,
  });
  const [query, setQuery] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [stageId, setStageId] = useState<string>(stages[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const inFunnel = new Set(
    (queryClient.getQueryData<OpportunityCard[]>(["inbox", "opportunities"]) ?? []).map(
      (o) => o.contact_id,
    ),
  );
  const q = query.trim().toLowerCase();
  const available = (contacts.data ?? [])
    .filter((c) => !inFunnel.has(c.id))
    .filter(
      (c) => !q || [c.name, c.company, c.phone].filter(Boolean).join(" ").toLowerCase().includes(q),
    )
    .slice(0, 50);

  const submit = async () => {
    if (!contactId || !stageId || busy) return;
    setBusy(true);
    try {
      const contact = contacts.data?.find((c) => c.id === contactId);
      await ensureOpportunity(contactId, stageId, contact?.name ?? null);
      await queryClient.invalidateQueries({ queryKey: ["inbox", "opportunities"] });
      toast.success("Contato adicionado ao funil.");
      setContactId(null);
      setQuery("");
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível adicionar ao funil. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inbox-theme rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar ao funil</DialogTitle>
          <DialogDescription>
            Escolha um contato que ainda não está no funil e a etapa inicial.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="funnel-contact-search">Contato</Label>
            <Input
              id="funnel-contact-search"
              placeholder="Buscar por nome, empresa ou telefone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="max-h-48 overflow-y-auto rounded-2xl border border-border">
              {contacts.isPending && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Carregando…</li>
              )}
              {!contacts.isPending && available.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {(contacts.data ?? []).length === 0
                    ? "Ainda não há contatos."
                    : "Todos os contatos encontrados já estão no funil."}
                </li>
              )}
              {available.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setContactId(c.id)}
                    aria-pressed={contactId === c.id}
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-secondary ${contactId === c.id ? "bg-accent" : ""}`}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[c.company, formatPhone(c.phone)].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-1.5">
            <Label>Etapa</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger aria-label="Etapa inicial">
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
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="rounded-full"
            disabled={!contactId || busy}
            onClick={() => void submit()}
          >
            {busy ? "Adicionando…" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
