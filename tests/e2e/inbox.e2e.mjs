import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';
const S = process.argv[2];
const BASE = 'http://127.0.0.1:5199';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456';
const A = '00000000-0000-0000-0000-00000000000a', J = '00000000-0000-0000-0000-00000000000b', X = '00000000-0000-0000-0000-00000000000c';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const sql = (q) => execSync(`su postgres -c "psql -d inboxe2e -tAq"`, { input: q }).toString().trim();
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };

async function session(browser, sub, email, vp = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport: vp });
  const token = jwt(sub, email);
  const s = { access_token: token, refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: { id: sub, aud: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ['astarita-inbox-auth', JSON.stringify(s)]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  return { ctx, page };
}
const pick = async (page, label, option) => { await page.getByRole('combobox', { name: label }).click(); await page.getByRole('option', { name: option, exact: true }).click(); };

sql(`truncate contacts, tags, webhook_events, quick_replies, reminders, internal_notes, ai_suggestions cascade; update profiles set active=true;`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

// 1. Sem perfil: acesso restrito
{
  const { ctx, page } = await session(browser, X, 'intruso@t');
  await page.goto(`${BASE}/inbox`); await page.waitForSelector('text=Acesso restrito', { timeout: 15000 }).catch(() => {});
  check('conta sem perfil vê "Acesso restrito"', await page.getByText('Acesso restrito').isVisible());
  await ctx.close();
}

const { ctx, page } = await session(browser, A, 'andreas@t');
await page.goto(`${BASE}/inbox/contatos`);
await page.waitForSelector('text=Sem contatos ainda', { timeout: 15000 });
check('estado "sem contatos" vindo do banco', true);

// 2. Criar contato
const createContact = async (name, phone, extra = {}) => {
  await page.getByRole('button', { name: 'Novo contato' }).first().click();
  await page.getByLabel('Nome *').fill(name);
  await page.getByLabel('Telefone (WhatsApp) *').fill(phone);
  if (extra.company) await page.getByLabel('Empresa').fill(extra.company);
  if (extra.ig) await page.getByLabel('Instagram').fill(extra.ig);
  if (extra.tags) await page.getByLabel('Etiquetas').fill(extra.tags);
  if (extra.notes) await page.getByLabel('Anotação fixa do contato').fill(extra.notes);
  if (extra.category) await pick(page, 'Categoria', extra.category);
  if (extra.owner) await pick(page, 'Responsável', extra.owner);
  await page.getByRole('button', { name: 'Salvar' }).click();
};
await createContact('Maria Souza', '(11) 99999-8888', { company: 'Clínica Dra. Maria', ig: 'https://instagram.com/dramaria/', tags: 'Social, Prioridade', notes: 'Prefere áudio' });
await page.waitForSelector('text=Contato criado.', { timeout: 10000 }).catch(() => {});
await page.waitForSelector('li:has-text("Maria Souza")');
let row = sql(`select phone||'|'||coalesce(company,'')||'|'||coalesce(instagram,'')||'|'||category from contacts where name='Maria Souza'`);
check('contato salvo normalizado no banco', row === '5511999998888|Clínica Dra. Maria|@dramaria|lead', row);
check('etiquetas criadas e vinculadas', sql(`select string_agg(t.name,',' order by t.name) from contact_tags ct join tags t on t.id=ct.tag_id`) === 'Prioridade,Social');
check('telefone formatado na lista', await page.getByText('+55 (11) 99999-8888').isVisible());

// 3. Duplicados (inclusive nono dígito ausente)
await createContact('Outra Maria', '11 9999-8888');
await page.waitForSelector('[role=alert]', { timeout: 10000 }).catch(() => {});
const alertText = await page.getByRole('alert').textContent().catch(() => '');
check('duplicado (sem nono dígito) é barrado com mensagem clara', /já pertence a Maria Souza/.test(alertText ?? ''), alertText);
check('nada foi gravado no duplicado', sql(`select count(*) from contacts`) === '1');
await page.getByLabel('Telefone (WhatsApp) *').fill('abc');
await page.getByRole('button', { name: 'Salvar' }).click();
check('telefone inválido é barrado', /Telefone inválido/.test((await page.getByRole('alert').textContent()) ?? ''));
await page.getByRole('button', { name: 'Cancelar' }).click();

// segundo contato válido
await createContact('Vion Restaurante', '21 98888-7777', { category: 'Cliente', owner: 'Juline', tags: 'Social' });
await page.waitForSelector('li:has-text("Vion Restaurante")');

// 4. Busca e filtros
await page.getByPlaceholder('Buscar contatos').fill('maria');
check('busca por nome', (await page.locator('li:has-text("Maria Souza")').count()) === 1 && (await page.locator('li:has-text("Vion")').count()) === 0);
await page.getByPlaceholder('Buscar contatos').fill('88777');
check('busca por parte do telefone', (await page.locator('li:has-text("Vion")').count()) === 1 && (await page.locator('li:has-text("Maria Souza")').count()) === 0);
await page.getByPlaceholder('Buscar contatos').fill('zzzz');
check('busca sem resultado mostra estado próprio', await page.getByText('Sem resultados').isVisible());
await page.getByPlaceholder('Buscar contatos').fill('');
await page.getByRole('button', { name: 'Cliente', exact: true }).click();
check('filtro por categoria', (await page.locator('li:has-text("Vion")').count()) === 1 && (await page.locator('li:has-text("Maria Souza")').count()) === 0);
await page.getByRole('button', { name: 'Todos', exact: true }).click();
await pick(page, 'Filtrar por responsável', 'Juline');
check('filtro por responsável', (await page.locator('li:has-text("Vion")').count()) === 1 && (await page.locator('li:has-text("Maria Souza")').count()) === 0);
await pick(page, 'Filtrar por responsável', 'Sem responsável');
check('filtro "sem responsável"', (await page.locator('li:has-text("Maria Souza")').count()) === 1 && (await page.locator('li:has-text("Vion")').count()) === 0);
await pick(page, 'Filtrar por responsável', 'Todos os responsáveis');
await pick(page, 'Filtrar por etiqueta', 'Prioridade');
check('filtro por etiqueta', (await page.locator('li:has-text("Maria Souza")').count()) === 1 && (await page.locator('li:has-text("Vion")').count()) === 0);
await pick(page, 'Filtrar por etiqueta', 'Todas as etiquetas');
await page.screenshot({ path: `${S}/e2e-contacts.png` });

// 5. Editar (muda empresa, remove etiqueta Prioridade)
await page.getByRole('button', { name: 'Editar Maria Souza' }).click();
check('edição abre com telefone formatado', (await page.getByLabel('Telefone (WhatsApp) *').inputValue()) === '+55 (11) 99999-8888');
await page.getByLabel('Empresa').fill('Clínica Maria');
await page.getByLabel('Etiquetas').fill('Social');
await page.getByRole('button', { name: 'Salvar' }).click();
await page.waitForSelector('text=Contato atualizado.', { timeout: 10000 }).catch(() => {});
check('edição persistiu (empresa e etiquetas)', sql(`select c.company||'|'||(select string_agg(t.name,',') from contact_tags ct join tags t on t.id=ct.tag_id where ct.contact_id=c.id) from contacts c where c.name='Maria Souza'`) === 'Clínica Maria|Social');
check('etiqueta removida do contato continua existindo', sql(`select count(*) from tags where name='Prioridade'`) === '1');

// 6. Iniciar conversa
await page.locator('li:has-text("Maria Souza")').getByRole('button', { name: 'Iniciar' }).click();
await page.waitForURL(/\/inbox\?c=/, { timeout: 10000 });
await page.waitForSelector('text=Nenhuma mensagem ainda');
check('conversa criada no banco e aberta', sql(`select count(*) from conversations`) === '1');
check('estado "sem mensagens"', true);

// 7. Mensagens chegam (simula o webhook da Fase 4: inserção como service role) e aparecem sem recarregar
const conv = sql(`select id from conversations`);
sql(`insert into messages(conversation_id,direction,type,body,status,created_at,wa_media_id) values
 ('${conv}','in','text','Oi! Vocês fazem gestão de social media?','received', now() - interval '2 minutes', null),
 ('${conv}','in','image',null,'received', now() - interval '1 minute', 'MEDIA_IMG_1');
 update conversations set last_message_at=now(), last_message_preview='Imagem', unread_count=2, last_inbound_at=now(), status='waiting' where id='${conv}';`);
const t0 = Date.now();
await page.waitForSelector('text=Oi! Vocês fazem gestão de social media?', { timeout: 25000 });
check(`mensagens novas apareceram sem recarregar (via ${Math.round((Date.now() - t0) / 1000)}s de espera)`, true);
const imgEl = page.getByAltText('Imagem recebida');
await imgEl.waitFor({ timeout: 15000 }).catch(() => {});
check('imagem recebida é exibida por URL assinada do Storage privado (caminho completo de mídia)', (await imgEl.count()) === 1 && /\/storage\/v1\/object\/sign\//.test((await imgEl.getAttribute('src')) ?? ''));
await page.waitForTimeout(1500);
check('abrir a conversa zerou não lidas no banco', sql(`select unread_count from conversations where id='${conv}'`) === '0', sql(`select unread_count from conversations`));
await page.screenshot({ path: `${S}/e2e-chat.png` });

// 8. Responsável, resolver, reabrir
await pick(page, 'Responsável pela conversa', 'Andreas');
await page.waitForSelector('text=Responsável atribuído.', { timeout: 10000 }).catch(() => {});
check('atribuir responsável move para "Em atendimento"', sql(`select assigned_to||'|'||status from conversations`) === `${A}|in_progress`, sql(`select assigned_to||'|'||status from conversations`));
await page.getByRole('button', { name: 'Resolver' }).click();
await page.waitForSelector('text=Conversa resolvida.', { timeout: 10000 }).catch(() => {});
check('resolver grava status resolved', sql(`select status from conversations`) === 'resolved');
check('aviso de conversa resolvida', await page.getByText('Conversa resolvida. Reabra para voltar ao atendimento.').isVisible());
await page.getByRole('button', { name: 'Reabrir' }).click();
await page.waitForSelector('text=Conversa reaberta.', { timeout: 10000 }).catch(() => {});
check('reabrir com responsável volta para in_progress', sql(`select status from conversations`) === 'in_progress');

// 9. Conflito: outra pessoa mexe antes do clique
sql(`update conversations set assigned_to='${J}' where id='${conv}'`);
await page.getByRole('button', { name: 'Resolver' }).click();
await page.waitForSelector('text=foi alterada por outra pessoa', { timeout: 10000 }).catch(() => {});
check('conflito de edição é detectado e não sobrescreve', (await page.getByText(/foi alterada por outra pessoa/).count()) > 0 && sql(`select assigned_to||'|'||status from conversations`) === `${J}|in_progress`, sql(`select assigned_to||'|'||status from conversations`));
await page.waitForTimeout(800);
check('tela recarregou o estado novo (responsável Juline)', (await page.getByRole('combobox', { name: 'Responsável pela conversa' }).textContent()).includes('Juline'));

// 10. Filtros da caixa de entrada
await page.getByRole('button', { name: 'Resolvidas' }).click();
check('filtro "Resolvidas" esconde conversa em atendimento', await page.getByText('Sem resultados').isVisible());
await page.getByRole('button', { name: 'Em atendimento' }).click();
check('filtro "Em atendimento" mostra a conversa', (await page.locator('section[aria-label=Conversas] li').count()) === 1);
await page.getByRole('button', { name: 'Todas', exact: true }).click();
await page.getByPlaceholder('Buscar conversas').fill('maria');
check('busca de conversas por nome', (await page.locator('section[aria-label=Conversas] li').count()) === 1);
await page.getByPlaceholder('Buscar conversas').fill('');

// 11. Editar contato a partir do painel de detalhes
await page.getByRole('button', { name: 'Editar', exact: true }).click();
await page.getByLabel('Anotação fixa do contato').fill('Cliente em potencial');
await page.getByRole('button', { name: 'Salvar' }).click();
await page.waitForSelector('text=Contato atualizado.', { timeout: 10000 }).catch(() => {});
check('edição pelo painel de detalhes persiste', sql(`select notes from contacts where name='Maria Souza'`) === 'Cliente em potencial');

// 12. Novo contato pela caixa de entrada já abre a conversa
await page.getByRole('button', { name: 'Novo contato' }).click();
await page.getByLabel('Nome *').fill('Lead Novo'); await page.getByLabel('Telefone (WhatsApp) *').fill('+1 415 555 2671');
await page.getByRole('button', { name: 'Salvar' }).click();
await page.waitForSelector('text=Lead Novo', { timeout: 10000 });
await page.waitForTimeout(800);
check('contato novo na caixa de entrada abre conversa', sql(`select count(*) from conversations`) === '2' && sql(`select phone from contacts where name='Lead Novo'`) === '14155552671');

// 13. Segunda pessoa (Juline) enxerga o mesmo
{
  const j = await session(browser, J, 'juline@t');
  await j.page.goto(`${BASE}/inbox`); await j.page.waitForSelector('text=Maria Souza', { timeout: 15000 });
  check('Juline vê as mesmas conversas', (await j.page.locator('section[aria-label=Conversas] li').count()) === 2);
  await j.ctx.close();
}
// 14. Perfil desativado perde acesso
sql(`update profiles set active=false where id='${J}'`);
{
  const j = await session(browser, J, 'juline@t');
  await j.page.goto(`${BASE}/inbox`); await j.page.waitForSelector('text=Acesso restrito', { timeout: 15000 }).catch(() => {});
  check('perfil desativado perde acesso', await j.page.getByText('Acesso restrito').isVisible());
  await j.ctx.close();
}
sql(`update profiles set active=true where id='${J}'`);
await ctx.close();

// 15. Celular
{
  const m = await session(browser, A, 'andreas@t', { width: 390, height: 800 });
  await m.page.goto(`${BASE}/inbox`); await m.page.waitForSelector('text=Maria Souza');
  await m.page.screenshot({ path: `${S}/e2e-mobile-list.png` });
  await m.page.locator('section[aria-label=Conversas] li', { hasText: 'Maria Souza' }).click();
  await m.page.waitForSelector('text=Oi! Vocês fazem');
  check('celular: chat em tela separada', !(await m.page.locator('section[aria-label=Conversas]').isVisible()));
  await m.page.getByRole('button', { name: 'Abrir detalhes do contato' }).click();
  await m.page.getByRole('dialog').getByText('Cliente em potencial').waitFor();
  await m.page.screenshot({ path: `${S}/e2e-mobile-details.png` });
  await m.ctx.close();
}
await browser.close();
const fails = results.filter((r) => !r).length;
console.log(`\n${results.length - fails}/${results.length} passaram`);
process.exit(fails ? 1 : 0);
