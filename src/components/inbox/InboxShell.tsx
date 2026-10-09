import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Asterisk,
  Building2,
  Columns3,
  LogOut,
  MessageSquareText,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/inbox/UserAvatar";
import { inboxSignOut } from "@/lib/inbox/auth";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { personLabel } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/inbox", label: "Caixa de entrada", icon: MessageSquareText, exact: true },
  { to: "/inbox/contatos", label: "Contatos", icon: Users, exact: false },
  { to: "/inbox/funil", label: "Funil comercial", icon: Columns3, exact: false },
  { to: "/inbox/respostas", label: "Respostas rápidas", icon: Zap, exact: false },
  { to: "/inbox/configuracoes", label: "Configurações", icon: Settings, exact: false },
] as const;

const platformItem = {
  to: "/inbox/plataforma",
  label: "Plataforma",
  icon: Building2,
  exact: false,
} as const;

const rowClass =
  "flex h-11 w-full items-center gap-3 rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const itemClass =
  "flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function InboxShell({ children }: { children: ReactNode }) {
  const profile = useInboxProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const items = profile.is_platform_admin ? [...nav, platformItem] : nav;

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
        {/* Menu lateral com o nome de cada página ao lado do ícone (a partir do tablet) */}
        <aside className="inbox-surface hidden w-[212px] shrink-0 flex-col rounded-[2rem] px-3 py-5 md:flex">
          <Link
            to="/inbox"
            aria-label="Início do Inbox"
            className="mb-5 flex items-center gap-3 rounded-full px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Asterisk className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 font-display text-base font-semibold leading-tight">
              <span className="block truncate">{profile.org.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">Inbox</span>
            </span>
          </Link>

          <nav className="flex flex-col gap-1" aria-label="Principal">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className={rowClass}
                activeProps={{ className: "bg-accent text-primary" }}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <button onClick={leave} className={rowClass}>
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Sair</span>
            </button>
            <div className="flex items-center gap-3 rounded-full bg-secondary px-2 py-1.5">
              <UserAvatar name={profile.full_name} src={profile.avatar_url} className="h-9 w-9" />
              <span className="min-w-0 text-xs leading-tight">
                <span className="block truncate font-medium">{profile.full_name}</span>
                <span className="block truncate text-muted-foreground">{personLabel(profile)}</span>
              </span>
            </div>
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
            {items.map((item) => (
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
