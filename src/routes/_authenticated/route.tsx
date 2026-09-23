import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/AppShell";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) void navigate({ to: "/auth", replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user) return <LoadingScreen />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <BrandLogo className="animate-pulse" />
    </div>
  );
}
