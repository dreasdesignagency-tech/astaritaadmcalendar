import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/tmp-seed")({
  server: { handlers: { GET: async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({ email: "julinerenner@gmail.com", password: "4505010", email_confirm: true });
    return new Response("RESULT " + JSON.stringify({ ok: !!data?.user, err: error?.message }));
  } } },
});
