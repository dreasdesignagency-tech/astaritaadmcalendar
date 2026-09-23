import { useEffect, useState } from "react";
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
import {
  CONTENT_COLORS,
  FORMATS,
  FUNNEL_LABEL,
  FUNNEL_STAGES,
  STATUSES,
  type Client,
  type Content,
  type FunnelStage,
} from "@/lib/planner";

type Draft = {
  client_id: string;
  title: string;
  publication_date: string;
  funnel_stage: FunnelStage;
  format: string;
  status: string;
  color: string;
};

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card/45 px-3 text-sm shadow-sm backdrop-blur-md outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContentDialog({
  open,
  onOpenChange,
  clients,
  content,
  defaultDate,
  defaultClientId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  content: Content | null;
  defaultDate: string;
  defaultClientId?: string;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    client_id: "",
    title: "",
    publication_date: defaultDate,
    funnel_stage: "topo",
    format: FORMATS[0]!,
    status: STATUSES[0]!,
    color: CONTENT_COLORS[0]!,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (content) {
      const client = clients.find((c) => c.id === content.client_id);
      setDraft({
        client_id: content.client_id,
        title: content.title,
        publication_date: content.publication_date,
        funnel_stage: content.funnel_stage,
        format: content.format,
        status: content.status,
        color: content.color ?? client?.color ?? CONTENT_COLORS[0]!,
      });
    } else {
      const clientId = defaultClientId ?? clients[0]?.id ?? "";
      const client = clients.find((c) => c.id === clientId);
      setDraft({
        client_id: clientId,
        title: "",
        publication_date: defaultDate,
        funnel_stage: "topo",
        format: FORMATS[0]!,
        status: STATUSES[0]!,
        color: client?.color ?? CONTENT_COLORS[0]!,
      });
    }
  }, [open, content, defaultDate, defaultClientId, clients]);

  const save = async () => {
    if (!draft.client_id || !draft.title.trim() || !draft.publication_date) {
      toast.error("Preencha cliente, título e data.");
      return;
    }
    setSaving(true);
    const payload = { ...draft, title: draft.title.trim() };
    const { error } = content
      ? await supabase.from("contents").update(payload).eq("id", content.id)
      : await supabase.from("contents").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(content ? "Conteúdo atualizado" : "Conteúdo criado");
    onSaved();
    onOpenChange(false);
  };

  const remove = async () => {
    if (!content) return;
    setSaving(true);
    const { error } = await supabase.from("contents").delete().eq("id", content.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conteúdo excluído");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{content ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="content-client">Cliente *</Label>
            <select
              id="content-client"
              className={selectClass}
              value={draft.client_id}
              onChange={(e) => {
                const client = clients.find((c) => c.id === e.target.value);
                setDraft({
                  ...draft,
                  client_id: e.target.value,
                  ...(client && !content ? { color: client.color } : {}),
                });
              }}
            >
              <option value="">Selecione</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content-title">Título *</Label>
            <Input
              id="content-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="content-date">Data *</Label>
              <Input
                id="content-date"
                type="date"
                value={draft.publication_date}
                onChange={(e) => setDraft({ ...draft, publication_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content-funnel">Funil *</Label>
              <select
                id="content-funnel"
                className={selectClass}
                value={draft.funnel_stage}
                onChange={(e) =>
                  setDraft({ ...draft, funnel_stage: e.target.value as FunnelStage })
                }
              >
                {FUNNEL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {FUNNEL_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="content-format">Formato *</Label>
              <select
                id="content-format"
                className={selectClass}
                value={draft.format}
                onChange={(e) => setDraft({ ...draft, format: e.target.value })}
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content-status">Status</Label>
              <select
                id="content-status"
                className={selectClass}
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cor no calendário</Label>
            <div className="flex flex-wrap items-center gap-2">
              {CONTENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Cor ${color}`}
                  aria-pressed={draft.color.toLowerCase() === color}
                  onClick={() => setDraft({ ...draft, color })}
                  style={{ backgroundColor: color }}
                  className={`h-7 w-7 rounded-full border transition-transform ${
                    draft.color.toLowerCase() === color
                      ? "scale-110 border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border"
                  }`}
                />
              ))}
              <input
                type="color"
                aria-label="Outra cor"
                value={draft.color}
                onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                className="h-7 w-9 cursor-pointer rounded border border-input bg-background p-0.5"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {content ? (
            <Button variant="outline" onClick={remove} disabled={saving}>
              Excluir
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
