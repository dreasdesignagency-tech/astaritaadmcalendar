import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/inbox/EmptyState";
import { InboxScreen } from "@/components/inbox/InboxScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inboxAuthError, inboxSetPassword, useInboxAuth } from "@/lib/inbox/auth";

/** Destino dos links de convite e de recuperação de senha do projeto Inbox. */
export const Route = createFileRoute("/inbox/definir-senha")({
  head: () => ({ meta: [{ title: "Definir senha | Astarita Inbox" }] }),
  component: SetPassword,
});

const MIN = 8;

function SetPassword() {
  const { ready, user } = useInboxAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!ready) {
    return (
      <InboxScreen>
        <p className="text-center text-sm text-muted-foreground">Validando o link…</p>
      </InboxScreen>
    );
  }

  if (!user) {
    return (
      <InboxScreen>
        <EmptyState icon={KeyRound} title="Link inválido ou expirado">
          Peça um novo link na tela de entrada.
        </EmptyState>
        <div className="flex justify-center">
          <Link to="/inbox/entrar" className="text-sm font-medium text-primary hover:underline">
            Ir para a entrada
          </Link>
        </div>
      </InboxScreen>
    );
  }

  const submit = async () => {
    if (busy) return;
    if (password.length < MIN)
      return setNotice(`A senha precisa ter pelo menos ${MIN} caracteres.`);
    if (password !== confirm) return setNotice("As senhas não são iguais.");
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await inboxSetPassword(password);
      if (error) return setNotice(inboxAuthError(error));
      toast.success("Senha definida.");
      void navigate({ to: "/inbox", replace: true });
    } catch (e) {
      setNotice(inboxAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <InboxScreen>
      <h1 className="font-display text-xl font-semibold">Definir senha</h1>
      <p className="mb-5 text-sm text-muted-foreground">{user.email}</p>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm-password">Repita a senha</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        {notice && (
          <p
            role="alert"
            className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {notice}
          </p>
        )}
        <Button type="submit" className="rounded-full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar senha"}
        </Button>
      </form>
    </InboxScreen>
  );
}
