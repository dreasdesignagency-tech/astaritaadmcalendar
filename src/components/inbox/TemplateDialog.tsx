import { useQueryClient } from "@tanstack/react-query";
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
import { queueAndSendTemplate } from "@/lib/inbox/messaging";
import { useInboxProfile } from "@/lib/inbox/profile-context";

/**
 * Fora da janela de 24h a Meta só permite MODELOS (templates) previamente aprovados.
 * Este formulário envia um modelo que já existe e está aprovado no Gerenciador do WhatsApp.
 */
export function TemplateDialog({
  open,
  onOpenChange,
  conversationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}) {
  const profile = useInboxProfile();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("pt_BR");
  const [vars, setVars] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const variables = vars
      .split("|")
      .map((v) => v.trim())
      .filter(Boolean);
    const { messageId, result } = await queueAndSendTemplate({
      conversationId,
      name,
      language,
      variables,
      userId: profile.id,
    });
    setBusy(false);
    if (messageId) {
      await queryClient.invalidateQueries({ queryKey: ["inbox", "messages", conversationId] });
      await queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] });
    }
    if (!result.ok) return setError(result.error);
    toast.success("Modelo enviado à Meta. O status aparece na conversa.");
    setName("");
    setVars("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inbox-theme rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Enviar modelo aprovado</DialogTitle>
          <DialogDescription>
            A janela de 24 horas acabou. A Meta só permite enviar modelos aprovados antes. Informe o
            nome exato de um modelo aprovado no Gerenciador do WhatsApp.
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
            <Label htmlFor="tpl-name">Nome do modelo</Label>
            <Input
              id="tpl-name"
              placeholder="ex.: retorno_contato"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tpl-lang">Idioma</Label>
            <Input id="tpl-lang" value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tpl-vars">Variáveis do corpo (separe por |), se houver</Label>
            <Input
              id="tpl-vars"
              placeholder="ex.: Maria | segunda às 15h"
              value={vars}
              onChange={(e) => setVars(e.target.value)}
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
              {busy ? "Enviando…" : "Enviar modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
