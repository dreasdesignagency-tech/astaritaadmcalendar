#!/usr/bin/env node
/**
 * Prepara os perfis autorizados do Astarita Inbox (Andreas e Juline).
 *
 * Roda SOMENTE contra o projeto Supabase do Inbox, com variáveis próprias (INBOX_*), para nunca usar por engano
 * as credenciais do calendário. Não existe cadastro público: só quem passa por aqui ganha linha em public.profiles.
 *
 * Comportamento padrão (seguro):
 *   - Usuário já existe no projeto Inbox  -> reaproveita e cria/ativa o perfil.
 *   - Usuário não existe                  -> NÃO cria e NÃO convida. Só avisa.
 *   Convite por e-mail só com a opção explícita --invite. Nenhuma senha passa por este script.
 *   --dry-run mostra o que seria feito sem gravar nada.
 *
 * Uso (variáveis só no seu terminal; nunca no GitHub, no frontend ou no chat):
 *   INBOX_SUPABASE_URL=https://<ref>.supabase.co \
 *   INBOX_SUPABASE_SERVICE_ROLE_KEY=... \
 *   ANDREAS_EMAIL=... JULINE_EMAIL=... \
 *   node scripts/provision-inbox-users.mjs [--dry-run] [--invite]
 *
 * Para --invite também defina INBOX_SITE_URL (endereço onde o Inbox roda), usado no link do convite.
 */
import { createClient } from "@supabase/supabase-js";

import { findUserByEmail, planMember } from "./lib/users.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const invite = args.has("--invite");

const url = process.env.INBOX_SUPABASE_URL;
const serviceKey = process.env.INBOX_SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.INBOX_SITE_URL;

const team = [
  { fullName: "Andreas", role: "director", email: process.env.ANDREAS_EMAIL },
  { fullName: "Juline", role: "ceo", email: process.env.JULINE_EMAIL },
];

const missing = [
  !url && "INBOX_SUPABASE_URL",
  !serviceKey && "INBOX_SUPABASE_SERVICE_ROLE_KEY",
  invite && !siteUrl && "INBOX_SITE_URL (necessária com --invite)",
  ...team.filter((m) => !m.email).map((m) => `${m.fullName.toUpperCase()}_EMAIL`),
].filter(Boolean);

if (missing.length) {
  console.error(`Faltam variáveis de ambiente: ${missing.join(", ")}`);
  process.exit(1);
}

if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) {
  console.error(
    "INBOX_SUPABASE_URL deve ser a URL https://<ref>.supabase.co do projeto Astarita Inbox.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const listPage = async (page, perPage) => {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  return { users: data?.users ?? [], error };
};

console.log(`${dryRun ? "[simulação] " : ""}Projeto: ${new URL(url).host}`);

for (const member of team) {
  const email = member.email.trim();
  const user = await findUserByEmail(listPage, email);
  const plan = planMember(member, user, { invite });

  if (plan.action === "skip") {
    console.log(
      `${member.fullName}: não existe no projeto Inbox. Nada feito (use --invite para convidar).`,
    );
    continue;
  }

  if (plan.action === "invite") {
    if (dryRun) {
      console.log(`${member.fullName}: seria convidado(a) e receberia perfil.`);
      continue;
    }
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl.replace(/\/+$/, "")}/inbox/definir-senha`,
    });
    if (error) throw new Error(`Convite para ${member.fullName} falhou: ${error.message}`);
    plan.userId = data.user.id;
  }

  if (dryRun) {
    console.log(`${member.fullName}: usuário já existe, receberia perfil ativo (${member.role}).`);
    continue;
  }

  const { error } = await admin
    .from("profiles")
    .upsert(
      { id: plan.userId, full_name: member.fullName, role: member.role, active: true },
      { onConflict: "id" },
    );
  if (error) throw new Error(`Perfil de ${member.fullName} falhou: ${error.message}`);

  console.log(
    `${member.fullName}: ${plan.action === "invite" ? "convite enviado" : "usuário reaproveitado"}, perfil ativo.`,
  );
}

console.log(
  "Lembre de desativar o cadastro público em Authentication > Providers > Email no projeto Inbox.",
);
