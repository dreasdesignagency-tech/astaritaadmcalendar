import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | Astarita" },
      {
        name: "description",
        content: "Acesso ao planejamento de conteúdo da Astarita.",
      },
      { property: "og:title", content: "Entrar | Astarita" },
      {
        property: "og:description",
        content: "Entre para ver o calendário editorial e a análise de funil por cliente.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "entrar" | "criar";

function AuthPage() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) void navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);

    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setNotice(authErrorMessage(error));
        return;
      }
      void navigate({ to: "/", replace: true });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);

    if (error) {
      setNotice(authErrorMessage(error));
      return;
    }
    if (data.session) {
      void navigate({ to: "/", replace: true });
      return;
    }
    setSent(true);
  };

  const recover = async () => {
    if (!email.trim()) {
      setNotice("Informe seu e-mail para receber o link de recuperação.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      setNotice(authErrorMessage(error));
      return;
    }
    toast.success("Se o e-mail existir, o link de recuperação chega em instantes.");
  };

  if (sent) {
    return (
      <Layout>
        <h1 className="text-lg font-semibold">Confirme seu e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um link para <strong className="text-foreground">{email}</strong>. Clique nele
          para ativar sua conta e então entre com a senha que você criou.
        </p>
        <Button
          className="mt-5 w-full"
          variant="outline"
          onClick={() => {
            setSent(false);
            setMode("entrar");
          }}
        >
          Voltar para a tela de entrada
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
        {(["entrar", "criar"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode(m);
              setNotice(null);
            }}
            className={`flex-1 rounded-lg capitalize ${
              mode === m ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {m === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        ))}
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {notice && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive">
            {notice}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "entrar" ? "Entrar" : "Criar minha conta"}
        </Button>
      </form>

      {mode === "entrar" && (
        <Button
          type="button"
          variant="link"
          onClick={() => void recover()}
          className="mt-3 px-0 text-muted-foreground"
        >
          Esqueci minha senha
        </Button>
      )}
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen p-3 sm:p-5 md:grid-cols-[1.05fr_1fr]">
      <div className="hidden flex-col justify-between overflow-hidden rounded-[2rem] bg-primary p-10 text-primary-foreground shadow-2xl md:flex">
        <BrandLogo showName className="text-primary-foreground" />
        <div className="space-y-3">
          <h2 className="font-display text-3xl font-bold leading-snug">
            Seu calendário editorial, num só lugar.
          </h2>
          <p className="max-w-xs text-sm text-primary-foreground/70">
            Planeje publicações por cliente, acompanhe o funil e mantenha tudo aprovado antes da
            hora.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">Uso interno.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <BrandLogo showName className="mb-6 text-primary md:hidden" />
          <div className="glass-panel rounded-3xl p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
