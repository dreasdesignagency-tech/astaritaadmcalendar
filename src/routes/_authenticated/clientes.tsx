import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchClients, type Client } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | Astarita" },
      {
        name: "description",
        content: "Cadastro de clientes que alimentam o calendário editorial da Astarita.",
      },
      { property: "og:title", content: "Clientes | Astarita" },
      {
        property: "og:description",
        content: "Cadastro simples de clientes para o planejamento de conteúdo.",
      },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const query = useQuery({ queryKey: ["clients"], queryFn: fetchClients });
  const clients = query.data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#831a4b");
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setName("");
    setColor("#831a4b");
    setOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setName(client.name);
    setColor(client.color);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    setSaving(true);
    const payload = { name: name.trim(), color };
    const { error } = editing
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Cliente atualizado" : "Cliente adicionado");
    setOpen(false);
    query.refetch();
  };

  const toggleActive = async (client: Client) => {
    const { error } = await supabase
      .from("clients")
      .update({ active: !client.active })
      .eq("id", client.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(client.active ? "Cliente arquivado" : "Cliente reativado");
    query.refetch();
  };

  const remove = async (client: Client) => {
    if (!confirm(`Apagar o cliente "${client.name}" e todos os seus conteúdos?`)) return;
    await supabase.from("contents").delete().eq("client_id", client.id);
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cliente apagado");
    query.refetch();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="mr-auto">
            <p className="text-xs font-semibold uppercase text-primary/65">Organização</p>
            <h1 className="font-display mt-1 text-3xl font-bold text-primary">Clientes</h1>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Adicionar cliente
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.length === 0 && (
            <p className="glass-soft col-span-full rounded-3xl p-6 text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
          )}
          {clients.map((c) => (
            <div key={c.id} className="glass-soft glass-lift rounded-3xl p-5">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl font-display font-bold text-primary-foreground" style={{ backgroundColor: c.color }} aria-hidden>
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <span className={`block truncate font-display text-sm font-bold ${c.active ? "text-primary" : "text-muted-foreground line-through"}`}>{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.active ? "Cliente ativo" : "Cliente arquivado"}</span>
                </div>
              </div>
              <div className="flex gap-1 border-t border-border/60 pt-3">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(c)}>
                  {c.active ? "Arquivar" : "Reativar"}
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => remove(c)}>
                  Apagar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Adicionar cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-name">Nome</Label>
              <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-color">Cor identificadora</Label>
              <Input
                id="client-color"
                type="color"
                className="h-9 w-16 p-1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
