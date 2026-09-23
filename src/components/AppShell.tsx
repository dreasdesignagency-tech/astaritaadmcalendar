import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";

import { signOut, useAuth } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

const nav = [
  { to: "/", label: "Calendário", icon: CalendarDays },
  { to: "/clientes", label: "Clientes", icon: Users },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const leave = async () => {
    queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    toast.success("Você saiu.");
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen p-3 text-foreground sm:p-5 lg:p-6">
      <div className="glass-panel mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1540px] overflow-hidden rounded-[2rem]">
      <aside className="hidden w-24 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar px-3 py-7 md:flex">
        <BrandLogo className="mb-10" />
        <nav className="space-y-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              activeProps={{ className: "bg-primary text-primary-foreground shadow-lg font-medium" }}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <button
            onClick={leave}
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            title={`Sair de ${user?.email ?? "sua conta"}`}
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 md:hidden">
          <BrandLogo className="[&_img]:h-9 [&_img]:w-9" />
          <nav className="ml-auto flex gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                activeProps={{ className: "bg-accent text-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={leave}
            aria-label="Sair"
            className="rounded-md border border-border p-1.5 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-7 lg:p-10">{children}</main>
      </div>
      </div>
    </div>
  );
}
