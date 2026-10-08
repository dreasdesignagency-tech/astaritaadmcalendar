import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { fetchTeam } from "@/lib/inbox/api";
import { InboxUserError, saveContact, type ContactInput } from "@/lib/inbox/contacts";
import { formatPhone } from "@/lib/inbox/phone";
import { CATEGORY_LABEL, type ContactCategory } from "@/lib/inbox/types";

export type EditableContact = {
  id: string;
  name: string;
  phone: string | null;
  company: string | null;
  instagram: string | null;
  category: ContactCategory;
  assigned_to: string | null;
  notes: string | null;
  tags: { name: string }[];
};

const NONE = "none";

const empty: ContactInput = {
  name: "",
  phone: "",
  company: "",
  instagram: "",
  category: "lead",
  assigned_to: null,
  notes: "",
  tags: [],
};

function fromContact(c: EditableContact): ContactInput {
  return {
    name: c.name,
    phone: formatPhone(c.phone),
    company: c.company ?? "",
    instagram: c.instagram ?? "",
    category: c.category,
    assigned_to: c.assigned_to,
    notes: c.notes ?? "",
    tags: c.tags.map((t) => t.name),
  };
}

/** Criar ou editar contato. `contact` ausente = novo contato. */
export function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: EditableContact | undefined;
  onSaved?: (contactId: string) => void;
}) {
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });
  const [form, setForm] = useState<ContactInput>(empty);
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const initial = contact ? fromContact(contact) : empty;
    setForm(initial);
    setTagsText(initial.tags.join(", "));
    setError(null);
  }, [open, contact]);

  const set = <K extends keyof ContactInput>(key: K, value: ContactInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const id = await saveContact({ ...form, tags }, contact?.id);
      await queryClient.invalidateQueries({ queryKey: ["inbox"] });
      toast.success(contact ? "Contato atualizado." : "Contato criado.");
      onOpenChange(false);
      onSaved?.(id);
    } catch (e) {
      setError(
        e instanceof InboxUserError
          ? e.message
          : "Não foi possível salvar. Verifique a conexão e tente de novo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inbox-theme max-h-[92vh] overflow-y-auto rounded-[2rem] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {contact ? "Editar contato" : "Novo contato"}
          </DialogTitle>
          <DialogDescription>
            O telefone identifica o contato e não pode se repetir.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="c-name">Nome *</Label>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={160}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-phone">Telefone (WhatsApp) *</Label>
            <Input
              id="c-phone"
              inputMode="tel"
              placeholder="(11) 99999-8888"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="c-company">Empresa</Label>
              <Input
                id="c-company"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-ig">Instagram</Label>
              <Input
                id="c-ig"
                placeholder="@usuario"
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as ContactCategory)}
              >
                <SelectTrigger aria-label="Categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="inbox-theme">
                  {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Responsável</Label>
              <Select
                value={form.assigned_to ?? NONE}
                onValueChange={(v) => set("assigned_to", v === NONE ? null : v)}
              >
                <SelectTrigger aria-label="Responsável">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="inbox-theme">
                  <SelectItem value={NONE}>Sem responsável</SelectItem>
                  {team.data
                    ?.filter((p) => p.active)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-tags">Etiquetas</Label>
            <Input
              id="c-tags"
              placeholder="separe por vírgula"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-notes">Anotação fixa do contato</Label>
            <Textarea
              id="c-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-full" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
