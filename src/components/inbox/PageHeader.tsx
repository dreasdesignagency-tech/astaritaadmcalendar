import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { UserAvatar } from "@/components/inbox/UserAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WHATSAPP_STATE } from "@/lib/inbox/api";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { cn } from "@/lib/utils";

const WHATSAPP_COPY = {
  not_connected: {
    label: "WhatsApp não conectado",
    hint: "A conexão com a Cloud API oficial da Meta entra na Fase 4.",
    dot: "bg-highlight ring-1 ring-black/10",
  },
  connected: {
    label: "WhatsApp conectado",
    hint: "Recebendo mensagens pela Cloud API oficial.",
    dot: "bg-green-500",
  },
};

function WhatsAppStatus() {
  const copy = WHATSAPP_COPY[WHATSAPP_STATE];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inbox-surface hidden items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-muted-foreground lg:flex">
          <span className={cn("h-2.5 w-2.5 rounded-full", copy.dot)} />
          {copy.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{copy.hint}</TooltipContent>
    </Tooltip>
  );
}

export function PageHeader({
  title,
  subtitle,
  search,
  action,
}: {
  title: string;
  subtitle: string;
  /** Só aparece nas telas onde a busca de fato filtra algo. */
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
  action?: ReactNode;
}) {
  const profile = useInboxProfile();

  return (
    <header className="inbox-surface flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-[2rem] px-5 py-4 sm:px-7">
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {search && (
        <label className="relative order-last w-full sm:order-none sm:w-64">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Buscar"}
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </label>
      )}

      <WhatsAppStatus />
      <UserAvatar name={profile.full_name} src={profile.avatar_url} className="hidden sm:flex" />
      {action}
    </header>
  );
}
