import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  verifySignature, checkVerification, parseWebhook, eventKey, buildTextBody, buildTemplateBody,
  mapGraphError, normalizeApiVersion, whatsappMissing, timingSafeEqual,
} from "../../src/lib/inbox/server/whatsapp-core.ts";

// Formatos conforme o conhecimento do autor; NÃO verificados contra a documentação oficial atual da Meta.
const fx = (n) => JSON.parse(readFileSync(`tests/fixtures/whatsapp/${n}.json`, "utf8"));
const sign = (secret, body) => `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

test("assinatura: aceita a correta (calculada pelo crypto do Node, validada pelo Web Crypto)", async () => {
  const body = JSON.stringify(fx("text"));
  assert.equal(await verifySignature(body, sign("segredo-do-app", body), ["segredo-do-app"]), true);
});

test("assinatura: recusa corpo adulterado, segredo errado, formato errado e ausência", async () => {
  const body = JSON.stringify(fx("text"));
  const good = sign("segredo-do-app", body);
  assert.equal(await verifySignature(body + " ", good, ["segredo-do-app"]), false); // 1 byte a mais
  assert.equal(await verifySignature(body, good, ["outro-segredo"]), false);
  assert.equal(await verifySignature(body, good.replace("sha256=", "sha1="), ["segredo-do-app"]), false);
  assert.equal(await verifySignature(body, "sha256=zzzz", ["segredo-do-app"]), false);
  assert.equal(await verifySignature(body, "sha256=" + "0".repeat(64), ["segredo-do-app"]), false);
  assert.equal(await verifySignature(body, null, ["segredo-do-app"]), false);
  assert.equal(await verifySignature(body, undefined, ["segredo-do-app"]), false);
  assert.equal(await verifySignature(body, good, []), false); // sem segredo configurado nunca valida
  assert.equal(await verifySignature(body, good, [""]), false);
});

test("assinatura: usa o corpo BRUTO (re-serializar o JSON mudaria o hash)", async () => {
  const raw = '{"object":"whatsapp_business_account",  "entry":[]}'; // espaços fora do padrão do JSON.stringify
  const header = sign("s", raw);
  assert.equal(await verifySignature(raw, header, ["s"]), true);
  assert.equal(await verifySignature(JSON.stringify(JSON.parse(raw)), header, ["s"]), false);
});

test("assinatura: aceita o segredo antigo durante a rotação", async () => {
  const body = "{}";
  assert.equal(await verifySignature(body, sign("antigo", body), ["novo", "antigo"]), true);
  assert.equal(await verifySignature(body, sign("novo", body), ["novo", "antigo"]), true);
});

test("timingSafeEqual", () => {
  assert.equal(timingSafeEqual("abc", "abc"), true);
  assert.equal(timingSafeEqual("abc", "abd"), false);
  assert.equal(timingSafeEqual("abc", "abcd"), false);
  assert.equal(timingSafeEqual("", ""), true);
});

test("verificação do webhook (GET)", () => {
  const p = (o) => new URLSearchParams(o);
  const ok = checkVerification(p({ "hub.mode": "subscribe", "hub.verify_token": "tok", "hub.challenge": "12345" }), "tok");
  assert.deepEqual(ok, { ok: true, challenge: "12345" });
  assert.equal(checkVerification(p({ "hub.mode": "subscribe", "hub.verify_token": "errado", "hub.challenge": "1" }), "tok").ok, false);
  assert.equal(checkVerification(p({ "hub.mode": "unsubscribe", "hub.verify_token": "tok", "hub.challenge": "1" }), "tok").ok, false);
  assert.equal(checkVerification(p({ "hub.mode": "subscribe", "hub.verify_token": "tok" }), "tok").ok, false); // sem challenge
  assert.equal(checkVerification(p({ "hub.mode": "subscribe", "hub.verify_token": "", "hub.challenge": "1" }), undefined).ok, false); // sem token configurado
});

test("parser: texto, com nome do perfil e data convertida", () => {
  const r = parseWebhook(fx("text"));
  assert.equal(r.messages.length, 1);
  assert.deepEqual({ ...r.messages[0], sentAt: undefined }, {
    waId: "5511999998888", profileName: "Maria Souza", waMessageId: "wamid.TEXT1", type: "text",
    body: "Oi! Vocês fazem social media?", mime: null, mediaId: null, sentAt: undefined, contextWaId: null });
  assert.equal(r.messages[0].sentAt, new Date(1791500000 * 1000).toISOString());
});

test("parser: imagem com legenda, áudio, documento (nome do arquivo vira texto)", () => {
  const img = parseWebhook(fx("image")).messages[0];
  assert.deepEqual([img.type, img.body, img.mime, img.mediaId], ["image", "Nosso feed atual", "image/jpeg", "MEDIA_IMG_1"]);
  const aud = parseWebhook(fx("audio")).messages[0];
  assert.deepEqual([aud.type, aud.body, aud.mime, aud.mediaId], ["audio", null, "audio/ogg; codecs=opus", "MEDIA_AUD_1"]);
  const doc = parseWebhook(fx("document")).messages[0];
  assert.deepEqual([doc.type, doc.body, doc.mime, doc.mediaId], ["document", "briefing.pdf", "application/pdf", "MEDIA_DOC_1"]);
});

test("parser: botão/lista, localização e resposta com contexto", () => {
  assert.equal(parseWebhook(fx("interactive")).messages[0].body, "Quero saber mais");
  const loc = parseWebhook(fx("location")).messages[0];
  assert.equal(loc.type, "text");
  assert.match(loc.body, /^\[Localização\] Escritório \(-23\.55, -46\.63\)$/);
  assert.equal(parseWebhook(fx("reply-context")).messages[0].contextWaId, "wamid.OUT1");
});

test("parser: reação é ignorada (não vira mensagem nem não lida)", () => {
  const r = parseWebhook(fx("reaction"));
  assert.equal(r.messages.length, 0);
  assert.deepEqual(r.ignored, ["messages:reaction"]);
});

test("parser: status entregue, lida e falha com erro da Meta", () => {
  const d = parseWebhook(fx("status-delivered")).statuses[0];
  assert.deepEqual([d.waMessageId, d.status, d.recipientId, d.errorCode], ["wamid.OUT1", "delivered", "5511999998888", null]);
  assert.equal(parseWebhook(fx("status-read")).statuses[0].status, "read");
  const f = parseWebhook(fx("status-failed")).statuses[0];
  assert.equal(f.status, "failed");
  assert.equal(f.errorCode, "131047");
  assert.match(f.errorMessage, /Re-engagement message: Message failed to send/);
});

test("parser: eco do app WhatsApp Business (coexistência)", () => {
  const r = parseWebhook(fx("echo"));
  assert.equal(r.echoes.length, 1);
  assert.deepEqual([r.echoes[0].toWaId, r.echoes[0].waMessageId, r.echoes[0].body], ["5511999998888", "wamid.ECHO1", "Resposta pelo celular"]);
  assert.equal(r.messages.length, 0);
});

test("parser: campo desconhecido e lixo nunca lançam exceção", () => {
  assert.deepEqual(parseWebhook(fx("unknown-field")).ignored, ["field:account_update"]);
  for (const junk of [null, undefined, 42, "texto", [], {}, fx("garbage"), { entry: [null, 1, { changes: [null, { value: 3 }] }] },
    { entry: [{ changes: [{ field: "messages", value: { messages: [null, { id: "x" }, { from: "1" }, { from: "5511999998888", id: "ok", type: "text" }] } }] }] }]) {
    assert.doesNotThrow(() => parseWebhook(junk));
  }
  const partial = parseWebhook({ entry: [{ changes: [{ field: "messages", value: { messages: [{ from: "5511999998888", id: "ok", type: "text" }] } }] }] });
  assert.equal(partial.messages.length, 1); // texto vazio ainda gera mensagem
  assert.equal(partial.messages[0].body, null);
});

test("parser: tipo desconhecido vira 'unsupported' com aviso legível", () => {
  const r = parseWebhook({ entry: [{ changes: [{ field: "messages", value: { messages: [{ from: "5511999998888", id: "wamid.X", timestamp: "1", type: "order" }] } }] }] });
  assert.equal(r.messages[0].type, "unsupported");
  assert.match(r.messages[0].body, /não suportado: order/);
});

test("chaves de deduplicação", () => {
  assert.equal(eventKey.message("wamid.A"), "msg:wamid.A");
  assert.equal(eventKey.status("wamid.A", "read"), "st:wamid.A:read");
  assert.equal(eventKey.echo("wamid.A"), "echo:wamid.A");
});

test("corpos de envio", () => {
  assert.deepEqual(buildTextBody("5511999998888", "Olá", null), {
    messaging_product: "whatsapp", recipient_type: "individual", to: "5511999998888", type: "text", text: { preview_url: false, body: "Olá" } });
  assert.deepEqual(buildTextBody("5511999998888", "Olá", "wamid.Q").context, { message_id: "wamid.Q" });
  const t = buildTemplateBody("5511999998888", "retorno", "pt_BR", ["Maria", "segunda"]);
  assert.equal(t.template.name, "retorno");
  assert.deepEqual(t.template.language, { code: "pt_BR" });
  assert.deepEqual(t.template.components[0].parameters, [{ type: "text", text: "Maria" }, { type: "text", text: "segunda" }]);
  assert.equal("components" in buildTemplateBody("5511999998888", "x", "pt_BR", []).template, false);
});

test("erros da Meta viram mensagens claras", () => {
  const e = (code, extra = {}) => mapGraphError(400, { error: { code, message: "msg da meta", ...extra } });
  assert.equal(e(131047).kind, "window");
  assert.match(e(131047).message, /24 horas/);
  assert.equal(e(190).kind, "auth");
  assert.equal(mapGraphError(401, {}).kind, "auth");
  assert.equal(e(131030).kind, "recipient");
  assert.equal(e(131026).kind, "recipient");
  assert.equal(e(130429).kind, "rate");
  assert.equal(mapGraphError(429, {}).kind, "rate");
  assert.equal(e(132001).kind, "template");
  assert.equal(e(132000).kind, "template");
  assert.equal(e(100).kind, "config");
  assert.equal(e(99999).kind, "other");
  assert.match(e(99999).message, /código 99999/);
  assert.ok(e(99999, { error_data: { details: "x".repeat(500) } }).message.length < 260); // não despeja texto enorme
  assert.doesNotThrow(() => mapGraphError(500, null));
  assert.equal(mapGraphError(500, "texto").code, "500");
});

test("configuração: versão da API e variáveis que faltam (só nomes)", () => {
  assert.equal(normalizeApiVersion("v21.0"), "v21.0");
  assert.equal(normalizeApiVersion(" v9.0 "), "v9.0");
  assert.equal(normalizeApiVersion("21"), null);
  assert.equal(normalizeApiVersion("latest"), null);
  assert.equal(normalizeApiVersion(undefined), null);
  const all = { WHATSAPP_ACCESS_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "1", WHATSAPP_VERIFY_TOKEN: "v", META_APP_SECRET: "s", WHATSAPP_API_VERSION: "v21.0" };
  assert.deepEqual(whatsappMissing(all), []);
  assert.deepEqual(whatsappMissing({}), ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN", "META_APP_SECRET", "WHATSAPP_API_VERSION"]);
  assert.match(whatsappMissing({ ...all, WHATSAPP_API_VERSION: "xx" })[0], /formato inválido/);
  assert.deepEqual(whatsappMissing({ ...all, META_APP_SECRET: "  " }), ["META_APP_SECRET"]);
  assert.ok(!JSON.stringify(whatsappMissing({ ...all, META_APP_SECRET: "" })).includes("t")); // não vaza valores
  assert.deepEqual(whatsappMissing({ WHATSAPP_VERIFY_TOKEN: "v", META_APP_SECRET: "s" }, ["WHATSAPP_VERIFY_TOKEN", "META_APP_SECRET"]), []);
});
