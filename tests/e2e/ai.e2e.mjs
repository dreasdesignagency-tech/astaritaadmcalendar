// Interface do Assistente Astarita e da base de conhecimento na pilha local. IA SIMULADA (ai-mock.mjs).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';

const S = process.argv[2] ?? '.';
const BASE = 'http://127.0.0.1:5199', NOAI = 'http://127.0.0.1:5197', AI = 'http://127.0.0.1:3005', GRAPH = 'http://127.0.0.1:3004';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456';
const A = '00000000-0000-0000-0000-00000000000a';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const sql = (q) => execSync(`su postgres -c "psql -d inboxe2e -tAq"`, { input: q }).toString().trim();
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };
const posts = async () => (await (await fetch(`${GRAPH}/__requests`)).json()).filter((r) => r.method === 'POST' && /\/messages$/.test(r.path)).length;

await fetch(`${GRAPH}/__reset`); await fetch(`${AI}/__reset`);
sql(`truncate contacts, ai_suggestions, quick_replies cascade; update profiles set active=true; update knowledge_base set content='' where section in ('servicos','faq');`);
const contact = sql(`insert into contacts(name, phone) values ('Maria Souza','5511999998888') returning id`);
const conv = sql(`insert into conversations(contact_id, status, last_inbound_at, last_message_at, last_message_preview, unread_count) values ('${contact}','waiting', now(), now(), 'Quanto custa?', 1) returning id`);
sql(`insert into messages(conversation_id, direction, type, body, status) values ('${conv}','in','text','Quanto custa uma identidade visual?','received')`);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function open(base, vp = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport: vp, permissions: ['clipboard-read', 'clipboard-write'] });
  const s = { access_token: jwt(A, 'andreas@t'), refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: { id: A, aud: 'authenticated', email: 'andreas@t', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ['astarita-inbox-auth', JSON.stringify(s)]);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

// ================================================================ conversa com IA ligada
const { ctx, page, errors } = await open(BASE);
await page.goto(`${BASE}/inbox?c=${conv}`);
const panel = page.getByRole('region', { name: 'Assistente Astarita' });
await panel.waitFor({ timeout: 20000 });
const btn = (n) => panel.getByRole('button', { name: n, exact: true });
await page.waitForFunction(() => !document.querySelector('[aria-label="Assistente Astarita"] button:disabled'), null, { timeout: 15000 }).catch(() => {});
check('IA ligada: botões habilitados e sem aviso de "não configurada"', await btn('Sugerir resposta').isEnabled() && (await panel.getByText('A IA ainda não foi ligada').count()) === 0);

await btn('Sugerir resposta').click();
const box = panel.getByLabel('Sugestão (edite antes de usar)');
await box.waitFor({ timeout: 15000 });
const first = await box.inputValue();
check('sugestão aparece editável, sem aspas', first.startsWith('SUGESTAO:') && !first.startsWith('"'), first);
check('nada foi enviado ao cliente só por gerar', (await posts()) === 0 && sql(`select count(*) from messages where direction='out'`) === '0');
check('campo de resposta continua vazio até clicar em Usar', (await page.getByPlaceholder(/mensagem/i).first().inputValue().catch(() => '')) === '');

await box.fill('Oi, Maria! Posso te explicar como funciona. Qual é o seu negócio?');
await btn('Usar resposta').click();
await page.getByText('Texto colocado no campo de resposta').waitFor({ timeout: 8000 });
const composer = page.getByPlaceholder(/mensagem/i).first();
check('"Usar resposta" copia o texto EDITADO para o campo de resposta', (await composer.inputValue()) === 'Oi, Maria! Posso te explicar como funciona. Qual é o seu negócio?', await composer.inputValue());
check('a sugestão sumiu do painel e ficou marcada como usada', (await panel.getByTestId('ai-suggestion').count()) === 0 && sql(`select used from ai_suggestions`) === 't');
check('continua sem envio (precisa clicar em Enviar)', (await posts()) === 0 && sql(`select count(*) from messages where direction='out'`) === '0');

await btn('Mais curta').click();
await panel.getByLabel('Sugestão (edite antes de usar)').waitFor({ timeout: 15000 });
const ai1 = (await (await fetch(`${AI}/__requests`)).json()).at(-1);
check('ajuste de tom usa o texto do campo de resposta como base', ai1.user.includes('<texto>\nOi, Maria! Posso te explicar') && /mais curta/.test(ai1.user));
await btn('Gerar novamente').click();
const n = async () => (await (await fetch(`${AI}/__requests`)).json()).length;
for (let i = 0; i < 40 && (await n()) < 3; i++) await new Promise((r) => setTimeout(r, 250));
const last = (await (await fetch(`${AI}/__requests`)).json()).at(-1);
check('"Gerar novamente" repete a mesma ação (mais curta)', (await n()) === 3 && /mais curta/.test(last.user));
await btn('Copiar').click();
check('"Copiar" coloca o texto na área de transferência', (await page.evaluate(() => navigator.clipboard.readText())).startsWith('SUGESTAO:'));
await btn('Descartar').click();
check('"Descartar" limpa a sugestão', (await panel.getByTestId('ai-suggestion').count()) === 0);

await btn('Resumir conversa').click();
await panel.getByLabel('Resumo (só para você)').waitFor({ timeout: 15000 });
check('resumo não oferece "Usar resposta" (não vai para o cliente)', (await btn('Usar resposta').count()) === 0);
await btn('Descartar').click();

// Ajuste de tom sem nada para ajustar
await composer.fill('');
await btn('Mais natural').click();
await page.getByText('Escreva um texto no campo de resposta').waitFor({ timeout: 8000 });
check('ajuste de tom sem texto avisa e não chama a IA', true);

// erro do provedor aparece em português
sql(`insert into messages(conversation_id, direction, type, body, status) values ('${conv}','in','text','FORCE_500','received')`);
await page.waitForTimeout(500);
await page.reload(); await panel.waitFor({ timeout: 20000 });
await page.waitForFunction(() => !document.querySelector('[aria-label="Assistente Astarita"] button:disabled'), null, { timeout: 15000 }).catch(() => {});
await btn('Sugerir resposta').click();
await page.getByText('A IA está indisponível no momento').waitFor({ timeout: 15000 });
check('erro da IA: aviso claro em português e o painel continua utilizável', await btn('Sugerir resposta').isEnabled());
await page.screenshot({ path: `${S}/ai-painel.png` });

// ================================================================ Configurações
await page.goto(`${BASE}/inbox/configuracoes`);
await page.getByText('Conhecimento da Astarita').waitFor({ timeout: 20000 });
await page.getByText(/Ligado \(anthropic/).waitFor({ timeout: 15000 }).catch(() => {});
check('configurações: IA aparece como ligada com provedor e modelo', (await page.getByText(/Ligado \(anthropic, modelo modelo-teste\)/).count()) === 1);
check('configurações: WhatsApp aparece conectado ao número', (await page.getByText(/Conectado ao número/).count()) === 1);
const kb = page.getByLabel('Serviços', { exact: true });
check('as 8 seções da base aparecem; serviços vem vazio (nada inventado)', (await page.locator('textarea[id^="kb-"]').count()) === 8 && (await kb.inputValue()) === '');
await kb.fill('Identidade visual, conteúdo e audiovisual.');
await page.getByRole('button', { name: 'Salvar Serviços' }).click();
await page.getByText('Serviços salvo.').waitFor({ timeout: 8000 });
check('salvar grava no banco com o autor', sql(`select content||'|'||updated_by from knowledge_base where section='servicos'`) === `Identidade visual, conteúdo e audiovisual.|${A}`);
await page.reload(); await page.getByText('Conhecimento da Astarita').waitFor({ timeout: 20000 });
check('depois de recarregar, o texto continua', (await page.getByLabel('Serviços', { exact: true }).inputValue()) === 'Identidade visual, conteúdo e audiovisual.');
await page.screenshot({ path: `${S}/ai-config.png`, fullPage: true });

// ================================================================ servidor sem IA
const b = await open(NOAI);
await b.page.goto(`${NOAI}/inbox?c=${conv}`);
const p2 = b.page.getByRole('region', { name: 'Assistente Astarita' });
await p2.getByText('A IA ainda não foi ligada').waitFor({ timeout: 20000 });
check('sem IA: aviso honesto e botões desabilitados', await p2.getByRole('button', { name: 'Sugerir resposta' }).isDisabled());
await b.page.goto(`${NOAI}/inbox/configuracoes`);
await b.page.getByText(/Falta configurar no servidor: INBOX_AI_PROVIDER/).waitFor({ timeout: 20000 });
check('sem IA: configurações mostram o NOME do que falta (sem valores)', true);

check('nenhum erro de JavaScript na página', errors.length === 0 && b.errors.length === 0, errors.concat(b.errors).join(' | '));
await browser.close();
const failed = results.filter((x) => !x).length;
console.log(failed ? `\n${failed} FALHARAM de ${results.length}` : `\n${results.length}/${results.length} passaram`);
process.exit(failed ? 1 : 0);
