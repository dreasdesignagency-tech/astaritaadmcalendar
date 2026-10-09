import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { checkSecretsKey, encryptSecret, decryptSecret, randomHex, tempPassword } from "../../src/lib/inbox/server/secrets.ts";

const KEY = randomBytes(32).toString("base64");

test("cifra e decifra; cada cifra é diferente (iv aleatório) e não contém o texto", async () => {
  const a = await encryptSecret("token-super-secreto", KEY);
  const b = await encryptSecret("token-super-secreto", KEY);
  assert.notEqual(a, b);
  assert.match(a, /^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
  assert.ok(!a.includes("token-super-secreto"));
  assert.equal(await decryptSecret(a, KEY), "token-super-secreto");
  assert.equal(await decryptSecret(await encryptSecret("ação ç ã é 日本", KEY), KEY), "ação ç ã é 日本");
});

test("chave errada, texto adulterado ou formato inválido devolvem null (nunca lançam nem vazam)", async () => {
  const c = await encryptSecret("segredo", KEY);
  assert.equal(await decryptSecret(c, randomBytes(32).toString("base64")), null);
  const parts = c.split(".");
  const flipped = parts[2].startsWith("A") ? "B" + parts[2].slice(1) : "A" + parts[2].slice(1);
  assert.equal(await decryptSecret(`${parts[0]}.${parts[1]}.${flipped}`, KEY), null);
  for (const bad of ["", "v1", "v2.a.b", "lixo", "v1..", "v1.%%%.%%%"]) assert.equal(await decryptSecret(bad, KEY), null, bad);
  assert.equal(await decryptSecret(c, "chave-invalida"), null);
});

test("chave precisa ter 32 bytes em base64", async () => {
  assert.equal(checkSecretsKey(KEY).ok, true);
  assert.equal(checkSecretsKey(undefined).ok, false);
  assert.equal(checkSecretsKey("curta").ok, false);
  assert.equal(checkSecretsKey(randomBytes(16).toString("base64")).ok, false);
  await assert.rejects(() => encryptSecret("x", "curta"), /INBOX_SECRETS_KEY/);
});

test("aleatórios: hex do tamanho certo, sem repetição; senha temporária legível e forte", () => {
  assert.match(randomHex(16), /^[a-f0-9]{32}$/);
  assert.notEqual(randomHex(16), randomHex(16));
  const p = tempPassword();
  assert.ok(p.length >= 16 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[!]/.test(p));
  assert.ok(!/[0OlI1]/.test(p.slice(0, -2)), "sem caracteres que se confundem");
  assert.equal(new Set(Array.from({ length: 50 }, () => tempPassword())).size, 50);
});
