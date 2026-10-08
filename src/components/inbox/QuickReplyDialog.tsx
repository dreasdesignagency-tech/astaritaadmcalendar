import { useQueryClient } from "@tanstack/react-query";
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
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { saveQuickReply, type QuickReply } from "@/lib/inbox/quick-replies";
import {
  QUICK_REPLY_CATEGORIES,
  QUICK_REPLY_LABEL,
  type QuickReplyCategory,
} from "@/lib/inbox/templates";

export function QuickReplyDialog({
  open,
  onOpenChange,
  reply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reply?: QuickReply | undefined;
}) {
  const profile = useInboxProfile();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<QuickReplyCategory>("primeiro_contato");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCategory(reply?.category ?? "primeiro_contato");
    setTitle(reply?.title ?? "");
    setBody(reply?.body ?? "");
    setError(null);
  }, [open, reply]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await saveQuickReply({ category, title, body }, profile.id, reply?.id);
      await queryClient.invalidateQueries({ queryKey: ["inbox", "quick-replies"] });
      toast.success(reply ? "Resposta atualizada." : "Resposta criada.");
      onOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error && e.message.startsWith("Preencha")
          ? e.message
          : "Não foi possível salvar. Tente de novo.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inbox-theme rounded-[2rem] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {reply ? "Editar resposta rápida" : "Nova resposta rápida"}
          </DialogTitle>
          <DialogDescription>
            Use {"{nome}"} para inserir o primeiro nome do contato. O texto sempre pode ser editado
            antes de enviar.
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
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as QuickReplyCategory)}>
              <SelectTrigger aria-label="Categoria da resposta">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="inbox-theme">
                {QUICK_REPLY_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {QUICK_REPLY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qr-title">Título</Label>
            <Input
              id="qr-title"
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qr-body">Texto</Label>
            <Textarea
              id="qr-body"
              rows={6}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
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
            <Button type="submit" className="rounded-full" disabled={busy}>
              {busy ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
