// Tela "Conectar o WhatsApp" (Configurações), agora por empresa: formulário, passos reais, webhook e verify token.
// Meta SIMULADA. Nenhuma mensagem real, nenhuma conta Meta tocada.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const S = process.argv[2] ?? '.';
const BASE = 'http://127.0.0.1:5199', NOKEY = 'http://127.0.0.1:5197';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456';
const APP_SECRET = 'astaritaappsecret0123456789abcdef', TOKEN = 'token-de-teste-da-meta';
const A = '00000000-0000-0000-0000-00000000000a', AG = '00000000-0000-0000-0000-0000000000f1';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const sql = (q) => execSync(`su postgres -c "psql -d inboxe2e -tAq"`, { input: `do $$ begin perform set_config('request.jwt.claims', '{"sub":"${A}"}', false); end $$;\n${q}` }).toString().trim();
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };
import { shiftTs } from './fixture-time.mjs';
const raw = shiftTs(readFileSync('tests/fixtures/whatsapp/text.json', 'utf8'));

sql(`truncate contacts, tags, webhook_events, quick_replies, reminders, internal_notes, ai_suggestions cascade; update profiles set active=true;`);
const ORG = sql(`select id from organizations where slug='astarita'`);
sql(`update org_whatsapp set phone_number_id=null, api_version=null, access_token_enc=null, app_secret_enc=null, verify_token_enc=null, connected_at=null where org_id='${ORG}'`);
sql(`delete from profiles where id='${AG}'; delete from auth.users where id='${AG}'; insert into auth.users(id,email) values ('${AG}','agente@t'); insert into profiles(id, full_name, role, org_id, access) values ('${AG}', 'Atendente Teste', 'member', '${ORG}', 'agent');`);
await fetch('http://127.0.0.1:3004/__reset');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function open(sub = A, email = 'andreas@t', vp = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport: vp, permissions: ['clipboard-read', 'clipboard-write'] });
  const s = { access_token: jwt(sub, email), refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: { id: sub, aud: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ['astarita-inbox-auth', JSON.stringify(s)]);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors, token: s.access_token };
}
const step = (page, t) => page.locator('ol[aria-label="Passos da conexão do WhatsApp"] li', { hasText: t });
const state = async (page, t) => (await step(page, t).getAttribute('data-state'));
const post = (key, sig) => fetch(`${BASE}/api/whatsapp/webhook/${key}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig }, body: raw });

// ================================================================ dono, nada configurado ainda
const { ctx, page, errors, token } = await open();
await page.goto(`${BASE}/inbox/configuracoes`);
await page.getByText('Conectar o WhatsApp').first().waitFor({ timeout: 20000 });
await step(page, 'Dados do WhatsApp salvos').waitFor({ timeout: 15000 });
check('servidor pronto; dados do WhatsApp pendentes com os campos que faltam', (await state(page, 'O servidor do sistema')) === 'done' && (await state(page, 'Dados do WhatsApp')) === 'todo' && (await step(page, 'Dados do WhatsApp').innerText()).includes('Token de acesso'));
check('Meta e webhook ficam "desconhecidos", sem fingir sucesso', (await state(page, 'A Meta aceita')) === 'unknown' && (await state(page, 'O webhook está')) === 'unknown');
const key = sql(`select webhook_key from org_whatsapp where org_id='${ORG}'`);
await page.getByTestId('webhook-url').waitFor({ timeout: 15000 });
check('mostra o endereço do webhook DESTA empresa (com a chave aleatória)', (await page.getByTestId('webhook-url').innerText()) === `${BASE}/api/whatsapp/webhook/${key}`);
check('avisa que localhost não serve para a Meta (precisa de HTTPS público)', (await page.getByText('não é público em HTTPS').count()) === 1);
check('o verify token é gerado pelo sistema e aparece para copiar', (await page.getByTestId('verify-token').innerText()).length >= 32);

// formulário: validação
await page.getByLabel('ID do número de telefone').fill('+55 11 99999-8888');
await page.getByLabel('Token de acesso').fill('X'.repeat(40));
await page.getByLabel('App Secret').fill('A'.repeat(32));
await page.getByLabel('Versão da API').fill('v21.0');
await page.getByRole('button', { name: 'Salvar e conferir com a Meta' }).click();
await page.getByText(/O ID do número é só números/).waitFor({ timeout: 10000 });
check('ID do número com telefone/símbolos é recusado, com explicação, e nada é salvo', sql(`select coalesce(phone_number_id,'-') from org_whatsapp where org_id='${ORG}'`) === '-');

// formulário: salvar certo
await page.getByLabel('ID do número de telefone').fill('109876543210');
await page.getByLabel('Token de acesso').fill(TOKEN);
await page.getByLabel('App Secret').fill(APP_SECRET);
await page.getByRole('button', { name: 'Salvar e conferir com a Meta' }).click();
await page.getByText(/Conectado ao número \+1 555 000 1111/).first().waitFor({ timeout: 20000 });
check('salvou: dados salvos e a Meta confirma número e nome', (await state(page, 'Dados do WhatsApp')) === 'done' && (await state(page, 'A Meta aceita')) === 'done' && (await step(page, 'A Meta aceita').innerText()).includes('Astarita Teste'));
check('os campos secretos ficaram vazios e dizem "Salvo" (o valor nunca volta para a tela)', (await page.getByLabel('Token de acesso').inputValue()) === '' && (await page.getByLabel('App Secret').getAttribute('placeholder')).startsWith('Salvo') && (await page.getByLabel('Token de acesso').getAttribute('type')) === 'password');
check('no banco, token e App Secret estão cifrados', sql(`select (access_token_enc like 'v1.%')::text || (app_secret_enc like 'v1.%')::text from org_whatsapp where org_id='${ORG}'`) === 'truetrue');

// webhook: recusado e aceito
await post(key, 'sha256=' + '0'.repeat(64));
await page.getByRole('button', { name: 'Verificar de novo' }).click();
await page.getByText(/recusada\(s\) nas últimas 24 h/).waitFor({ timeout: 15000 });
check('assinatura inválida aparece como erro, com a dica do App Secret', (await state(page, 'O webhook está')) === 'error');
const ok = await post(key, 'sha256=' + createHmac('sha256', APP_SECRET).update(raw).digest('hex'));
check('evento assinado de verdade é aceito pelo webhook da empresa', ok.status === 200);
await page.getByRole('button', { name: 'Verificar de novo' }).click();
await page.getByText(/Último evento válido em/).waitFor({ timeout: 15000 });
check('com evento válido o passo do webhook fica concluído', (await state(page, 'O webhook está')) === 'done');

// copiar
await page.getByRole('button', { name: 'Copiar' }).first().click();
check('"Copiar" coloca o endereço do webhook na área de transferência', (await page.evaluate(() => navigator.clipboard.readText())) === `${BASE}/api/whatsapp/webhook/${key}`);

// segredos
const text = await page.content();
const secrets = [TOKEN, APP_SECRET];
check('nenhum valor secreto aparece na tela nem no HTML', !secrets.some((v) => text.includes(v)));
const st = await page.evaluate(async (t) => { const out = []; for (const u of ['/api/inbox/status', '/api/inbox/whatsapp']) out.push(await (await fetch(u, { headers: { authorization: `Bearer ${t}` } })).text()); return out.join('\n'); }, token);
check('as respostas do servidor (status e conexão) não trazem token nem App Secret nem conteúdo de mensagens', !secrets.some((v) => st.includes(v)) && !st.includes('Maria'), st.slice(0, 200));
await page.screenshot({ path: `${S}/wa-setup.png`, fullPage: true });
await ctx.close();

// ================================================================ atendente (sem poder de administrar)
const ag = await open(AG, 'agente@t');
await ag.page.goto(`${BASE}/inbox/configuracoes`);
await ag.page.getByText('Conectar o WhatsApp').first().waitFor({ timeout: 20000 });
await step(ag.page, 'Dados do WhatsApp').waitFor({ timeout: 15000 });
check('atendente vê o estado, mas NÃO vê formulário, verify token nem endereço do webhook', (await ag.page.getByLabel('Token de acesso').count()) === 0 && (await ag.page.getByTestId('verify-token').count()) === 0 && (await ag.page.getByTestId('webhook-url').count()) === 0 && (await ag.page.getByText('Só o administrador da empresa altera').count()) === 1);
check('atendente não vê o botão de adicionar pessoas', (await ag.page.getByRole('button', { name: 'Adicionar pessoa' }).count()) === 0);
const r = await ag.page.evaluate(async (t) => (await fetch('/api/inbox/whatsapp', { headers: { authorization: `Bearer ${t}` } })).status, ag.token);
check('e o servidor também recusa (403)', r === 403);
await ag.ctx.close();

// ================================================================ servidor sem a chave que protege as credenciais
const b = await open();
await b.page.goto(`${NOKEY}/inbox/configuracoes`);
await b.page.getByText('Conectar o WhatsApp').first().waitFor({ timeout: 20000 });
await step(b.page, 'O servidor do sistema').waitFor({ timeout: 15000 });
check('servidor sem a chave dos segredos: passo do servidor pendente e pede o NOME dela', (await state(b.page, 'O servidor do sistema')) === 'todo' && (await step(b.page, 'O servidor do sistema').innerText()).includes('INBOX_SECRETS_KEY'));
check('e os passos seguintes ficam desconhecidos', (await state(b.page, 'Dados do WhatsApp')) === 'unknown' && (await state(b.page, 'A Meta aceita')) === 'unknown');
check('o chip do topo diz que o WhatsApp não está conectado', (await b.page.getByText('WhatsApp não conectado').count()) >= 1);
await b.page.screenshot({ path: `${S}/wa-setup-vazio.png`, fullPage: true });
await b.ctx.close();

// celular
const m = await open(A, 'andreas@t', { width: 390, height: 844 });
await m.page.goto(`${BASE}/inbox/configuracoes`);
await m.page.getByText('Conectar o WhatsApp').first().waitFor({ timeout: 20000 });
await m.page.getByLabel('Token de acesso').waitFor({ timeout: 15000 });
const overflow = await m.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check('no celular a tela não gera rolagem horizontal', !overflow);
await m.page.screenshot({ path: `${S}/wa-setup-mobile.png`, fullPage: true });
check('sem erros de JavaScript', errors.length + ag.errors.length + b.errors.length + m.errors.length === 0, [...errors, ...ag.errors, ...b.errors, ...m.errors].join(' | '));
sql(`delete from profiles where id='${AG}'; delete from auth.users where id='${AG}';`);
await browser.close();
const failed = results.filter((x) => !x).length;
console.log(failed ? `\n${failed} FALHARAM de ${results.length}` : `\n${results.length}/${results.length} passaram`);
process.exit(failed ? 1 : 0);
