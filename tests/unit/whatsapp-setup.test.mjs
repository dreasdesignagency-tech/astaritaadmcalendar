import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSteps,
  buildEnvRows,
  webhookUrl,
  isPublicHttps,
  serverNotReadyStatus,
} from "../../src/lib/inbox/whatsapp-setup.ts";
import { describeEnv } from "../../src/lib/inbox/server/whatsapp-core.ts";

const base = (wa = {}, extra = {}) => ({
  whatsapp: {
    configured: true,
    missing: [],
    reachable: true,
    phone: "+55 11 90000-0000",
    verifiedName: "Astarita",
    error: null,
    ...wa,
  },
  ai: { configured: false, provider: null, model: null, missing: [] },
  webhook: { lastValidAt: "2026-10-09T10:00:00Z", invalidLast24h: 0 },
  envRows: [],
  ...extra,
});
const st = (s, id) => s.find((x) => x.id === id).state;

test("tudo certo: os 4 passos ficam concluídos", () => {
  const s = buildSteps(base());
  assert.deepEqual(
    s.map((x) => x.state),
    ["done", "done", "done", "done"],
  );
});

test("servidor sem acesso ao banco: pede só essa variável e não chuta o resto", () => {
  const s = buildSteps(serverNotReadyStatus(["INBOX_SUPABASE_SERVICE_ROLE_KEY"]));
  assert.equal(st(s, "server"), "todo");
  assert.match(s[0].detail, /INBOX_SUPABASE_SERVICE_ROLE_KEY/);
  for (const id of ["env", "meta", "webhook"]) assert.equal(st(s, id), "unknown");
  assert.deepEqual(
    buildEnvRows(serverNotReadyStatus(["INBOX_SUPABASE_SERVICE_ROLE_KEY"])).map((r) => [
      r.name,
      r.present,
    ]),
    [["INBOX_SUPABASE_SERVICE_ROLE_KEY", false]],
  );
});

test("variáveis do WhatsApp faltando: lista os nomes (inclusive formato inválido da versão)", () => {
  const status = base({
    configured: false,
    reachable: null,
    missing: [
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_API_VERSION (formato inválido; use algo como v21.0)",
    ],
  });
  const s = buildSteps(status);
  assert.equal(st(s, "env"), "todo");
  assert.match(s[1].detail, /WHATSAPP_ACCESS_TOKEN/);
  assert.equal(st(s, "meta"), "unknown");
  const rows = describeEnv(
    {
      WHATSAPP_PHONE_NUMBER_ID: "1",
      WHATSAPP_VERIFY_TOKEN: "v",
      META_APP_SECRET: "s",
      WHATSAPP_API_VERSION: "21",
    },
    true,
  );
  const by = (n) => rows.find((r) => r.name === n).present;
  assert.equal(by("WHATSAPP_ACCESS_TOKEN"), false);
  assert.equal(by("WHATSAPP_API_VERSION"), false); // formato inválido
  assert.equal(by("WHATSAPP_PHONE_NUMBER_ID"), true);
  assert.equal(by("INBOX_SUPABASE_SERVICE_ROLE_KEY"), true);
  assert.equal(
    describeEnv({}, false).find((r) => r.name === "INBOX_SUPABASE_SERVICE_ROLE_KEY").present,
    false,
  );
});

test("Meta recusou as credenciais: erro com a mensagem; sem resposta: desconhecido", () => {
  assert.equal(
    st(buildSteps(base({ reachable: false, error: "Token recusado." })), "meta"),
    "error",
  );
  assert.equal(st(buildSteps(base({ reachable: null, error: "Sem rede." })), "meta"), "unknown");
});

test("webhook: sem eventos = pendente; recusados por assinatura = erro com dica do app secret", () => {
  assert.equal(
    st(buildSteps(base({}, { webhook: { lastValidAt: null, invalidLast24h: 0 } })), "webhook"),
    "todo",
  );
  const bad = buildSteps(base({}, { webhook: { lastValidAt: null, invalidLast24h: 3 } }));
  assert.equal(st(bad, "webhook"), "error");
  assert.match(bad[3].detail, /App Secret/);
  assert.equal(st(buildSteps(base({}, { webhook: null })), "webhook"), "todo");
});

test("endereço do webhook e regra de HTTPS público", () => {
  assert.equal(
    webhookUrl("https://astarita-inbox.vercel.app/"),
    "https://astarita-inbox.vercel.app/api/whatsapp/webhook",
  );
  assert.equal(isPublicHttps("https://astarita-inbox.vercel.app"), true);
  assert.equal(isPublicHttps("http://astarita-inbox.vercel.app"), false);
  assert.equal(isPublicHttps("http://127.0.0.1:5199"), false);
  assert.equal(isPublicHttps("https://localhost:3000"), false);
  assert.equal(isPublicHttps("lixo"), false);
});

test("nenhum texto dos passos contém algo parecido com valor secreto", () => {
  const all = JSON.stringify([
    buildSteps(base()),
    describeEnv(
      { WHATSAPP_ACCESS_TOKEN: "EAAxxxxSEGREDOxxxx1234", META_APP_SECRET: "abcdefsecretvalue" },
      true,
    ),
  ]);
  assert.ok(
    !/SEGREDO|secretvalue|EAA[A-Za-z0-9]{10,}|sb_secret_|eyJ/.test(all),
    "valores nunca entram na descrição",
  );
});
