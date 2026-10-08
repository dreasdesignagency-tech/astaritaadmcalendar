import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Asterisk, DatabaseZap, LogOut, ShieldAlert, WifiOff } from "lucide-react";

import { EmptyState } from "@/components/inbox/EmptyState";
import { InboxShell } from "@/components/inbox/InboxShell";
import { Button } from "@/components/ui/button";
import { signOut, useAuth } from "@/lib/auth";
import { fetchMyProfile, isMissingSchemaError } from "@/lib/inbox/api";
import { InboxProfileProvider } from "@/lib/inbox/profile-context";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "Astarita Inbox" },
      { name: "description", content: "Central de atendimento da Astarita." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InboxLayout,
});

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="inbox-theme fixed inset-0 flex items-center justify-center bg-background p-4">
      <div className="inbox-surface w-full max-w-md rounded-[2rem] p-6">{children}</div>
    </div>
  );
}

function InboxLayout() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const profileQuery = useQuery({
    queryKey: ["inbox", "profile", userId],
    queryFn: () => fetchMyProfile(userId),
    enabled: !!userId,
    retry: false,
  });

  if (profileQuery.isPending) {
    return (
      <div className="inbox-theme fixed inset-0 flex items-center justify-center bg-background">
        <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Asterisk className="h-7 w-7" strokeWidth={2.5} />
        </span>
      </div>
    );
  }

  if (profileQuery.isError) {
    const missing = isMissingSchemaError(profileQuery.error);
    return (
      <FullScreen>
        <EmptyState
          tone="error"
          icon={missing ? DatabaseZap : WifiOff}
          title={missing ? "O banco do Inbox ainda não foi criado" : "Não foi possível conectar"}
        >
          {missing
            ? "Aplique a migration 20261008000000_inbox_foundation.sql no Supabase e recarregue a página."
            : "Verifique sua internet e tente de novo."}
        </EmptyState>
        <div className="flex justify-center">
          <Button className="rounded-full" onClick={() => void profileQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      </FullScreen>
    );
  }

  const profile = profileQuery.data;
  if (!profile || !profile.active) {
    return (
      <FullScreen>
        <EmptyState icon={ShieldAlert} title="Acesso restrito">
          O Astarita Inbox é privado. Esta conta ({user?.email}) não está autorizada. Peça acesso a
          quem administra o sistema.
        </EmptyState>
        <div className="flex justify-center">
          <Button variant="outline" className="rounded-full" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </FullScreen>
    );
  }

  return (
    <InboxProfileProvider value={profile}>
      <InboxShell>
        <Outlet />
      </InboxShell>
    </InboxProfileProvider>
  );
}
