import { Copy } from "lucide-react";
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

/** Mostra uma senha temporária UMA vez. Depois de fechar, ela não pode ser lida de novo (só trocada por outra). */
export function CredentialDialog({
  open,
  onClose,
  title,
  email,
  password,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  email?: string | undefined;
  password: string;
}) {
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copiado.`);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="inbox-theme rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Esta senha aparece só agora. Entregue à pessoa por um canal seguro. Depois de entrar,
            ela troca a senha em <strong>/inbox/definir-senha</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {email && (
            <p>
              E-mail: <strong>{email}</strong>
            </p>
          )}
          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded-xl bg-secondary px-3 py-2 font-mono text-sm"
              data-testid="temp-password"
            >
              {password}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void copy(password, "Senha")}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button className="rounded-full" onClick={onClose}>
            Já anotei
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
