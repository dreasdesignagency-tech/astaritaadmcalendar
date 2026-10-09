import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle } from "lucide-react";

import { PageHeader } from "@/components/inbox/PageHeader";
import { UserAvatar } from "@/components/inbox/UserAvatar";
import { KnowledgeEditor } from "@/components/inbox/KnowledgeEditor";
import { WhatsAppSetup } from "@/components/inbox/WhatsAppSetup";
import { fetchTeam } from "@/lib/inbox/api";
import { useChannelStatus } from "@/lib/inbox/channel";
import { ROLE_LABEL } from "@/lib/inbox/types";

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
  const team = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });
  const channel = useChannelStatus();
  const wa = channel.data?.whatsapp;
  const ai = channel.data?.ai;

  const waDetail = channel.isPending
    ? "Verificando…"
    : channel.isError || !wa
      ? "Não foi possível verificar agora."
      : !wa.configured
        ? `Não conectado. Falta configurar no servidor: ${wa.missing.join(", ")}.`
        : wa.reachable === true
          ? `Conectado${wa.phone ? ` ao número ${wa.phone}` : ""}${wa.verifiedName ? ` (${wa.verifiedName})` : ""}.`
          : `Configurado, mas a Meta não respondeu com essas credenciais${wa.error ? `: ${wa.error}` : "."}`;
  const aiDetail = channel.isPending
    ? "Verificando…"
    : channel.isError || !ai
      ? "Não foi possível verificar agora."
      : ai.configured
        ? `Ligado (${ai.provider}, modelo ${ai.model}). A IA só sugere; você revisa e envia.`
        : `Não ligado. Falta configurar no servidor: ${ai.missing.join(", ")}.`;

  return (
    <>
      <PageHeader title="Configurações" subtitle="Equipe, conexões e conhecimento" />
      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto sm:gap-4 lg:grid-cols-2 lg:overflow-visible">
        <section className="inbox-surface rounded-[2rem] p-5 sm:p-6">
          <h2 className="mb-3 font-display text-base font-semibold">Equipe com acesso</h2>
          <ul className="space-y-2">
            {team.data?.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
                <UserAvatar name={p.full_name} src={p.avatar_url} />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{p.full_name}</span>
                  <span className="block text-xs text-muted-foreground">{ROLE_LABEL[p.role]}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.active ? "Ativo" : "Inativo"}
                </span>
              </li>
            ))}
            {team.isPending && <li className="text-sm text-muted-foreground">Carregando…</li>}
            {team.isError && (
              <li className="text-sm text-destructive">Não foi possível carregar a equipe.</li>
            )}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Não há cadastro público. Novos acessos são criados só por quem administra o projeto.
          </p>
        </section>

        <section className="inbox-surface rounded-[2rem] p-5 sm:p-6">
          <h2 className="mb-3 font-display text-base font-semibold">Conexões</h2>
          <ul className="space-y-2">
            <Status
              ok={!!wa?.configured && wa.reachable === true}
              label="WhatsApp Business Platform"
              detail={waDetail}
            />
            <Status ok={!!ai?.configured} label="Assistente de IA" detail={aiDetail} />
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
          <h2 className="mb-1 font-display text-base font-semibold">Conhecimento da Astarita</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            É daqui que o Assistente tira as informações. O que ficar em branco, ele não inventa.
          </p>
          <KnowledgeEditor />
        </section>
      </div>
    </>
  );
}
