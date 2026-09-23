import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Definir nova senha | Astarita" },
      {
        name: "description",
        content: "Defina uma nova senha para acessar o planejamento de conteúdo da Astarita.",
      },
      { property: "og:title", content: "Definir nova senha | Astarita" },
      {
        property: "og:description",
        content: "Defina uma nova senha para o calendário editorial da Astarita.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    toast.success("Senha atualizada.");
    void navigate({ to: "/", replace: true });
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <BrandLogo className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass-panel w-full max-w-sm space-y-4 rounded-3xl p-6">
        <div>
          <BrandLogo showName className="mb-6 text-primary" />
          <h1 className="font-display text-lg font-bold text-primary">Definir nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma senha nova para {user?.email ?? "sua conta"}.
          </p>
        </div>

        {!user && (
          <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
            Seu link de recuperação expirou. Solicite um novo na tela de entrada.
          </p>
        )}

        {user && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Repetir senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={submit} disabled={saving}>
              Salvar senha
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
