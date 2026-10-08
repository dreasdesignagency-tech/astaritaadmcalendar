// Interface das Fases 3 e 4 (funil, respostas rápidas, notas, lembretes, campo de mensagem e envio) na pilha local (stack.sh up).
// Meta e Storage SIMULADOS. O Realtime não existe neste ambiente: a tela se atualiza pela consulta de contingência (a cada 15 s).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const S = process.argv[2] ?? '.';
const BASE = 'http://127.0.0.1:5199', NOWA = 'http://127.0.0.1:5197', GRAPH = 'http://127.0.0.1:3004';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456', APP_SECRET = 'segredo-do-app-teste';
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const sql = (q) => execSync(`su postgres -c "psql -d inboxe2e -tAq"`, { input: q }).toString().trim();
const fx = (n) => readFileSync(`tests/fixtures/whatsapp/${n}.json`, 'utf8');
const hook = (raw) => fetch(`${BASE}/api/whatsapp/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': `sha256=${createHmac('sha256', APP_SECRET).update(raw).digest('hex')}` }, body: raw });
const graphPosts = async () => (await (await fetch(`${GRAPH}/__requests`)).json()).filter((r) => r.method === 'POST' && /\/messages$/.test(r.path));
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(300); } return fn(); };

await fetch(`${GRAPH}/__reset`);
sql(`truncate contacts, tags, webhook_events, quick_replies, reminders, internal_notes cascade; update profiles set active=true;`);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function open(base, sub = A, email = 'andreas@t', vp = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport: vp });
  const s = { access_token: jwt(sub, email), refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: { id: sub, aud: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ['astarita-inbox-auth', JSON.stringify(s)]);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}
const pick = async (page, label, option) => { await page.getByRole('combobox', { name: label }).click(); await page.getByRole('option', { name: option, exact: true }).click(); };

// ---------- Semente real: mensagem de cliente pelo webhook assinado (cria contato, conversa, oportunidade)
await hook(fx('text'));
const conv = sql(`select id from conversations`);
const cid = sql(`select id from contacts`);
sql(`insert into contacts(name,phone,company) values ('Cliente Dois','5521911112222','Padaria Dois'),('Cliente Três','5531933334444',null);`);

const { ctx, page, errors } = await open(BASE);

// ================================================================ FUNIL
await page.goto(`${BASE}/inbox/funil`);
await page.getByText('Maria Souza').first().waitFor({ timeout: 20000 });
const colOf = (name) => page.locator(`section[role=listitem][aria-label^="${name},"]`);
check('funil: lead criado pelo webhook aparece em "Novo lead"', (await colOf('Novo lead').getByText('Maria Souza').count()) === 1);
check('funil: as 7 etapas são exibidas com contagem', (await page.locator('section[role=listitem]').count()) === 7);

await page.getByRole('button', { name: 'Adicionar ao funil' }).click();
await page.getByPlaceholder('Buscar por nome, empresa ou telefone').fill('Dois');
await page.getByRole('button', { name: /Cliente Dois/ }).click();
await pick(page, 'Etapa inicial', 'Em conversa');
await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
await page.getByText('Contato adicionado ao funil.').waitFor({ timeout: 10000 });
check('funil: contato adicionado na etapa escolhida (persistido)', sql(`select s.slug from opportunities o join pipeline_stages s on s.id=o.stage_id join contacts c on c.id=o.contact_id where c.name='Cliente Dois'`) === 'em-conversa');

// arrastar e soltar de verdade
await colOf('Novo lead').getByText('Maria Souza').dragTo(colOf('Reunião marcada'));
await until(async () => sql(`select s.slug from opportunities o join pipeline_stages s on s.id=o.stage_id join contacts c on c.id=o.contact_id where c.name='Maria Souza'`) === 'reuniao-marcada', 8000);
check('funil: arrastar o cartão muda a etapa e PERSISTE no banco', sql(`select s.slug from opportunities o join pipeline_stages s on s.id=o.stage_id join contacts c on c.id=o.contact_id where c.name='Maria Souza'`) === 'reuniao-marcada');
await page.reload();
await page.getByText('Maria Souza').first().waitFor({ timeout: 20000 });
check('funil: depois de recarregar, o cartão continua na nova etapa', (await colOf('Reunião marcada').getByText('Maria Souza').count()) === 1);

// reordenar dentro da coluna: arrasta "Cliente Dois" (Em conversa) para a coluna "Reunião marcada", antes de Maria
await colOf('Em conversa').getByText('Cliente Dois').dragTo(colOf('Reunião marcada').getByText('Maria Souza'));
await until(async () => sql(`select s.slug from opportunities o join pipeline_stages s on s.id=o.stage_id join contacts c on c.id=o.contact_id where c.name='Cliente Dois'`) === 'reuniao-marcada', 8000);
const order = sql(`select string_agg(c.name, ',' order by o.position) from opportunities o join contacts c on c.id=o.contact_id where o.stage_id=(select id from pipeline_stages where slug='reuniao-marcada')`);
check('funil: soltar sobre um cartão insere ANTES dele', order === 'Cliente Dois,Maria Souza', order);

// detalhes do cartão: mover pelo seletor (celular não arrasta), responsável, remover
await colOf('Reunião marcada').getByText('Maria Souza').click();
await pick(page, 'Etapa comercial', 'Proposta enviada');
await page.getByText('Etapa atualizada.').waitFor({ timeout: 10000 });
check('funil: mover pelo seletor do cartão (alternativa ao arrastar) persiste', sql(`select s.slug from opportunities o join pipeline_stages s on s.id=o.stage_id join contacts c on c.id=o.contact_id where c.name='Maria Souza'`) === 'proposta-enviada');
await colOf('Proposta enviada').getByText('Maria Souza').click();
await pick(page, 'Responsável do cartão', 'Juline');
await page.getByText('Responsável atualizado.').waitFor({ timeout: 10000 });
check('funil: responsável do cartão persiste', sql(`select o.assigned_to from opportunities o join contacts c on c.id=o.contact_id where c.name='Maria Souza'`) === B);
await page.getByPlaceholder('Buscar no funil').fill('Dois');
check('funil: busca filtra os cartões', (await page.getByText('Maria Souza').count()) === 0 && (await page.getByText('Cliente Dois').count()) >= 1);
await page.getByPlaceholder('Buscar no funil').fill('');
await colOf('Reunião marcada').getByText('Cliente Dois').click();
await page.getByRole('button', { name: 'Remover do funil' }).click();
await page.getByRole('alertdialog').getByRole('button', { name: 'Remover' }).click();
await page.getByText('Removido do funil.').waitFor({ timeout: 10000 });
check('funil: remover do funil mantém o contato', sql(`select count(*) from opportunities o join contacts c on c.id=o.contact_id where c.name='Cliente Dois'`) === '0' && sql(`select count(*) from contacts where name='Cliente Dois'`) === '1');
await page.screenshot({ path: `${S}/p34-funil.png` });

// ================================================================ RESPOSTAS RÁPIDAS
await page.goto(`${BASE}/inbox/respostas`);
await page.getByText('Nenhuma resposta cadastrada').waitFor({ timeout: 15000 });
check('respostas: estado vazio exibido', true);
const createReply = async (cat, title, body) => {
  await page.getByRole('button', { name: 'Nova resposta' }).first().click();
  await pick(page, 'Categoria da resposta', cat);
  await page.getByLabel('Título').fill(title);
  await page.getByLabel('Texto', { exact: true }).fill(body);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText(/Resposta (criada|atualizada)\./).waitFor({ timeout: 10000 });
};
await createReply('Primeiro contato', 'Boas-vindas', 'Oi, {nome}! Aqui é a Astarita. Como posso ajudar?');
await createReply('Google Meet', 'Convite Meet', 'Perfeito! Podemos marcar um Google Meet pra conversar com mais calma.');
check('respostas: criadas e agrupadas por categoria', sql(`select count(*) from quick_replies`) === '2' && (await page.getByText('Primeiro contato', { exact: true }).count()) >= 1 && (await page.getByText('Google Meet', { exact: true }).count()) >= 1);
await page.getByRole('button', { name: 'Editar Convite Meet' }).click();
await page.getByLabel('Título').fill('Convite Meet (novo)');
await page.getByRole('button', { name: 'Salvar' }).click();
await page.getByText('Resposta atualizada.').waitFor({ timeout: 10000 });
check('respostas: edição persiste', sql(`select count(*) from quick_replies where title='Convite Meet (novo)'`) === '1');
await page.getByPlaceholder('Buscar respostas').fill('boas');
check('respostas: busca filtra', (await page.getByText('Boas-vindas').count()) === 1 && (await page.getByText('Convite Meet (novo)').count()) === 0);
await page.getByPlaceholder('Buscar respostas').fill('');
await page.getByRole('button', { name: 'Excluir Convite Meet (novo)' }).click();
await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir' }).click();
await page.getByText('Resposta excluída.').waitFor({ timeout: 10000 });
check('respostas: excluir pede confirmação e remove', sql(`select count(*) from quick_replies`) === '1');

// ================================================================ CAMPO DE MENSAGEM + ENVIO
await page.goto(`${BASE}/inbox?c=${conv}`);
await page.getByText('Oi! Vocês fazem social media?').first().waitFor({ timeout: 20000 });
const box = page.getByLabel('Mensagem', { exact: true });
await page.getByText('Janela de resposta aberta').waitFor({ timeout: 15000 });
check('campo de mensagem: janela de 24h aberta e WhatsApp conectado liberam o envio', await box.isEnabled());
check('cabeçalho mostra o WhatsApp CONFIRMADO pela Meta (número)', (await page.getByText('WhatsApp conectado (+1 555 000 1111)').count()) >= 1);

await page.getByRole('button', { name: 'Respostas rápidas' }).click();
await page.getByRole('button', { name: /Boas-vindas/ }).click();
check('resposta rápida preenche o campo com {nome} trocado e NÃO envia', (await box.inputValue()) === 'Oi, Maria! Aqui é a Astarita. Como posso ajudar?' && (await graphPosts()).length === 0 && sql(`select count(*) from messages where direction='out'`) === '0', await box.inputValue());
await box.fill('Oi, Maria! Aqui é a Astarita. Conta pra gente o que você precisa?');
await page.getByRole('button', { name: 'Enviar', exact: true }).click();
await until(async () => sql(`select status from messages where direction='out' and body like 'Oi, Maria! Aqui%'`) === 'sent');
check('envio pela tela: a Meta recebeu e a mensagem ficou "sent" só depois da confirmação', sql(`select status||'|'||wa_message_id from messages where direction='out' and body like 'Oi, Maria! Aqui%'`) === 'sent|wamid.SENT1' && (await graphPosts()).length === 1);
check('campo é limpo após o envio e a conversa passa a "em atendimento" com Andreas', (await box.inputValue()) === '' && sql(`select status||'|'||assigned_to from conversations`) === `in_progress|${A}`);
await page.getByLabel('Enviada').first().waitFor({ timeout: 15000 }).catch(() => {});
check('a bolha mostra o indicador "Enviada"', (await page.getByLabel('Enviada').count()) >= 1);

// status da Meta chegando pelo webhook aparece na tela (consulta de contingência de 15 s neste ambiente)
const st = (status) => JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: 'W', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', statuses: [{ id: 'wamid.SENT1', status, timestamp: '1791500900', recipient_id: '5511999998888' }] } }] }] });
await hook(st('delivered')); await hook(st('read'));
check('status "lida" da Meta aparece na bolha sem recarregar', await page.getByLabel('Lida').first().waitFor({ timeout: 25000 }).then(() => true).catch(() => false));

// responder a uma mensagem
const inbound = page.locator('li', { hasText: 'Oi! Vocês fazem social media?' }).first();
await inbound.hover();
await inbound.getByRole('button', { name: 'Responder esta mensagem' }).click();
check('"Responder" mostra a mensagem citada acima do campo', (await page.getByText(/Respondendo:/).count()) === 1);
await box.fill('Sim, fazemos!');
await page.getByRole('button', { name: 'Enviar', exact: true }).click();
await until(async () => (await graphPosts()).length === 2);
const rp = (await graphPosts()).at(-1).body;
check('a resposta envia o contexto da mensagem original à Meta', rp.context?.message_id === 'wamid.TEXT1' && rp.text.body === 'Sim, fazemos!', JSON.stringify(rp));
check('a bolha mostra a citação', (await page.locator('li', { hasText: 'Sim, fazemos!' }).getByText('Oi! Vocês fazem social media?').count()) >= 1);

// falha da Meta + tentar de novo
await box.fill('FORCE_RATE teste de limite');
await page.getByRole('button', { name: 'Enviar', exact: true }).click();
const failLi = page.locator('li', { hasText: 'FORCE_RATE teste de limite' });
await failLi.getByText(/Não enviada: Limite de envio/).waitFor({ timeout: 15000 });
check('falha da Meta aparece na bolha com o motivo e botão "Tentar de novo"', (await failLi.getByRole('button', { name: /Tentar de novo/ }).count()) === 1);
sql(`update messages set body='Agora com o limite liberado' where body like 'FORCE_RATE%'`);
await failLi.getByRole('button', { name: /Tentar de novo/ }).click().catch(() => {});
await until(async () => sql(`select status from messages where body='Agora com o limite liberado'`) === 'sent', 15000);
check('"Tentar de novo" reenvia e a mensagem vira "sent"', sql(`select status from messages where body='Agora com o limite liberado'`) === 'sent');

// mensagem pendente sem confirmação (ex.: rede caiu antes de chamar o servidor)
sql(`insert into messages(conversation_id,direction,type,body,status,sent_by,client_token,created_at) values ('${conv}','out','text','Ficou pendente','pending','${A}',gen_random_uuid(), now() - interval '2 minutes')`);
const stuckLi = page.locator('li', { hasText: 'Ficou pendente' });
await stuckLi.getByText('Sem confirmação de envio.').waitFor({ timeout: 25000 });
await stuckLi.getByRole('button', { name: /Tentar de novo/ }).click();
await until(async () => sql(`select status from messages where body='Ficou pendente'`) === 'sent', 15000);
check('pendente sem confirmação oferece "Tentar de novo" e envia', sql(`select status from messages where body='Ficou pendente'`) === 'sent');

// janela de 24h encerrada
sql(`update conversations set last_inbound_at = now() - interval '25 hours'`);
await page.getByText('A janela de 24 horas desta conversa acabou').waitFor({ timeout: 25000 });
check('janela encerrada: campo bloqueado e aviso explica a regra da Meta', await box.isDisabled());
await page.getByRole('button', { name: 'Enviar modelo aprovado' }).first().click();
await page.getByLabel('Nome do modelo').fill('retorno_contato');
await page.getByLabel(/Variáveis do corpo/).fill('Maria | segunda às 15h');
await page.getByRole('button', { name: 'Enviar modelo', exact: true }).click();
await page.getByText('Modelo enviado à Meta.').waitFor({ timeout: 15000 });
const tb = (await graphPosts()).at(-1).body;
check('fora da janela, o modelo aprovado é enviado com as variáveis', tb.type === 'template' && tb.template.name === 'retorno_contato' && tb.template.components[0].parameters.length === 2, JSON.stringify(tb));
await page.screenshot({ path: `${S}/p34-janela.png` });
sql(`update conversations set last_inbound_at = now()`);

// ================================================================ NOTAS e LEMBRETES
await page.goto(`${BASE}/inbox?c=${conv}`);
await page.getByLabel('Nova observação').fill('Prefere áudio e fecha em novembro');
await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
await page.getByText('Prefere áudio e fecha em novembro').waitFor({ timeout: 10000 });
check('observação interna criada com o autor (Andreas)', sql(`select created_by from internal_notes`) === A && (await page.getByText(/Andreas · /).count()) >= 1);
await page.getByRole('button', { name: 'Apagar observação' }).click();
await until(async () => sql(`select count(*) from internal_notes`) === '0', 8000);
check('autor apaga a própria observação', sql(`select count(*) from internal_notes`) === '0');

await page.getByRole('button', { name: 'Novo lembrete' }).click();
await page.getByLabel('Descrição do lembrete').fill('Retornar sobre a proposta');
await page.getByRole('button', { name: 'Salvar lembrete' }).click();
await page.getByText('Lembrete criado.').waitFor({ timeout: 10000 });
check('lembrete criado para o contato, com responsável', sql(`select status||'|'||assigned_to from reminders`) === `pending|${A}`);
sql(`insert into reminders(contact_id,description,due_at,assigned_to,status) values ('${cid}','Confirmar reunião',now() - interval '1 hour','${A}','pending')`);
await page.getByLabel(/Lembretes pendentes/).first().waitFor({ timeout: 20000 });
await until(async () => (await page.getByLabel(/Lembretes pendentes, 1 atrasados ou para hoje/).count()) === 1, 25000);
check('sino do cabeçalho conta o lembrete atrasado', (await page.getByLabel(/Lembretes pendentes, 1 atrasados ou para hoje/).count()) === 1);
await page.getByLabel(/Lembretes pendentes/).first().click();
check('popover separa "Atrasados" e "Próximos"', (await page.getByText('Atrasados', { exact: true }).count()) === 1 && (await page.getByText('Confirmar reunião').count()) >= 1);
await page.getByRole('button', { name: 'Concluir lembrete' }).first().click();
await until(async () => sql(`select count(*) from reminders where status='done'`) === '1', 8000);
check('concluir pelo popover grava no banco', sql(`select count(*) from reminders where status='done'`) === '1');
await page.keyboard.press('Escape');

// etapa comercial pelo painel de detalhes
await pick(page, 'Etapa comercial do contato', 'Negociação');
await page.getByText('Etapa comercial atualizada.').waitFor({ timeout: 10000 });
check('etapa comercial no painel move o cartão no funil', sql(`select s.slug from opportunities o join pipeline_stages s on s.id=o.stage_id where o.contact_id='${cid}'`) === 'negociacao');

// ================================================================ servidor SEM WhatsApp configurado (porta 5197)
const o2 = await open(NOWA);
await o2.page.goto(`${NOWA}/inbox?c=${conv}`);
await o2.page.getByText('Verificando', { exact: false }).first().waitFor({ timeout: 5000 }).catch(() => {});
await o2.page.getByText(/WhatsApp não conectado\. Você pode preparar/).waitFor({ timeout: 20000 });
await o2.page.getByLabel('Mensagem', { exact: true }).fill('não deve sair');
check('sem WhatsApp configurado: aviso claro e botão Enviar desabilitado', await o2.page.getByRole('button', { name: 'Enviar', exact: true }).isDisabled());
check('sem WhatsApp configurado: cabeçalho diz "WhatsApp não conectado"', (await o2.page.getByText('WhatsApp não conectado', { exact: true }).count()) >= 1);
await o2.ctx.close();

check('nenhum erro de página durante toda a navegação', errors.length === 0, errors.join(' | '));
await ctx.close();

// ================================================================ celular
{
  const m = await open(BASE, A, 'andreas@t', { width: 390, height: 800 });
  await m.page.goto(`${BASE}/inbox?c=${conv}`);
  await m.page.getByText('Oi! Vocês fazem social media?').first().waitFor({ timeout: 20000 });
  await m.page.screenshot({ path: `${S}/p34-mobile-chat.png` });
  await m.page.goto(`${BASE}/inbox/funil`);
  await m.page.getByText('Maria Souza').first().waitFor({ timeout: 20000 });
  await m.page.screenshot({ path: `${S}/p34-mobile-funil.png` });
  check('celular: funil rola na horizontal sem estourar a página', await m.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await m.ctx.close();
}
await browser.close();
const fails = results.filter((x) => !x).length;
console.log(`\n${results.length - fails}/${results.length} passaram`);
process.exit(fails ? 1 : 0);
