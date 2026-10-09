import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Circle, Copy, RefreshCw, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChannelStatus } from "@/lib/inbox/channel";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { fetchWhatsAppSettings, saveWhatsAppSettings } from "@/lib/inbox/team";
import { buildSteps, isPublicHttps, webhookUrl, type StepState } from "@/lib/inbox/whatsapp-setup";

const ICON: Record<StepState, { cls: string; node: ReactNode }> = {
  done: { cls: "bg-primary text-primary-foreground", node: <Check className="h-3 w-3" /> },
  todo: {
    cls: "bg-highlight ring-1 ring-black/10",
    node: <Circle className="h-2 w-2 fill-current" />,
  },
  error: {
    cls: "bg-destructive text-destructive-foreground",
    node: <TriangleAlert className="h-3 w-3" />,
  },
  unknown: { cls: "bg-muted text-muted-foreground", node: <Circle className="h-2 w-2" /> },
};

function CopyRow({ label, value, testId }: { label: string; value: string; testId?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };
  return (
    <div>
      <h3 className="mb-1 text-sm font-medium">{label}</h3>
      <div className="flex items-center gap-2">
        <code
          className="min-w-0 flex-1 truncate rounded-xl bg-secondary px-3 py-2 text-xs"
          data-testid={testId}
        >
          {value}
        </code>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => void copy()}>
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
        </Button>
      </div>
    </div>
  );
}

/** Conexão do WhatsApp (Cloud API oficial) da empresa: passos reais, formulário e o que colar na Meta. Segredos nunca voltam. */
export function WhatsAppSetup() {
  const me = useInboxProfile();
  const isAdmin = me.access === "owner" || me.access === "admin";
  const qc = useQueryClient();
  const q = useChannelStatus();
  const settings = useQuery({
    queryKey: ["inbox", "wa-settings"],
    queryFn: async () => {
      const r = await fetchWhatsAppSettings();
      if (!r.ok) throw new Error(r.error);
      return r;
    },
    enabled: isAdmin,
    retry: false,
  });
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const [phoneNumberId, setPhoneNumberId] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [fieldError, setFieldError] = useState<{ field?: string; message: string } | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const r = await saveWhatsAppSettings({
        ...(phoneNumberId !== null ? { phoneNumberId } : {}),
        ...(version !== null ? { version } : {}),
        ...(token.trim() ? { token } : {}),
        ...(appSecret.trim() ? { appSecret } : {}),
      });
      if (!r.ok) {
        const err = new Error(r.error) as Error & { field?: string };
        if ("field" in r && typeof r.field === "string") err.field = r.field;
        throw err;
      }
    },
    onSuccess: async () => {
      setToken("");
      setAppSecret("");
      setFieldError(null);
      toast.success("Dados salvos. Conferindo com a Meta…");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["inbox", "wa-settings"] }),
        qc.invalidateQueries({ queryKey: ["inbox", "channel-status"] }),
      ]);
    },
    onError: (e: Error & { field?: string }) =>
      setFieldError({ ...(e.field ? { field: e.field } : {}), message: e.message }),
  });

  if (q.isPending) return <p className="text-sm text-muted-foreground">Verificando…</p>;
  if (q.isError)
    return (
      <div className="text-sm">
        <p className="text-destructive">Não foi possível verificar a conexão agora.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 rounded-full"
          onClick={() => void q.refetch()}
        >
          Tentar de novo
        </Button>
      </div>
    );

  const steps = buildSteps(q.data);
  const s = settings.data && settings.data.ok ? settings.data : null;
  const url = s?.webhookKey ? webhookUrl(origin, s.webhookKey) : null;
  const dirty = phoneNumberId !== null || version !== null || !!token.trim() || !!appSecret.trim();

  return (
    <div className="space-y-5">
      <ol className="space-y-2" aria-label="Passos da conexão do WhatsApp">
        {steps.map((st) => (
          <li
            key={st.id}
            className="flex items-start gap-3 rounded-2xl bg-secondary px-4 py-3"
            data-state={st.state}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ICON[st.state].cls}`}
            >
              {ICON[st.state].node}
            </span>
            <span>
              <span className="block text-sm font-medium">{st.title}</span>
              <span className="block text-xs text-muted-foreground">{st.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      {!isAdmin && (
        <p className="text-xs text-muted-foreground">
          Só o administrador da empresa altera os dados do WhatsApp.
        </p>
      )}

      {isAdmin && settings.isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar os dados do WhatsApp.{" "}
          {settings.error instanceof Error ? settings.error.message : ""}
        </p>
      )}

      {isAdmin && s && (
        <>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (dirty) save.mutate();
            }}
            aria-label="Dados do WhatsApp"
          >
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone-id">ID do número de telefone</Label>
              <Input
                id="wa-phone-id"
                inputMode="numeric"
                autoComplete="off"
                value={phoneNumberId ?? s.phoneNumberId ?? ""}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="rounded-full"
                placeholder="Só números. Não é o telefone."
              />
              {fieldError?.field === "phoneNumberId" && (
                <p className="text-xs text-destructive">{fieldError.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-version">Versão da API</Label>
              <Input
                id="wa-version"
                autoComplete="off"
                value={version ?? s.version ?? ""}
                onChange={(e) => setVersion(e.target.value)}
                className="rounded-full"
                placeholder="v21.0"
              />
              {fieldError?.field === "version" && (
                <p className="text-xs text-destructive">{fieldError.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-token">Token de acesso</Label>
              <Input
                id="wa-token"
                type="password"
                autoComplete="new-password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="rounded-full"
                placeholder={s.hasToken ? "Salvo. Cole outro só para trocar." : "Cole o token"}
              />
              {fieldError?.field === "token" && (
                <p className="text-xs text-destructive">{fieldError.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-secret">App Secret</Label>
              <Input
                id="wa-secret"
                type="password"
                autoComplete="new-password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="rounded-full"
                placeholder={
                  s.hasAppSecret ? "Salvo. Cole outro só para trocar." : "Cole o App Secret"
                }
              />
              {fieldError?.field === "appSecret" && (
                <p className="text-xs text-destructive">{fieldError.message}</p>
              )}
            </div>
            {fieldError && !fieldError.field && (
              <p className="text-sm text-destructive sm:col-span-2">{fieldError.message}</p>
            )}
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" className="rounded-full" disabled={!dirty || save.isPending}>
                {save.isPending ? "Salvando…" : "Salvar e conferir com a Meta"}
              </Button>
              <p className="text-xs text-muted-foreground">
                O token e o App Secret ficam guardados com criptografia e nunca aparecem de novo na
                tela.
              </p>
            </div>
          </form>

          {url && (
            <CopyRow label="Endereço do webhook (cole na Meta)" value={url} testId="webhook-url" />
          )}
          {url && !isPublicHttps(origin) && (
            <p className="text-xs text-destructive">
              Este endereço não é público em HTTPS. A Meta só aceita o webhook em um endereço
              público com HTTPS.
            </p>
          )}
          {s.verifyToken && (
            <CopyRow
              label='"Verify token" (cole na Meta, no campo Verificar token)'
              value={s.verifyToken}
              testId="verify-token"
            />
          )}
          <p className="text-xs text-muted-foreground">
            Na Meta, assine o campo <strong>messages</strong> do webhook. O passo a passo completo
            está no guia de conexão do WhatsApp.
          </p>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => void q.refetch()}
        disabled={q.isFetching}
      >
        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${q.isFetching ? "animate-spin" : ""}`} />{" "}
        Verificar de novo
      </Button>
    </div>
  );
}
