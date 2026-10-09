import { createFileRoute, redirect } from "@tanstack/react-router";

/** O projeto agora é só o Astarita Inbox: a raiz leva direto para ele. */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/inbox", replace: true });
  },
});
