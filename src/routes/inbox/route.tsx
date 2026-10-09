import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SettingsIcon } from "lucide-react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { InboxScreen } from "@/components/inbox/InboxScreen";
import { getInboxConfig } from "@/lib/inbox/client";

/**
 * Portão de configuração do Inbox. Tudo abaixo de /inbox (inclusive o login) só aparece se o cliente do
 * projeto do Inbox estiver configurado. O calendário não passa por aqui e nunca depende disto.
 */
export const Route = createFileRoute("/inbox")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Astarita Inbox" },
      { name: "description", content: "Central de atendimento da Astarita." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InboxRoot,
});

function InboxRoot() {
  const config = getInboxConfig();
  if (config.ok) return <Outlet />;

  return (
    <InboxScreen>
      <EmptyState icon={SettingsIcon} title="Inbox não configurado">
        {config.reason === "missing" ? (
          <>
            Faltam variáveis de ambiente do projeto Supabase do Inbox:
            <span className="mt-2 block space-y-1 font-mono text-xs text-foreground">
              {config.missing.map((name) => (
                <span key={name} className="block">
                  {name}
                </span>
              ))}
            </span>
            <span className="mt-2 block">Defina as duas e reinicie o app.</span>
          </>
        ) : (
          config.message
        )}
      </EmptyState>
    </InboxScreen>
  );
}
