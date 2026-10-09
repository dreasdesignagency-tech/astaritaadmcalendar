// Tela "Conectar o WhatsApp" (Configurações) na pilha local. Meta SIMULADA. Nenhuma mensagem real, nenhuma conta Meta tocada.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const S = process.argv[2] ?? '.';
const BASE = 'http://127.0.0.1:5199', NOWA = 'http://127.0.0.1:5197';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456', APP_SECRET = 'segredo-do-app-teste';
const A = '00000000-0000-0000-0000-00000000000a';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const sql = (q) => execSync(`su postgres -c "psql -d inboxe2e -tAq"`, { input: q }).toString().trim();
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };
const raw = readFileSync('tests/fixtures/whatsapp/text.json', 'utf8');
const post = (sig) => fetch(`${BASE}/api/whatsapp/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig }, body: raw });

sql(`truncate contacts, tags, webhook_events, quick_replies, reminders, internal_notes, ai_suggestions cascade; update profiles set active=true;`);
await fetch('http://127.0.0.1:3004/__reset');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function open(vp = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport: vp, permissions: ['clipboard-read', 'clipboard-write'] });
  const s = { access_token: jwt(A, 'andreas@t'), refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: { id: A, aud: 'authenticated', email: 'andreas@t', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ['astarita-inbox-auth', JSON.stringify(s)]);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}
const step = (page, t) => page.locator('ol[aria-label="Passos da conexão do WhatsApp"] li', { hasText: t });
const state = async (page, t) => (await step(page, t).getAttribute('data-state'));

// ================================================================ servidor completo
const { ctx, page, errors } = await open();
await page.goto(`${BASE}/inbox/configuracoes`);
await page.getByText('Conectar o WhatsApp').waitFor({ timeout: 20000 });
await step(page, 'A Meta aceita').waitFor({ timeout: 15000 });
await page.waitForFunction(() => document.querySelector('ol[aria-label] li[data-state="done"]'), null, { timeout: 15000 });
check('banco acessível e variáveis do WhatsApp: passos concluídos', (await state(page, 'O servidor do Inbox')) === 'done' && (await state(page, 'Variáveis do WhatsApp')) === 'done');
check('Meta aceita as credenciais (número e nome vindos da Meta)', (await state(page, 'A Meta aceita')) === 'done' && (await step(page, 'A Meta aceita').innerText()).includes('Astarita Teste'));
check('webhook pendente enquanto nenhum evento chegou', (await state(page, 'O webhook está recebendo')) === 'todo');
check('mostra o endereço do webhook com /api/whatsapp/webhook', (await page.getByTestId('webhook-url').innerText()) === `${BASE}/api/whatsapp/webhook`);
check('avisa que localhost não serve para a Meta (precisa de HTTPS público)', (await page.getByText('não é público em HTTPS').count()) === 1);
check('a tabela lista as 6 variáveis por NOME, todas definidas', (await page.locator('li:has(code) >> [aria-label="definida"]').count()) === 6 && (await page.locator('[aria-label="faltando"]').count()) === 0);

// chamada recusada por assinatura
await post('sha256=' + '0'.repeat(64));
await page.getByRole('button', { name: 'Verificar de novo' }).click();
await page.getByText(/recusada\(s\) nas últimas 24 h/).waitFor({ timeout: 15000 });
check('assinatura inválida aparece como erro, com a dica do App Secret', (await state(page, 'O webhook está recebendo')) === 'error' && (await page.getByText(/App Secret/).count()) >= 1);

// evento válido
const ok = await post('sha256=' + createHmac('sha256', APP_SECRET).update(raw).digest('hex'));
check('evento assinado de verdade é aceito pelo webhook', ok.status === 200);
await page.getByRole('button', { name: 'Verificar de novo' }).click();
await page.getByText(/Último evento válido em/).waitFor({ timeout: 15000 });
check('com evento válido o passo do webhook fica concluído', (await state(page, 'O webhook está recebendo')) === 'done');

// copiar
await page.getByRole('button', { name: 'Copiar' }).click();
check('"Copiar" coloca o endereço do webhook na área de transferência', (await page.evaluate(() => navigator.clipboard.readText())) === `${BASE}/api/whatsapp/webhook`);

// segredos nunca na tela nem no HTML
const text = await page.content();
const secrets = ['token-de-teste-da-meta', 'segredo-do-app-teste', 'verify-teste'];
check('nenhum valor secreto aparece na tela, no HTML ou nas respostas de status', !secrets.some((v) => text.includes(v)));
const st = await page.evaluate(async () => { const k = Object.keys(localStorage).find((x) => x.includes('astarita-inbox-auth')); const t = JSON.parse(localStorage.getItem(k)).access_token; return (await fetch('/api/inbox/status', { headers: { authorization: `Bearer ${t}` } })).text(); });
check('a resposta de /api/inbox/status não traz valores secretos nem conteúdo de mensagens', !secrets.some((v) => st.includes(v)) && !st.includes('Maria'), st.slice(0, 200));
await page.screenshot({ path: `${S}/wa-setup.png`, fullPage: true });
await ctx.close();

// ================================================================ servidor sem WhatsApp
const b = await open();
await b.page.goto(`${NOWA}/inbox/configuracoes`);
await b.page.getByText('Conectar o WhatsApp').waitFor({ timeout: 20000 });
await step(b.page, 'Variáveis do WhatsApp').waitFor({ timeout: 15000 });
check('sem WhatsApp: passo das variáveis pendente e lista o que falta por NOME', (await state(b.page, 'Variáveis do WhatsApp')) === 'todo' && (await step(b.page, 'Variáveis do WhatsApp').innerText()).includes('WHATSAPP_ACCESS_TOKEN'));
check('sem WhatsApp: Meta e webhook ficam "desconhecidos", sem fingir sucesso', (await state(b.page, 'A Meta aceita')) === 'unknown' && (await state(b.page, 'O webhook está recebendo')) === 'unknown');
check('sem WhatsApp: a tabela marca as variáveis que faltam', (await b.page.locator('[aria-label="faltando"]').count()) === 5);
check('o chip do topo diz que o WhatsApp não está conectado', (await b.page.getByText('WhatsApp não conectado').count()) >= 1);
await b.page.screenshot({ path: `${S}/wa-setup-vazio.png`, fullPage: true });
// celular
const m = await open({ width: 390, height: 844 });
await m.page.goto(`${BASE}/inbox/configuracoes`);
await m.page.getByText('Conectar o WhatsApp').waitFor({ timeout: 20000 });
const overflow = await m.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check('no celular a tela não gera rolagem horizontal', !overflow);
await m.page.screenshot({ path: `${S}/wa-setup-mobile.png`, fullPage: true });
check('sem erros de JavaScript', errors.length + b.errors.length + m.errors.length === 0, [...errors, ...b.errors, ...m.errors].join(' | '));
await browser.close();
const failed = results.filter((x) => !x).length;
console.log(failed ? `\n${failed} FALHARAM de ${results.length}` : `\n${results.length}/${results.length} passaram`);
process.exit(failed ? 1 : 0);
