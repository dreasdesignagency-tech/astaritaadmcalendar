import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Asterisk } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { InboxScreen } from "@/components/inbox/InboxScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inboxAuthError, inboxResetPassword, inboxSignIn, useInboxAuth } from "@/lib/inbox/auth";

export const Route = createFileRoute("/inbox/entrar")({
  head: () => ({ meta: [{ title: "Entrar | Astarita Inbox" }] }),
  component: InboxLogin,
});

function InboxLogin() {
  const { ready, user } = useInboxAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) void navigate({ to: "/inbox", replace: true });
  }, [ready, user, navigate]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await inboxSignIn(email, password);
      if (error) setNotice(inboxAuthError(error));
    } catch (e) {
      setNotice(inboxAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  /** Só envia e-mail quando a pessoa pede, e para o endereço que ela digitou. */
  const recover = async () => {
    if (!email.trim()) {
      setNotice("Informe seu e-mail para receber o link de definição de senha.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await inboxResetPassword(email);
      if (error) setNotice(inboxAuthError(error));
      else toast.success("Se o e-mail tiver acesso ao Inbox, o link chega em instantes.");
    } catch (e) {
      setNotice(inboxAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <InboxScreen>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Asterisk className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <div>
          <h1 className="font-display text-xl font-semibold leading-tight">Astarita Inbox</h1>
          <p className="text-sm text-muted-foreground">Atendimento da equipe</p>
        </div>
      </div>

      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="inbox-email">E-mail</Label>
          <Input
            id="inbox-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="inbox-password">Senha</Label>
          <Input
            id="inbox-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {busy ? "Entrando…" : "Entrar"}
        </Button>
        <button
          type="button"
          onClick={() => void recover()}
          disabled={busy}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
        >
          Definir ou recuperar senha
        </button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground">
        Acesso restrito à equipe. Este login é só do Inbox.
      </p>
    </InboxScreen>
  );
}
