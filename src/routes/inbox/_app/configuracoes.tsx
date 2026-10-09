import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle } from "lucide-react";

import { KnowledgeEditor } from "@/components/inbox/KnowledgeEditor";
import { PageHeader } from "@/components/inbox/PageHeader";
import { TeamManager } from "@/components/inbox/TeamManager";
import { WhatsAppSetup } from "@/components/inbox/WhatsAppSetup";
import { useChannelStatus } from "@/lib/inbox/channel";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { PLAN_LABEL } from "@/lib/inbox/types";

export const Route = createFileRoute("/inbox/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações | Astarita Inbox" }] }),
  component: SettingsPage,
});

function Status({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-secondary px-4 py-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-primary text-primary-foreground" : "bg-highlight ring-1 ring-black/10"}`}
      >
        {ok ? <Check className="h-3 w-3" /> : <Circle className="h-2 w-2 fill-current" />}
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </li>
  );
}

function SettingsPage() {
  const me = useInboxProfile();
  const channel = useChannelStatus();
  const wa = channel.data?.whatsapp;
  const ai = channel.data?.ai;
  const serverMissing = channel.data?.serverMissing;

  const waDetail = channel.isPending
    ? "Verificando…"
    : channel.isError || !wa
      ? "Não foi possível verificar agora."
      : serverMissing?.length
        ? "O servidor ainda não está pronto. Veja o passo a passo abaixo."
        : !wa.configured
          ? `Não conectado. Falta preencher: ${wa.missing.join(", ")}.`
          : wa.reachable === true
            ? `Conectado${wa.phone ? ` ao número ${wa.phone}` : ""}${wa.verifiedName ? ` (${wa.verifiedName})` : ""}.`
            : `Dados salvos, mas a Meta não respondeu com eles${wa.error ? `: ${wa.error}` : "."}`;
  const aiDetail = channel.isPending
    ? "Verificando…"
    : channel.isError || !ai
      ? "Não foi possível verificar agora."
      : serverMissing?.length
        ? "O servidor ainda não está pronto."
        : ai.configured
          ? `Ligado. A IA só sugere; você revisa e envia. Limite do plano: ${me.org.ai_monthly_limit} sugestões por mês.`
          : me.is_platform_admin
            ? `Não ligado. Falta configurar no servidor: ${ai.missing.join(", ")}.`
            : "Ainda não ativado na plataforma. O atendimento funciona normalmente sem ele.";

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle={`${me.org.name} · plano ${PLAN_LABEL[me.org.plan]}`}
      />
      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto sm:gap-4 lg:grid-cols-2 lg:overflow-visible">
        <section className="inbox-surface rounded-[2rem] p-5 sm:p-6">
          <TeamManager />
        </section>

        <section className="inbox-surface rounded-[2rem] p-5 sm:p-6">
          <h2 className="mb-3 font-display text-base font-semibold">Conexões</h2>
          <ul className="space-y-2">
            <Status
              ok={!!wa?.configured && wa.reachable === true}
              label="WhatsApp Business Platform"
              detail={waDetail}
            />
            <Status
              ok={!!ai?.configured && !serverMissing?.length}
              label="Assistente de IA"
              detail={aiDetail}
            />
          </ul>
        </section>

        <section className="inbox-surface rounded-[2rem] p-5 sm:p-6 lg:col-span-2">
          <h2 className="mb-1 font-display text-base font-semibold">Conectar o WhatsApp</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Integração oficial (WhatsApp Cloud API). Cada passo muda sozinho quando a configuração é
            feita de verdade.
          </p>
          <WhatsAppSetup />
        </section>

        <section className="inbox-surface rounded-[2rem] p-5 sm:p-6 lg:col-span-2">
          <h2 className="mb-1 font-display text-base font-semibold">Conhecimento da empresa</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            É daqui que o Assistente tira as informações. O que ficar em branco, ele não inventa.
          </p>
          <KnowledgeEditor />
        </section>
      </div>
    </>
  );
}
