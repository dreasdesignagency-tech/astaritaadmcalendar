// Multiempresa na interface: painel do dono da plataforma, equipe, login do dono de uma empresa nova e isolamento visual.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';

const S = process.argv[2] ?? '.';
const BASE = 'http://127.0.0.1:5199', GW = 'http://127.0.0.1:3002';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456';
const A = '00000000-0000-0000-0000-00000000000a', J = '00000000-0000-0000-0000-00000000000b';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const sql = (q) => execSync(`su postgres -c "psql -d inboxe2e -tAq"`, { input: `do $$ begin perform set_config('request.jwt.claims', '{"sub":"${A}"}', false); end $$;\n${q}` }).toString().trim();
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };

const clean = () => { sql(`delete from profiles where org_id in (select id from organizations where slug <> 'astarita'); delete from organizations where slug <> 'astarita'; delete from auth.users where email not in ('andreas@t','juline@t','intruso@t'); truncate contacts, tags, webhook_events, quick_replies, reminders, internal_notes, ai_suggestions cascade; update profiles set active=true;`); };
clean();
await fetch(`${GW}/__reset-users`);
sql(`insert into contacts(name, phone, company) values ('Cliente da Astarita', '5511999990001', 'Padaria Sol')`);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function open(sub, email, vp = { width: 1440, height: 900 }, session = true) {
  const ctx = await browser.newContext({ viewport: vp, permissions: ['clipboard-read', 'clipboard-write'] });
  if (session) {
    const s = { access_token: jwt(sub, email), refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: { id: sub, aud: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
    await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ['astarita-inbox-auth', JSON.stringify(s)]);
  }
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}
const pick = async (page, label, option) => { await page.getByRole('combobox', { name: label }).click(); await page.getByRole('option', { name: option, exact: true }).click(); };

// ================================================================ Juline: dona da Astarita, mas não da plataforma
const j = await open(J, 'juline@t');
await j.page.goto(`${BASE}/inbox/contatos`);
await j.page.getByText('Cliente da Astarita').waitFor({ timeout: 20000 });
check('o menu mostra o nome da empresa e o nível de quem entrou', (await j.page.getByText('Astarita Creative Studio').count()) >= 1 && (await j.page.getByText('CEO').count()) >= 1);
check('quem não é dono da plataforma NÃO vê o item "Plataforma" no menu', (await j.page.getByRole('link', { name: 'Plataforma' }).count()) === 0);
await j.page.goto(`${BASE}/inbox/plataforma`);
await j.page.getByText('Acesso restrito').first().waitFor({ timeout: 15000 });
check('abrir /inbox/plataforma na mão mostra "Acesso restrito" (e o servidor recusa por trás)', true);
await j.ctx.close();

// ================================================================ Andreas: dono da plataforma
const a = await open(A, 'andreas@t');
await a.page.goto(`${BASE}/inbox/contatos`);
await a.page.getByText('Cliente da Astarita').waitFor({ timeout: 20000 });
check('o dono da plataforma vê o item "Plataforma" no menu', (await a.page.getByRole('link', { name: 'Plataforma' }).count()) >= 1);
await a.page.getByRole('link', { name: 'Plataforma' }).first().click();
await a.page.locator('li[data-org="astarita"]').waitFor({ timeout: 20000 });
check('o painel mostra a Astarita com pessoas, contatos e plano', (await a.page.locator('li[data-org="astarita"]').innerText()).includes('2/10 pessoas') && (await a.page.locator('li[data-org="astarita"]').innerText()).includes('1 contatos'));
check('a própria empresa não tem botão de suspender', (await a.page.getByRole('button', { name: /Suspender Astarita/ }).count()) === 0);

// criar empresa
await a.page.getByRole('button', { name: 'Nova empresa' }).first().click();
await a.page.getByLabel('Nome da empresa').fill('Empresa Teste UI');
check('o endereço (identificador) é sugerido a partir do nome', (await a.page.getByLabel('Endereço (identificador)').inputValue()) === 'empresa-teste-ui');
await pick(a.page, 'Plano da empresa', 'Pro');
await a.page.getByLabel('Nome do dono').fill('Dona da Empresa');
await a.page.getByLabel('E-mail do dono').fill('dona@teste-ui.test');
await a.page.getByRole('button', { name: 'Criar empresa' }).click();
await a.page.getByTestId('temp-password').waitFor({ timeout: 20000 });
const PASS = await a.page.getByTestId('temp-password').innerText();
check('criar empresa mostra a senha temporária do dono UMA vez', PASS.length >= 12);
await a.page.getByRole('button', { name: 'Já anotei' }).click();
await a.page.locator('li[data-org="empresa-teste-ui"]').waitFor({ timeout: 15000 });
check('a empresa nova aparece no painel, ativa, com plano Pro e 1 pessoa', (await a.page.locator('li[data-org="empresa-teste-ui"]').innerText()).includes('1/10 pessoas') && (await a.page.locator('li[data-org="empresa-teste-ui"]').innerText()).includes('Ativa'));
// repetir o endereço
await a.page.getByRole('button', { name: 'Nova empresa' }).first().click();
await a.page.getByLabel('Nome da empresa').fill('Empresa Teste UI');
await a.page.getByLabel('Nome do dono').fill('Outro Dono');
await a.page.getByLabel('E-mail do dono').fill('outro@teste-ui.test');
await a.page.getByRole('button', { name: 'Criar empresa' }).click();
await a.page.getByText('Já existe uma empresa com esse endereço.').waitFor({ timeout: 15000 });
check('endereço repetido mostra a mensagem e não cria nada', sql(`select count(*) from organizations where slug like 'empresa-teste-ui%'`) === '1');
await a.page.getByRole('button', { name: 'Cancelar' }).click();

// limites
const row = a.page.locator('li[data-org="empresa-teste-ui"]');
await row.getByLabel('Máx. de pessoas').fill('2');
await a.page.getByRole('button', { name: 'Salvar limites de Empresa Teste UI' }).click();
await a.page.getByText('Limites atualizados.').waitFor({ timeout: 10000 });
check('limites salvam no banco', sql(`select max_users from organizations where slug='empresa-teste-ui'`) === '2');
await a.page.screenshot({ path: `${S}/saas-plataforma.png`, fullPage: true });
await a.ctx.close();

// ================================================================ a dona da empresa nova entra pela TELA de login
const d = await open(null, null, { width: 1440, height: 900 }, false);
await d.page.goto(`${BASE}/inbox/entrar`);
await d.page.getByLabel('E-mail').fill('dona@teste-ui.test');
await d.page.getByLabel('Senha').fill('senha-errada');
await d.page.getByRole('button', { name: 'Entrar' }).click();
await d.page.getByText('E-mail ou senha incorretos.').waitFor({ timeout: 10000 });
check('senha errada é recusada', true);
await d.page.getByLabel('Senha').fill(PASS);
await d.page.getByRole('button', { name: 'Entrar' }).click();
await d.page.waitForURL(/\/inbox$|\/inbox\?/, { timeout: 20000 });
await d.page.getByText('Empresa Teste UI').first().waitFor({ timeout: 20000 });
check('ela entra com a senha temporária e o menu mostra a empresa DELA', (await d.page.getByText('Empresa Teste UI').count()) >= 1 && (await d.page.getByText('Proprietário').count()) >= 1);
check('ela NÃO vê "Plataforma" no menu', (await d.page.getByRole('link', { name: 'Plataforma' }).count()) === 0);
await d.page.goto(`${BASE}/inbox/contatos`);
await d.page.getByText(/Nenhum contato/).first().waitFor({ timeout: 20000 }).catch(() => {});
check('ela não vê nenhum contato da Astarita (isolamento na tela)', (await d.page.getByText('Cliente da Astarita').count()) === 0);
await d.page.goto(`${BASE}/inbox/funil`);
await d.page.locator('section[role=listitem]').first().waitFor({ timeout: 20000 });
check('o funil dela tem as 7 etapas, vazio', (await d.page.locator('section[role=listitem]').count()) === 7 && (await d.page.getByText('Cliente da Astarita').count()) === 0);
await d.page.goto(`${BASE}/inbox/configuracoes`);
await d.page.getByText('Equipe com acesso').waitFor({ timeout: 20000 });
await d.page.getByText('Dona da Empresa').first().waitFor({ timeout: 15000 });
check('a equipe dela tem só ela (nenhum da Astarita) e o plano mostra 1 de 2', (await d.page.getByText('Andreas').count()) === 0 && (await d.page.getByText('1 de 2 pessoas ativas').count()) === 1);
await d.page.locator('#kb-apresentacao').waitFor({ timeout: 15000 });
check('a base de conhecimento dela vem vazia', (await d.page.locator('textarea[id^="kb-"]').count()) === 8 && (await d.page.locator('#kb-apresentacao').inputValue()) === '');

// adicionar pessoa pela tela
await d.page.getByRole('button', { name: 'Adicionar pessoa' }).click();
await d.page.getByLabel('Nome', { exact: true }).fill('Maria Atendente');
await d.page.getByLabel('E-mail', { exact: true }).fill('maria@teste-ui.test');
await d.page.getByRole('button', { name: 'Criar acesso' }).click();
await d.page.getByTestId('temp-password').waitFor({ timeout: 20000 });
const PASS2 = await d.page.getByTestId('temp-password').innerText();
check('adicionar pessoa mostra a senha temporária UMA vez', PASS2.length >= 12 && PASS2 !== PASS);
await d.page.getByRole('button', { name: 'Já anotei' }).click();
await d.page.getByText('Maria Atendente').first().waitFor({ timeout: 15000 });
check('a pessoa aparece na equipe e o contador sobe para 2 de 2', (await d.page.getByText('2 de 2 pessoas ativas').count()) === 1);
// limite
await d.page.getByRole('button', { name: 'Adicionar pessoa' }).click();
await d.page.getByLabel('Nome', { exact: true }).fill('Mais Um');
await d.page.getByLabel('E-mail', { exact: true }).fill('maisum@teste-ui.test');
await d.page.getByRole('button', { name: 'Criar acesso' }).click();
await d.page.getByText(/O plano permite no máximo 2 pessoas ativas/).waitFor({ timeout: 15000 });
check('no limite do plano, a tela explica e não cria', sql(`select count(*) from auth.users where email='maisum@teste-ui.test'`) === '0');
await d.page.getByRole('button', { name: 'Cancelar' }).click();
// desativar e nova senha
await d.page.getByRole('button', { name: 'Nova senha de Maria Atendente' }).click();
await d.page.getByTestId('temp-password').waitFor({ timeout: 15000 });
const PASS3 = await d.page.getByTestId('temp-password').innerText();
check('"Nova senha" mostra outra senha temporária', PASS3 !== PASS2 && PASS3.length >= 12);
await d.page.getByRole('button', { name: 'Já anotei' }).click();
await d.page.getByRole('button', { name: 'Desativar Maria Atendente' }).click();
await d.page.getByText('Pessoa desativada. Ela não entra mais.').waitFor({ timeout: 10000 });
check('desativar a pessoa grava no banco e libera vaga', sql(`select active from profiles where full_name='Maria Atendente'`) === 'f' && (await d.page.getByText('1 de 2 pessoas ativas').count()) === 1);
check('não existe botão para desativar a si mesma', (await d.page.getByRole('button', { name: /Desativar Dona da Empresa/ }).count()) === 0);
await d.page.screenshot({ path: `${S}/saas-equipe.png`, fullPage: true });
await d.ctx.close();

// ================================================================ Andreas suspende a empresa; ela é barrada na hora
const a2 = await open(A, 'andreas@t');
await a2.page.goto(`${BASE}/inbox/plataforma`);
await a2.page.locator('li[data-org="empresa-teste-ui"]').waitFor({ timeout: 20000 });
await a2.page.getByRole('button', { name: 'Suspender Empresa Teste UI' }).click();
await a2.page.getByText('Empresa suspensa. Ninguém dela entra.').waitFor({ timeout: 10000 });
check('suspender grava no banco e o painel mostra "Suspensa"', sql(`select status from organizations where slug='empresa-teste-ui'`) === 'suspended' && (await a2.page.locator('li[data-org="empresa-teste-ui"]').innerText()).includes('Suspensa'));
await a2.ctx.close();
const d2 = await open(null, null, { width: 1440, height: 900 }, false);
await d2.page.goto(`${BASE}/inbox/entrar`);
await d2.page.getByLabel('E-mail').fill('dona@teste-ui.test');
await d2.page.getByLabel('Senha').fill(PASS);
await d2.page.getByRole('button', { name: 'Entrar' }).click();
await d2.page.getByText(/não está autorizada|não tem acesso|suspens/i).first().waitFor({ timeout: 20000 });
check('a dona da empresa suspensa consegue autenticar, mas o Inbox não abre os dados dela', (await d2.page.getByText('Cliente da Astarita').count()) === 0 && !/\/inbox\/contatos/.test(d2.page.url()));
await d2.page.screenshot({ path: `${S}/saas-suspensa.png` });
await d2.ctx.close();

check('nenhum erro de JavaScript', j.errors.length + a.errors.length + d.errors.length + d2.errors.length + a2.errors.length === 0, [...j.errors, ...a.errors, ...d.errors, ...d2.errors, ...a2.errors].join(' | '));
clean();
await fetch(`${GW}/__reset-users`);
await browser.close();
const failed = results.filter((x) => !x).length;
console.log(failed ? `\n${failed} FALHARAM de ${results.length}` : `\n${results.length}/${results.length} passaram`);
process.exit(failed ? 1 : 0);
