import test from "node:test";
import assert from "node:assert/strict";
import { buildSteps, webhookUrl, isPublicHttps, serverNotReadyStatus } from "../../src/lib/inbox/whatsapp-setup.ts";

const fieldsOk = { phoneNumberId: true, version: true, token: true, appSecret: true, verifyToken: true };
const base = (wa = {}, extra = {}) => ({
  whatsapp: { configured: true, missing: [], fields: fieldsOk, reachable: true, phone: "+55 11 90000-0000", verifiedName: "Empresa", error: null, ...wa },
  ai: { configured: false, provider: null, model: null, missing: [] },
  webhook: { lastValidAt: "2026-10-09T10:00:00Z", invalidLast24h: 0 },
  ...extra,
});
const st = (s, id) => s.find((x) => x.id === id).state;

test("tudo certo: os 4 passos ficam concluídos", () => {
  assert.deepEqual(buildSteps(base()).map((x) => x.state), ["done", "done", "done", "done"]);
});

test("servidor sem a chave que protege as credenciais: pede só isso e não chuta o resto", () => {
  const s = buildSteps(serverNotReadyStatus(["INBOX_SECRETS_KEY"]));
  assert.equal(st(s, "server"), "todo");
  assert.match(s[0].detail, /INBOX_SECRETS_KEY/);
  for (const id of ["data", "meta", "webhook"]) assert.equal(st(s, id), "unknown");
});

test("campos faltando: lista os rótulos e deixa Meta/webhook desconhecidos", () => {
  const status = base({ configured: false, reachable: null, missing: ["Token de acesso", "App Secret"] });
  const s = buildSteps(status);
  assert.equal(st(s, "data"), "todo");
  assert.match(s[1].detail, /Token de acesso, App Secret/);
  assert.equal(st(s, "meta"), "unknown");
  assert.equal(st(s, "webhook"), "unknown");
});

test("Meta recusou as credenciais: erro com a mensagem; sem resposta: desconhecido", () => {
  assert.equal(st(buildSteps(base({ reachable: false, error: "Token recusado." })), "meta"), "error");
  assert.equal(st(buildSteps(base({ reachable: null, error: "Sem rede." })), "meta"), "unknown");
});

test("webhook: sem eventos = pendente; recusados por assinatura = erro com dica do App Secret", () => {
  assert.equal(st(buildSteps(base({}, { webhook: { lastValidAt: null, invalidLast24h: 0 } })), "webhook"), "todo");
  const bad = buildSteps(base({}, { webhook: { lastValidAt: null, invalidLast24h: 3 } }));
  assert.equal(st(bad, "webhook"), "error");
  assert.match(bad[3].detail, /App Secret/);
  assert.equal(st(buildSteps(base({}, { webhook: null })), "webhook"), "todo");
});

test("endereço do webhook é por empresa (chave no final) e a Meta exige HTTPS público", () => {
  const key = "a".repeat(32);
  assert.equal(webhookUrl("https://x.vercel.app/", key), `https://x.vercel.app/api/whatsapp/webhook/${key}`);
  assert.equal(isPublicHttps("https://x.vercel.app"), true);
  assert.equal(isPublicHttps("http://x.vercel.app"), false);
  assert.equal(isPublicHttps("http://127.0.0.1:5199"), false);
  assert.equal(isPublicHttps("https://localhost:3000"), false);
  assert.equal(isPublicHttps("lixo"), false);
});

test("nenhum texto dos passos contém algo parecido com valor secreto", () => {
  const all = JSON.stringify(buildSteps(base()));
  assert.ok(!/EAA[A-Za-z0-9]{10,}|sb_secret_|eyJ/.test(all));
});
