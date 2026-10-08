#!/usr/bin/env node
/**
 * Verificação REAL do projeto Supabase do Astarita Inbox, vista de fora, como o app vê.
 *
 * Só usa a chave PUBLICÁVEL e duas contas de teste. Nunca usa service role. Não imprime chaves nem tokens.
 *
 *   Etapa A (padrão, SOMENTE LEITURA): configurações de Auth públicas, sondagem anônima das tabelas e do RPC,
 *                                      conexão do Realtime. Não cria nada.
 *   Etapa B (só com --write): login das duas contas, contato, conversa, atribuir, resolver, reabrir, conflito,
 *                             Realtime entre duas sessões. TODO dado criado leva o prefixo [TESTE-CLAUDE] e é apagado ao final.
 *   --cleanup-only: só apaga restos de uma execução anterior que tenha sido interrompida.
 *   --skip-realtime: pula as verificações de Realtime (para ambiente local sem servidor Realtime).
 *
 * Variáveis (ambiente, nunca no repositório):
 *   VITE_INBOX_SUPABASE_URL, VITE_INBOX_SUPABASE_PUBLISHABLE_KEY
 *   Etapa B: INBOX_TEST_A_EMAIL, INBOX_TEST_A_PASSWORD, INBOX_TEST_B_EMAIL, INBOX_TEST_B_PASSWORD
 *            (contas de teste com perfil ativo em public.profiles, criadas por você)
 */
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const WRITE = args.has("--write");
const CLEANUP_ONLY = args.has("--cleanup-only");
const SKIP_RT = args.has("--skip-realtime");

const url = (process.env.VITE_INBOX_SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.VITE_INBOX_SUPABASE_PUBLISHABLE_KEY ?? "";
const acc = {
  A: { email: process.env.INBOX_TEST_A_EMAIL, password: process.env.INBOX_TEST_A_PASSWORD },
  B: { email: process.env.INBOX_TEST_B_EMAIL, password: process.env.INBOX_TEST_B_PASSWORD },
};

const need = [!url && "VITE_INBOX_SUPABASE_URL", !key && "VITE_INBOX_SUPABASE_PUBLISHABLE_KEY"];
if (WRITE || CLEANUP_ONLY)
  for (const k of ["A", "B"])
    for (const f of ["email", "password"])
      if (!acc[k][f]) need.push(`INBOX_TEST_${k}_${f.toUpperCase()}`);
if (need.filter(Boolean).length) {
  console.error(`Faltam variáveis de ambiente: ${need.filter(Boolean).join(", ")}`);
  process.exit(1);
}
if (
  key.startsWith("sb_secret_") ||
  /"role":\s*"service_role"/.test(Buffer.from(key.split(".")[1] ?? "", "base64url").toString())
) {
  console.error("A chave informada é secreta (service role). Use somente a chave publicável.");
  process.exit(1);
}

const PREFIX = "[TESTE-CLAUDE]";
const PHONE = "5599988880001"; // número fictício reservado para o teste
const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !extra ? "" : `  -> ${extra}`}`);
};
const info = (name, value) => console.log(`INFO  ${name}: ${value}`);
const mk = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TABLES = [
  "profiles",
  "contacts",
  "conversations",
  "messages",
  "tags",
  "contact_tags",
  "pipeline_stages",
  "opportunities",
  "quick_replies",
  "reminders",
  "knowledge_base",
  "ai_suggestions",
  "webhook_events",
];

async function waitFor(cond, ms = 12000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await sleep(200);
  }
  return cond();
}

async function subscribe(channel) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("tempo esgotado ao conectar")), 15000);
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
        clearTimeout(timer);
        reject(new Error(`${status}${err ? `: ${err.message}` : ""}`));
      }
    });
  });
}

/** Apaga tudo que leva o prefixo de teste, na sessão informada (RLS permite a membros). */
async function cleanup(db) {
  const c = await db.from("contacts").select("id").or(`name.like.${PREFIX}%,phone.eq.${PHONE}`);
  const ids = (c.data ?? []).map((r) => r.id);
  if (ids.length) {
    await db.from("conversations").delete().in("contact_id", ids); // apaga mensagens em cascata
    await db.from("contact_tags").delete().in("contact_id", ids);
    await db.from("contacts").delete().in("id", ids);
  }
  await db.from("tags").delete().like("name", `${PREFIX}%`);
  const left = await db
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .or(`name.like.${PREFIX}%,phone.eq.${PHONE}`);
  const leftTags = await db
    .from("tags")
    .select("id", { count: "exact", head: true })
    .like("name", `${PREFIX}%`);
  return { contacts: left.count ?? 0, tags: leftTags.count ?? 0 };
}

// ---------------------------------------------------------------- Etapa A
async function stageA() {
  console.log("\n== Etapa A: somente leitura ==");
  info("projeto", new URL(url).host);

  const st = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
  check("GET /auth/v1/settings responde", st.ok, `status ${st.status}`);
  if (st.ok) {
    const s = await st.json();
    check(
      "cadastro público DESLIGADO (disable_signup)",
      s.disable_signup === true,
      `disable_signup=${s.disable_signup}`,
    );
    const providers = Object.entries(s.external ?? {})
      .filter(([, v]) => v === true)
      .map(([k]) => k);
    info("provedores de login ativos", providers.join(", ") || "nenhum");
    check(
      "só e-mail/senha está ativo como provedor",
      providers.length === 1 && providers[0] === "email",
      providers.join(","),
    );
    info("confirmação automática de e-mail (mailer_autoconfirm)", String(s.mailer_autoconfirm));
  }

  const anon = mk();
  // Só vale como "negado" a recusa por PERMISSÃO (42501). Recusa por outro motivo (chave inválida, rede) é inconclusiva e reprova.
  const byPermission = (r) => r.error?.code === "42501";
  let denied = 0;
  const problems = [];
  for (const t of TABLES) {
    const r = await anon.from(t).select("*").limit(1);
    if (byPermission(r)) denied += 1;
    else if (!r.error) problems.push(`${t}: LEU ${(r.data ?? []).length} linha(s)`);
    else
      problems.push(
        `${t}: recusa inconclusiva (${r.error.code ?? r.status}: ${String(r.error.message).slice(0, 50)})`,
      );
  }
  check(
    `anônimo é NEGADO POR PERMISSÃO nas ${TABLES.length} tabelas`,
    denied === TABLES.length,
    problems.join(" | "),
  );

  const callAnon = async (name) => {
    const r = await anon.rpc(name);
    const ok = !!r.error && (r.error.code === "42501" || r.error.code === "PGRST202");
    return {
      ok,
      why: `${r.error?.code ?? "EXECUTOU"}: ${String(r.error?.message ?? "").slice(0, 70)}`,
    };
  };
  const m = await callAnon("is_inbox_member");
  check("anônimo NÃO executa is_inbox_member() (recusa por permissão)", m.ok, m.why);
  const f = await callAnon("rls_auto_enable");
  check(
    "anônimo NÃO executa rls_auto_enable() (reprova antes do hardening, de propósito)",
    f.ok,
    f.why,
  );

  if (!SKIP_RT) {
    const ch = anon
      .channel(`check-anon-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, () => {});
    try {
      await subscribe(ch);
      check("Realtime aceita conexão (anônima, sem acesso a dados)", true);
    } catch (e) {
      check("Realtime aceita conexão (anônima, sem acesso a dados)", false, e.message);
    }
    await anon.removeChannel(ch);
  }
}

// ---------------------------------------------------------------- Etapa B
async function stageB() {
  console.log("\n== Etapa B: com escrita (dados [TESTE-CLAUDE], apagados ao final) ==");
  const a = mk(),
    b = mk();
  const bad = await mk().auth.signInWithPassword({
    email: acc.A.email,
    password: `${acc.A.password}-errada`,
  });
  check(
    "senha errada é recusada",
    !!bad.error && /invalid login credentials/i.test(bad.error.message),
    bad.error?.message,
  );

  const la = await a.auth.signInWithPassword({ email: acc.A.email, password: acc.A.password });
  const lb = await b.auth.signInWithPassword({ email: acc.B.email, password: acc.B.password });
  check("login da conta A", !la.error, la.error?.message);
  check("login da conta B", !lb.error, lb.error?.message);
  if (la.error || lb.error) return;
  const uidA = la.data.user.id,
    uidB = lb.data.user.id;
  check("A e B são usuários diferentes", uidA !== uidB);

  try {
    const mem = await a.rpc("is_inbox_member");
    check(
      "conta A é membro ativo (is_inbox_member)",
      mem.data === true,
      `data=${mem.data} ${mem.error?.message ?? ""}`,
    );
    const prof = await a
      .from("profiles")
      .select("id, full_name, role, active")
      .eq("id", uidA)
      .maybeSingle();
    check(
      "conta A lê o próprio perfil",
      prof.data?.id === uidA && prof.data?.active === true,
      prof.error?.message,
    );
    const stages = await a.from("pipeline_stages").select("id");
    check(
      "conta A vê as 7 etapas do funil",
      (stages.data ?? []).length === 7,
      `${(stages.data ?? []).length}`,
    );

    // Limpa restos antes de começar
    await cleanup(a);

    // Realtime: B escuta antes de A mexer
    const events = [];
    let chB;
    if (!SKIP_RT) {
      chB = b
        .channel(`check-b-${Date.now()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, (p) =>
          events.push(`contacts:${p.eventType}`),
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, (p) =>
          events.push(`conversations:${p.eventType}:${p.new?.status ?? ""}`),
        );
      try {
        await subscribe(chB);
        check("conta B conectou ao Realtime autenticada", true);
      } catch (e) {
        check("conta B conectou ao Realtime autenticada", false, e.message);
      }
    }

    // Contato e duplicidade
    const name = `${PREFIX} Contato ${Date.now()}`;
    const ins = await a
      .from("contacts")
      .insert({ name, phone: PHONE, category: "lead" })
      .select("id")
      .single();
    check("A cria contato", !!ins.data?.id, ins.error?.message);
    if (!ins.data?.id) return;
    const cid = ins.data.id;
    const dup = await b.from("contacts").insert({ name: `${PREFIX} duplicado`, phone: PHONE });
    check(
      "B não consegue duplicar o telefone",
      dup.error?.code === "23505",
      `${dup.error?.code ?? "aceitou!"}`,
    );
    const seenB = await b.from("contacts").select("id").eq("id", cid).maybeSingle();
    check("B enxerga o contato criado por A", seenB.data?.id === cid, seenB.error?.message);

    // Conversa
    const up = await a
      .from("conversations")
      .upsert(
        { contact_id: cid, status: "waiting" },
        { onConflict: "contact_id", ignoreDuplicates: true },
      );
    check("A abre a conversa", !up.error, up.error?.message);
    const conv = await a
      .from("conversations")
      .select("id, status, updated_at, assigned_to")
      .eq("contact_id", cid)
      .single();
    const convId = conv.data?.id;
    check("conversa existe e está 'waiting'", conv.data?.status === "waiting", conv.error?.message);

    // Atribuir, resolver, reabrir com guarda de updated_at
    const asg = await a
      .from("conversations")
      .update({ assigned_to: uidB, status: "in_progress" })
      .eq("id", convId)
      .eq("updated_at", conv.data.updated_at)
      .select("id, updated_at");
    check(
      "A atribui a conversa para B (com guarda de updated_at)",
      (asg.data ?? []).length === 1,
      asg.error?.message,
    );
    const stale = await a
      .from("conversations")
      .update({ status: "resolved" })
      .eq("id", convId)
      .eq("updated_at", conv.data.updated_at)
      .select("id");
    check(
      "alteração com updated_at antigo NÃO grava (conflito detectado)",
      !stale.error && (stale.data ?? []).length === 0,
      `linhas=${(stale.data ?? []).length}`,
    );
    const res = await b
      .from("conversations")
      .update({ status: "resolved" })
      .eq("id", convId)
      .select("status");
    check("B resolve a conversa", res.data?.[0]?.status === "resolved", res.error?.message);
    const reo = await b
      .from("conversations")
      .update({ status: "in_progress" })
      .eq("id", convId)
      .select("status");
    check("B reabre a conversa", reo.data?.[0]?.status === "in_progress", reo.error?.message);

    // Segurança vista por um membro
    const roleTry = await a.from("profiles").update({ role: "ceo" }).eq("id", uidA);
    check("membro NÃO consegue mudar o próprio papel", !!roleTry.error, "aceitou!");
    const actTry = await a.from("profiles").update({ active: false }).eq("id", uidA);
    check("membro NÃO consegue se desativar/reativar", !!actTry.error, "aceitou!");
    const fakeIn = await a
      .from("messages")
      .insert({ conversation_id: convId, direction: "in", body: "forjada", status: "received" });
    check("membro NÃO consegue forjar mensagem recebida", !!fakeIn.error, "aceitou!");
    const asOther = await a.from("messages").insert({
      conversation_id: convId,
      direction: "out",
      body: "x",
      status: "pending",
      sent_by: uidB,
    });
    check(
      "membro NÃO consegue enfileirar envio em nome de outra pessoa",
      !!asOther.error,
      "aceitou!",
    );
    const wh = await a.from("webhook_events").insert({ signature_valid: true, payload: {} });
    check("membro NÃO escreve em webhook_events", !!wh.error, "aceitou!");

    // Realtime recebido por B
    if (!SKIP_RT) {
      const gotContact = await waitFor(() => events.some((e) => e.startsWith("contacts:INSERT")));
      const gotConv = await waitFor(() =>
        events.some((e) => e.startsWith("conversations:") && e.endsWith("resolved")),
      );
      check("REALTIME: B recebeu o evento de contato criado por A", gotContact, events.join(" | "));
      check("REALTIME: B recebeu a conversa resolvida", gotConv, events.join(" | "));
      await b.removeChannel(chB);
    }
  } finally {
    const left = await cleanup(a);
    check(
      "limpeza: nenhum contato ou etiqueta de teste restou",
      left.contacts === 0 && left.tags === 0,
      JSON.stringify(left),
    );
    await a.auth.signOut();
    await b.auth.signOut();
  }
}

// ---------------------------------------------------------------- execução
try {
  if (CLEANUP_ONLY) {
    const a = mk();
    const l = await a.auth.signInWithPassword({ email: acc.A.email, password: acc.A.password });
    check("login para limpeza", !l.error, l.error?.message);
    if (!l.error) {
      const left = await cleanup(a);
      check("limpeza concluída", left.contacts === 0 && left.tags === 0, JSON.stringify(left));
      await a.auth.signOut();
    }
  } else {
    await stageA();
    if (WRITE) await stageB();
    else
      console.log(
        "\n(Etapa B não executada: use --write, depois de aprovar e criar as contas de teste.)",
      );
  }
} catch (e) {
  check("execução sem erro inesperado", false, String(e.message ?? e));
}
const fails = results.filter((r) => !r).length;
console.log(`\n${results.length - fails}/${results.length} passaram`);
process.exit(fails ? 1 : 0);
