import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Asterisk, DatabaseZap, LogOut, ShieldAlert, WifiOff } from "lucide-react";
import { useEffect } from "react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { InboxScreen } from "@/components/inbox/InboxScreen";
import { InboxShell } from "@/components/inbox/InboxShell";
import { Button } from "@/components/ui/button";
import { fetchMyProfile, isMissingSchemaError } from "@/lib/inbox/api";
import { inboxSignOut, useInboxAuth } from "@/lib/inbox/auth";
import { InboxProfileProvider } from "@/lib/inbox/profile-context";
import { useInboxRealtime } from "@/lib/inbox/realtime";

/**
 * Área protegida do Inbox: exige login no projeto do Inbox (não no do calendário)
 * e um perfil ativo em public.profiles.
 */
export const Route = createFileRoute("/inbox/_app")({
  component: InboxAppLayout,
});

function Loading() {
  return (
    <div className="inbox-theme fixed inset-0 flex items-center justify-center bg-background">
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Asterisk className="h-7 w-7" strokeWidth={2.5} />
      </span>
    </div>
  );
}

/** Liga o Supabase Realtime enquanto o Inbox estiver aberto. */
function RealtimeBridge({ userId }: { userId: string }) {
  useInboxRealtime(userId);
  return null;
}

function InboxAppLayout() {
  const { ready, user } = useInboxAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? "";

  useEffect(() => {
    if (ready && !user) void navigate({ to: "/inbox/entrar", replace: true });
  }, [ready, user, navigate]);

  const profileQuery = useQuery({
    queryKey: ["inbox", "profile", userId],
    queryFn: () => fetchMyProfile(userId),
    enabled: !!userId,
    retry: false,
  });

  if (!ready || !user) return <Loading />;
  if (profileQuery.isPending) return <Loading />;

  if (profileQuery.isError) {
    const missing = isMissingSchemaError(profileQuery.error);
    return (
      <InboxScreen>
        <EmptyState
          tone="error"
          icon={missing ? DatabaseZap : WifiOff}
          title={
            missing ? "O banco do Inbox não tem as tabelas esperadas" : "Não foi possível conectar"
          }
        >
          {missing
            ? "Confira se as variáveis VITE_INBOX_* apontam para o projeto Supabase Astarita Inbox."
            : "Verifique sua internet e tente de novo."}
        </EmptyState>
        <div className="flex justify-center">
          <Button className="rounded-full" onClick={() => void profileQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      </InboxScreen>
    );
  }

  const profile = profileQuery.data;
  if (!profile || !profile.active) {
    return (
      <InboxScreen>
        <EmptyState icon={ShieldAlert} title="Acesso restrito">
          O Astarita Inbox é privado. Esta conta ({user.email}) não está autorizada. Peça acesso a
          quem administra o sistema.
        </EmptyState>
        <div className="flex justify-center">
          <Button variant="outline" className="rounded-full" onClick={() => void inboxSignOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </InboxScreen>
    );
  }

  return (
    <InboxProfileProvider value={profile}>
      <RealtimeBridge userId={profile.id} />
      <InboxShell>
        <Outlet />
      </InboxShell>
    </InboxProfileProvider>
  );
}
