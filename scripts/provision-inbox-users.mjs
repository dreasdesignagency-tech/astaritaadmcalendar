#!/usr/bin/env node
/**
 * Cria (ou atualiza) os usuários autorizados do Astarita Inbox.
 *
 * Não existe cadastro público: só quem passa por aqui ganha uma linha em public.profiles.
 * Cada pessoa recebe um convite por e-mail do Supabase Auth e define a própria senha.
 * Nenhuma senha passa por este script.
 *
 * Uso (as variáveis ficam só no seu terminal, nunca no GitHub):
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   ANDREAS_EMAIL=... JULINE_EMAIL=... \
 *   node scripts/provision-inbox-users.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const team = [
  { fullName: "Andreas", role: "director", email: process.env.ANDREAS_EMAIL },
  { fullName: "Juline", role: "ceo", email: process.env.JULINE_EMAIL },
];

const missing = [
  !url && "SUPABASE_URL",
  !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
  ...team.filter((m) => !m.email).map((m) => `${m.fullName.toUpperCase()}_EMAIL`),
].filter(Boolean);

if (missing.length) {
  console.error(`Faltam variáveis de ambiente: ${missing.join(", ")}`);
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(email) {
  // A equipe é pequena: uma página de 200 usuários basta.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

for (const member of team) {
  const email = member.email.trim();
  let user = await findUserByEmail(email);
  let invited = false;

  if (!user) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
    if (error) throw new Error(`Convite para ${member.fullName} falhou: ${error.message}`);
    user = data.user;
    invited = true;
  }

  const { error } = await admin
    .from("profiles")
    .upsert(
      { id: user.id, full_name: member.fullName, role: member.role, active: true },
      { onConflict: "id" },
    );
  if (error) throw new Error(`Perfil de ${member.fullName} falhou: ${error.message}`);

  console.log(
    `${member.fullName}: ${invited ? "convite enviado" : "usuário já existia"}, perfil ativo.`,
  );
}

console.log(
  "Pronto. Lembre de desativar o cadastro público em Authentication > Providers > Email.",
);
