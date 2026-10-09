import { Check, Circle, Copy, RefreshCw, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useChannelStatus } from "@/lib/inbox/channel";
import {
  buildEnvRows,
  buildSteps,
  isPublicHttps,
  webhookUrl,
  type StepState,
} from "@/lib/inbox/whatsapp-setup";

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

/** Conexão do WhatsApp (Cloud API oficial): estado real, o que falta por NOME e o endereço do webhook. Nenhum segredo é exibido. */
export function WhatsAppSetup() {
  const q = useChannelStatus();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = webhookUrl(origin);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copiado.`);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

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
  const rows = buildEnvRows(q.data);

  return (
    <div className="space-y-5">
      <ol className="space-y-2" aria-label="Passos da conexão do WhatsApp">
        {steps.map((s) => (
          <li
            key={s.id}
            className="flex items-start gap-3 rounded-2xl bg-secondary px-4 py-3"
            data-state={s.state}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ICON[s.state].cls}`}
            >
              {ICON[s.state].node}
            </span>
            <span>
              <span className="block text-sm font-medium">{s.title}</span>
              <span className="block text-xs text-muted-foreground">{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <div>
        <h3 className="mb-1 text-sm font-medium">Endereço do webhook (cole na Meta)</h3>
        <div className="flex items-center gap-2">
          <code
            className="min-w-0 flex-1 truncate rounded-xl bg-secondary px-3 py-2 text-xs"
            data-testid="webhook-url"
          >
            {url}
          </code>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => void copy(url, "Endereço")}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
          </Button>
        </div>
        {!isPublicHttps(origin) && (
          <p className="mt-1 text-xs text-destructive">
            Este endereço não é público em HTTPS. A Meta só aceita o webhook em um endereço público
            com HTTPS.
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Campo &quot;Verify token&quot; na Meta: o mesmo texto que você colocou em
          WHATSAPP_VERIFY_TOKEN. Campo a assinar:
          <strong> messages</strong>.
        </p>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-medium">
          Variáveis do servidor (só os nomes, nunca os valores)
        </h3>
        <ul className="space-y-1">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-2 text-xs">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.present ? "bg-green-500" : "bg-destructive"}`}
                aria-label={
                  r.present === true
                    ? "definida"
                    : r.present === false
                      ? "faltando"
                      : "não verificada"
                }
              />
              <code className="font-mono">{r.name}</code>
              <span className="text-muted-foreground">{r.hint}</span>
            </li>
          ))}
        </ul>
      </div>

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
