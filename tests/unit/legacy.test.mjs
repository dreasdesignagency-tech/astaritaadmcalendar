import test from "node:test";
import assert from "node:assert/strict";
import {
  isLegacySchemaError,
  legacyPerson,
  legacyMyProfile,
  LEGACY_ORG_ID,
} from "../../src/lib/inbox/legacy.ts";

test("legado: reconhece erros de coluna ou relação inexistente", () => {
  assert.equal(isLegacySchemaError({ code: "42703", message: "x" }), true);
  assert.equal(isLegacySchemaError({ code: "PGRST200", message: "x" }), true);
  assert.equal(isLegacySchemaError({ code: "PGRST204", message: "x" }), true);
  assert.equal(isLegacySchemaError({ message: "column profiles.org_id does not exist" }), true);
  assert.equal(
    isLegacySchemaError({
      message: "Could not find a relationship between 'profiles' and 'organizations'",
    }),
    true,
  );
});

test("legado: outros erros não são tratados como banco antigo", () => {
  assert.equal(isLegacySchemaError({ code: "42501", message: "permission denied" }), false);
  assert.equal(isLegacySchemaError({ code: "PGRST301", message: "JWT expired" }), false);
  assert.equal(isLegacySchemaError(null), false);
});

test("legado: pessoa antiga vira agente sem poderes de administração", () => {
  const row = { id: "u1", full_name: "Ana", role: "Vendas", avatar_url: null, active: true };
  const p = legacyPerson(row);
  assert.equal(p.access, "agent");
  assert.equal(p.is_platform_admin, false);
  assert.equal(p.org_id, LEGACY_ORG_ID);
  const me = legacyMyProfile(row);
  assert.equal(me.org.id, LEGACY_ORG_ID);
  assert.equal(me.is_platform_admin, false);
});
