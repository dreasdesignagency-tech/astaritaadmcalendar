import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Asterisk, Columns3, LogOut, MessageSquareText, Settings, Users, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/inbox/UserAvatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { inboxSignOut } from "@/lib/inbox/auth";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { ROLE_LABEL } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/inbox", label: "Caixa de entrada", icon: MessageSquareText, exact: true },
  { to: "/inbox/contatos", label: "Contatos", icon: Users, exact: false },
  { to: "/inbox/funil", label: "Funil comercial", icon: Columns3, exact: false },
  { to: "/inbox/respostas", label: "Respostas rápidas", icon: Zap, exact: false },
  { to: "/inbox/configuracoes", label: "Configurações", icon: Settings, exact: false },
] as const;

const itemClass =
  "flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function InboxShell({ children }: { children: ReactNode }) {
  const profile = useInboxProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const leave = async () => {
    // Só o cache do Inbox: o cache do calendário continua intacto.
    await queryClient.cancelQueries({ queryKey: ["inbox"] });
    queryClient.removeQueries({ queryKey: ["inbox"] });
    await inboxSignOut();
    toast.success("Você saiu do Inbox.");
    void navigate({ to: "/inbox/entrar", replace: true });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="inbox-theme fixed inset-0 flex gap-3 overflow-hidden bg-background p-3 sm:gap-4 sm:p-4">
        {/* Sidebar estreita (desktop e tablet) */}
        <aside className="inbox-surface hidden w-[72px] shrink-0 flex-col items-center rounded-[2rem] py-5 md:flex">
          <Link
            to="/inbox"
            aria-label="Astarita Inbox"
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Asterisk className="h-6 w-6" strokeWidth={2.5} />
          </Link>

          <nav
            className="flex flex-col items-center gap-1.5 rounded-full bg-secondary p-1.5"
            aria-label="Principal"
          >
            {nav.map((item) => (
              <Hint key={item.to} label={item.label}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className={itemClass}
                  activeProps={{ className: "bg-accent text-primary" }}
                  aria-label={item.label}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              </Hint>
            ))}
          </nav>

          <div className="mt-auto flex flex-col items-center gap-2">
            <Hint label="Sair">
              <button onClick={leave} className={itemClass} aria-label="Sair">
                <LogOut className="h-5 w-5" />
              </button>
            </Hint>
            <Hint label={`${profile.full_name} · ${ROLE_LABEL[profile.role]}`}>
              <span>
                <UserAvatar
                  name={profile.full_name}
                  src={profile.avatar_url}
                  className="h-10 w-10"
                />
              </span>
            </Hint>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          {/* Navegação do celular */}
          <nav
            className="inbox-surface flex shrink-0 items-center justify-between rounded-full px-2 py-1.5 md:hidden"
            aria-label="Principal"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Asterisk className="h-5 w-5" strokeWidth={2.5} />
            </span>
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className={cn(itemClass, "h-10 w-10")}
                activeProps={{ className: "bg-accent text-primary" }}
                aria-label={item.label}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
            <button onClick={leave} className={cn(itemClass, "h-10 w-10")} aria-label="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          </nav>

          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}
