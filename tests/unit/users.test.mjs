import test from "node:test";
import assert from "node:assert/strict";
import { findUserByEmail, planMember } from "../../scripts/lib/users.mjs";

/** Base falsa com N usuários, paginada como o Supabase Auth. */
function fakeAuth(total) {
  const all = Array.from({ length: total }, (_, i) => ({ id: `u${i}`, email: `pessoa${i}@exemplo.com` }));
  let calls = 0;
  return {
    all,
    calls: () => calls,
    listPage: async (page, perPage) => {
      calls += 1;
      return { users: all.slice((page - 1) * perPage, page * perPage), error: null };
    },
  };
}

test("acha usuário na primeira página", async () => {
  const a = fakeAuth(50);
  assert.equal((await findUserByEmail(a.listPage, "pessoa3@exemplo.com")).id, "u3");
  assert.equal(a.calls(), 1);
});

test("acha usuário DEPOIS dos primeiros 200 (o bug antigo convidava de novo)", async () => {
  const a = fakeAuth(450);
  const hit = await findUserByEmail(a.listPage, "pessoa420@exemplo.com");
  assert.equal(hit.id, "u420");
  assert.equal(a.calls(), 3);
});

test("ignora maiúsculas e espaços", async () => {
  const a = fakeAuth(10);
  assert.equal((await findUserByEmail(a.listPage, "  PESSOA7@Exemplo.COM ")).id, "u7");
});

test("não existe: percorre tudo e devolve null", async () => {
  const a = fakeAuth(401);
  assert.equal(await findUserByEmail(a.listPage, "ninguem@exemplo.com"), null);
  assert.equal(a.calls(), 3); // 200 + 200 + 1
});

test("base vazia e base de exatamente uma página cheia terminam", async () => {
  assert.equal(await findUserByEmail(fakeAuth(0).listPage, "x@y.com"), null);
  assert.equal(await findUserByEmail(fakeAuth(200).listPage, "x@y.com"), null);
});

test("erro do Auth é propagado, não vira 'não existe'", async () => {
  const boom = async () => ({ users: [], error: new Error("falha") });
  await assert.rejects(() => findUserByEmail(boom, "x@y.com"), /falha/);
});

test("plano: reaproveita; sem convite por padrão; convite só com a opção", () => {
  assert.deepEqual(planMember({}, { id: "u1" }, { invite: false }), { action: "reuse", userId: "u1" });
  assert.deepEqual(planMember({}, { id: "u1" }, { invite: true }), { action: "reuse", userId: "u1" });
  assert.deepEqual(planMember({}, null, { invite: false }), { action: "skip" });
  assert.deepEqual(planMember({}, null, { invite: true }), { action: "invite" });
});
