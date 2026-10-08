import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  phoneVariants,
  formatPhone,
  normalizeInstagram,
} from "../../src/lib/inbox/phone.ts";
import { reopenedStatus, statusAfterAssign } from "../../src/lib/inbox/status.ts";

test("normalizePhone aceita formatos brasileiros comuns", () => {
  assert.equal(normalizePhone("(11) 99999-8888"), "5511999998888");
  assert.equal(normalizePhone("+55 11 99999-8888"), "5511999998888");
  assert.equal(normalizePhone("011 3333-4444"), "551133334444");
  assert.equal(normalizePhone("5511999998888"), "5511999998888");
});

test("normalizePhone mantém números internacionais e rejeita lixo", () => {
  assert.equal(normalizePhone("+1 415 555 2671"), "14155552671");
  assert.equal(normalizePhone("123"), null);
  assert.equal(normalizePhone("abc"), null);
  assert.equal(normalizePhone("1234567890123456"), null);
  assert.equal(normalizePhone("5511999"), null); // começa com 55 mas tamanho impossível
});

test("phoneVariants cobre o nono dígito nos dois sentidos", () => {
  assert.deepEqual(phoneVariants("5511999998888"), ["5511999998888", "551199998888"]);
  assert.deepEqual(phoneVariants("551199998888"), ["551199998888", "5511999998888"]);
  assert.deepEqual(phoneVariants("551133334444"), ["551133334444"]); // fixo não ganha 9
  assert.deepEqual(phoneVariants("14155552671"), ["14155552671"]);
});

test("formatPhone", () => {
  assert.equal(formatPhone("5511999998888"), "+55 (11) 99999-8888");
  assert.equal(formatPhone("551133334444"), "+55 (11) 3333-4444");
  assert.equal(formatPhone("14155552671"), "+14155552671");
  assert.equal(formatPhone(null), "");
});

test("normalizeInstagram", () => {
  assert.equal(normalizeInstagram("@astarita"), "@astarita");
  assert.equal(normalizeInstagram("astarita"), "@astarita");
  assert.equal(normalizeInstagram("https://www.instagram.com/astarita/?hl=pt"), "@astarita");
  assert.equal(normalizeInstagram("   "), null);
});

test("regras de status", () => {
  assert.equal(reopenedStatus(null), "waiting");
  assert.equal(reopenedStatus("u1"), "in_progress");
  assert.equal(statusAfterAssign("waiting", "u1"), "in_progress");
  assert.equal(statusAfterAssign("waiting", null), "waiting");
  assert.equal(statusAfterAssign("resolved", "u1"), "resolved");
  assert.equal(statusAfterAssign("in_progress", null), "in_progress");
});
