import test from "node:test";
import assert from "node:assert/strict";
import { readInboxConfig } from "../../src/lib/inbox/config.ts";

const CAL = "https://calendario123.supabase.co";
const INBOX = "https://yappbzpayqejqpkfebho.supabase.co";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (role) => `${b64({ alg: "HS256" })}.${b64({ role })}.sig`;

test("sem nenhuma variável: informa quais faltam, pelo nome", () => {
  const r = readInboxConfig({ calendarUrl: CAL });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "missing");
  assert.deepEqual(r.missing, ["VITE_INBOX_SUPABASE_URL", "VITE_INBOX_SUPABASE_PUBLISHABLE_KEY"]);
});

test("só uma variável faltando", () => {
  assert.deepEqual(readInboxConfig({ inboxUrl: INBOX }).missing, ["VITE_INBOX_SUPABASE_PUBLISHABLE_KEY"]);
  assert.deepEqual(readInboxConfig({ inboxKey: "k" }).missing, ["VITE_INBOX_SUPABASE_URL"]);
  assert.deepEqual(readInboxConfig({ inboxUrl: "  ", inboxKey: "  " }).missing.length, 2);
});

test("configuração válida", () => {
  const r = readInboxConfig({ inboxUrl: `${INBOX}/`, inboxKey: jwt("anon"), calendarUrl: CAL });
  assert.equal(r.ok, true);
  assert.equal(r.url, INBOX); // barra final removida
});

test("chave publicável nova (sb_publishable_) é aceita", () => {
  assert.equal(readInboxConfig({ inboxUrl: INBOX, inboxKey: "sb_publishable_abc", calendarUrl: CAL }).ok, true);
});

test("chave secreta é recusada, nos dois formatos", () => {
  for (const key of ["sb_secret_xyz", jwt("service_role")]) {
    const r = readInboxConfig({ inboxUrl: INBOX, inboxKey: key, calendarUrl: CAL });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "invalid");
    assert.match(r.message, /chave secreta/);
  }
});

test("apontar para o projeto do calendário é recusado", () => {
  const r = readInboxConfig({ inboxUrl: CAL, inboxKey: "k", calendarUrl: CAL });
  assert.equal(r.ok, false);
  assert.match(r.message, /mesmo projeto do calendário/);
});

test("URL inválida ou sem https é recusada; localhost é permitido (desenvolvimento)", () => {
  assert.equal(readInboxConfig({ inboxUrl: "nao-e-url", inboxKey: "k" }).ok, false);
  assert.equal(readInboxConfig({ inboxUrl: "http://exemplo.com", inboxKey: "k" }).ok, false);
  assert.equal(readInboxConfig({ inboxUrl: "http://127.0.0.1:3002", inboxKey: "k", calendarUrl: CAL }).ok, true);
});
