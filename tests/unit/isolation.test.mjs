import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Garante, no código-fonte, que Inbox e calendário não se enxergam. */
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });

const inboxFiles = [...walk("src/lib/inbox"), ...walk("src/components/inbox"), ...walk("src/routes/inbox")];
const importsOf = (file) => [...readFileSync(file, "utf8").matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

test("há arquivos do Inbox para verificar", () => assert.ok(inboxFiles.length > 20));

test("nenhum arquivo do Inbox importa o cliente ou a autenticação do calendário", () => {
  const banned = [/@\/integrations\/supabase/, /@\/lib\/auth$/, /@\/lib\/planner/, /@\/components\/AppShell/];
  for (const f of inboxFiles) {
    for (const imp of importsOf(f)) {
      assert.ok(!banned.some((b) => b.test(imp)), `${f} importa ${imp}`);
    }
  }
});

test("nenhum arquivo do Inbox lê as variáveis VITE_SUPABASE_* fora do cliente do Inbox", () => {
  for (const f of inboxFiles.filter((f) => !f.endsWith("lib/inbox/client.ts"))) {
    assert.ok(!/VITE_SUPABASE_(URL|PUBLISHABLE)/.test(readFileSync(f, "utf8")), `${f} lê variável do calendário`);
  }
});

test("o calendário não importa nada do Inbox", () => {
  const calendar = [...walk("src/routes/_authenticated"), "src/routes/auth.tsx", "src/routes/reset-password.tsx", "src/components/AppShell.tsx", "src/lib/auth.ts", "src/lib/planner.ts"];
  for (const f of calendar) {
    assert.ok(!importsOf(f).some((i) => /inbox/.test(i)), `${f} importa o Inbox`);
  }
});

test("o cliente do Inbox usa armazenamento e chave de sessão próprios", () => {
  const src = readFileSync("src/lib/inbox/client.ts", "utf8");
  assert.match(src, /storageKey:\s*INBOX_STORAGE_KEY/);
  assert.match(src, /astarita-inbox-auth/);
  assert.ok(!/previewAuthStorage|brokeredPreviewStorage/.test(src));
});

test("nenhum arquivo do Inbox menciona service role", () => {
  for (const f of inboxFiles) {
    if (f.endsWith("lib/inbox/config.ts")) continue; // lá só aparece para recusar a chave
    assert.ok(!/service_role|SERVICE_ROLE/.test(readFileSync(f, "utf8")), `${f} menciona service role`);
  }
});
