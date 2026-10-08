// Login do Inbox, isolamento de sessões, configuração ausente e regressão do calendário.
// Requer: gateway-proxy (3002) + PostgREST + calendar-mock (3003) + dois servidores de desenvolvimento:
//   5199 com VITE_INBOX_* e VITE_SUPABASE_* ; 5198 só com VITE_SUPABASE_* (Inbox sem configuração).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createHmac } from 'node:crypto';
const S = process.argv[2] ?? '.';
const WITH = 'http://127.0.0.1:5199', WITHOUT = 'http://127.0.0.1:5198';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456';
const A = '00000000-0000-0000-0000-00000000000a';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email, secret = SECRET) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')}`; };
const sessionJson = (sub, email, secret) => JSON.stringify({ access_token: jwt(sub, email, secret), refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: { id: sub, aud: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } });
const CAL_KEY = 'sb-127-auth-token', INBOX_KEY = 'astarita-inbox-auth';
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function open({ calendar = false, inbox = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.addInitScript(([cal, inb, ck, ik]) => { if (cal) localStorage.setItem(ck, cal); if (inb) localStorage.setItem(ik, inb); }, [
    calendar ? sessionJson('cal-user', 'cal@calendario.test', 'segredo-do-calendario') : null,
    inbox ? sessionJson(A, 'andreas@t') : null, CAL_KEY, INBOX_KEY]);
  const page = await ctx.newPage();
  const hosts = new Set(), errors = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (u.port === '3002' || u.port === '3003') hosts.add(`${u.port}${u.pathname.startsWith('/rest') ? ':rest' : u.pathname.startsWith('/auth') ? ':auth' : ':outro'}`); });
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, hosts, errors };
}
const storage = (page) => page.evaluate(([ck, ik]) => ({ cal: localStorage.getItem(ck), inbox: localStorage.getItem(ik) }), [CAL_KEY, INBOX_KEY]);

// --- 1. Sem sessão: o Inbox pede o login do Inbox
{
  const { ctx, page } = await open();
  await page.goto(`${WITH}/inbox`); await page.waitForURL(/\/inbox\/entrar/, { timeout: 15000 });
  check('sem sessão: /inbox redireciona para /inbox/entrar', true);
  check('tela de login do Inbox é exibida e avisa que é independente do calendário', await page.getByText('Este login é só do Inbox').isVisible());
  await page.screenshot({ path: `${S}/iso-login.png` });
  await ctx.close();
}

// --- 2. Só sessão do calendário: o Inbox NÃO a aceita nem a envia
{
  const { ctx, page, hosts } = await open({ calendar: true });
  await page.goto(`${WITH}/inbox`); await page.waitForURL(/\/inbox\/entrar/, { timeout: 15000 });
  check('sessão do calendário não vale no Inbox', true);
  await page.waitForTimeout(800);
  check('nenhuma consulta de dados foi feita nos projetos (nem com o token do calendário)', ![...hosts].some((h) => h.endsWith(':rest')), [...hosts].join());
  await ctx.close();
}

// --- 3. Login com senha errada e certa (GoTrue simulado)
{
  const { ctx, page, hosts } = await open({ calendar: true });
  await page.goto(`${WITH}/inbox/entrar`);
  await page.getByLabel('E-mail').fill('andreas@t'); await page.getByLabel('Senha').fill('errada');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('E-mail ou senha incorretos.').waitFor({ timeout: 10000 });
  check('senha errada mostra mensagem em português', true);
  check('senha errada não grava sessão', (await storage(page)).inbox === null);

  await page.getByLabel('Senha').fill('senha-teste-123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/inbox$|\/inbox\?/, { timeout: 15000 });
  await page.getByText('Caixa de entrada').first().waitFor({ timeout: 15000 });
  const st = await storage(page);
  check('login correto entra no Inbox', true);
  check('sessão do Inbox gravada na chave própria', !!st.inbox && JSON.parse(st.inbox).user.email === 'andreas@t');
  check('sessão do calendário continua intacta depois do login do Inbox', !!st.cal && JSON.parse(st.cal).user.email === 'cal@calendario.test');
  check('durante o uso do Inbox nada foi enviado ao projeto do calendário (3003)', ![...hosts].some((h) => h.startsWith('3003')), [...hosts].join());
  await page.screenshot({ path: `${S}/iso-inbox-logged.png` });

  // recarregar mantém a sessão
  await page.reload(); await page.getByText('Caixa de entrada').first().waitFor({ timeout: 15000 });
  check('recarregar a página mantém o login do Inbox', true);

  // --- 4. Sair do Inbox não desloga o calendário
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.waitForURL(/\/inbox\/entrar/, { timeout: 10000 });
  const after = await storage(page);
  check('sair do Inbox remove só a sessão do Inbox', after.inbox === null && !!after.cal);
  await ctx.close();
}

// --- 5. Definir senha (link de convite/recuperação)
{
  const { ctx, page } = await open();
  await page.goto(`${WITH}/inbox/definir-senha`);
  await page.getByText('Link inválido ou expirado').waitFor({ timeout: 10000 });
  check('definir-senha sem sessão de convite: link inválido', true);
  await ctx.close();
}
{
  const { ctx, page } = await open({ inbox: true });
  await page.goto(`${WITH}/inbox/definir-senha`);
  await page.getByLabel('Nova senha').fill('curta'); await page.getByLabel('Repita a senha').fill('curta');
  await page.getByRole('button', { name: 'Salvar senha' }).click();
  await page.getByText('pelo menos 8 caracteres').waitFor({ timeout: 5000 }).catch(() => {});
  check('senha curta é recusada', await page.getByText('pelo menos 8 caracteres').isVisible());
  await page.getByLabel('Nova senha').fill('uma-senha-longa'); await page.getByLabel('Repita a senha').fill('outra-senha-longa');
  await page.getByRole('button', { name: 'Salvar senha' }).click();
  check('senhas diferentes são recusadas', await page.getByText('As senhas não são iguais.').isVisible());
  await page.getByLabel('Repita a senha').fill('uma-senha-longa');
  await page.getByRole('button', { name: 'Salvar senha' }).click();
  await page.waitForURL(/\/inbox$|\/inbox\?/, { timeout: 15000 });
  check('definir senha válida segue para o Inbox', true);
  await ctx.close();
}

// --- 6. Regressão do calendário (com o Inbox configurado ao lado)
{
  const { ctx, page, hosts, errors } = await open({ calendar: true });
  await page.goto(`${WITH}/clientes`);
  await page.getByText('Cliente do Calendário').first().waitFor({ timeout: 20000 });
  check('calendário: /clientes carrega dados do projeto do calendário', true);
  await page.goto(`${WITH}/`);
  await page.waitForSelector('text=Calendário', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  check('calendário: tela inicial abre', (await page.locator('main').count()) > 0);
  check('calendário nunca falou com o projeto do Inbox (3002)', ![...hosts].some((h) => h.startsWith('3002')), [...hosts].join());
  check('calendário sem erros de página', errors.length === 0, errors.join(' | '));
  await page.screenshot({ path: `${S}/iso-calendar.png` });
  await ctx.close();
}
{
  const { ctx, page } = await open();
  await page.goto(`${WITH}/`); await page.waitForURL(/\/auth/, { timeout: 15000 });
  await page.getByRole('heading', { name: 'Entrar' }).waitFor({ timeout: 15000 }).catch(() => {});
  check('calendário: sem sessão continua indo para /auth (login do calendário)', await page.getByRole('heading', { name: 'Entrar' }).isVisible());
  await ctx.close();
}

// --- 7. Inbox sem configuração: não quebra o calendário
{
  const { ctx, page, hosts, errors } = await open({ calendar: true });
  await page.goto(`${WITHOUT}/inbox`);
  await page.getByText('Inbox não configurado').waitFor({ timeout: 15000 });
  check('sem variáveis: /inbox mostra "Inbox não configurado"', true);
  check('lista os nomes das duas variáveis que faltam', (await page.getByText('VITE_INBOX_SUPABASE_URL').count()) > 0 && (await page.getByText('VITE_INBOX_SUPABASE_PUBLISHABLE_KEY').count()) > 0);
  const body = await page.locator('body').innerText();
  check('a tela não revela valores de configuração do calendário', !/sb_publishable|127\.0\.0\.1:3003/.test(body));
  await page.screenshot({ path: `${S}/iso-noconfig.png` });
  await page.goto(`${WITHOUT}/inbox/entrar`);
  await page.getByText('Inbox não configurado').waitFor({ timeout: 15000 }).catch(() => {});
  check('sem variáveis: o login do Inbox também fica bloqueado', await page.getByText('Inbox não configurado').isVisible());
  await page.goto(`${WITHOUT}/clientes`);
  await page.getByText('Cliente do Calendário').first().waitFor({ timeout: 20000 });
  check('sem variáveis do Inbox: calendário continua funcionando', true);
  check('sem variáveis do Inbox: nenhuma requisição ao projeto do Inbox', ![...hosts].some((h) => h.startsWith('3002')));
  check('sem variáveis do Inbox: sem erros de página', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
{
  const { ctx, page } = await open();
  await page.goto(`${WITHOUT}/auth`);
  check('sem variáveis do Inbox: login do calendário abre normalmente', await page.getByRole('heading', { name: 'Entrar' }).isVisible());
  await ctx.close();
}

await browser.close();
const fails = results.filter((r) => !r).length;
console.log(`\n${results.length - fails}/${results.length} passaram`);
process.exit(fails ? 1 : 0);
