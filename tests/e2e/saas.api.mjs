// Multiempresa (SaaS): isolamento entre empresas pela API, painel do dono, equipe, limites, suspensão e webhook por empresa.
// Meta, IA e login são SIMULADOS. Valida o NOSSO lado: que uma empresa nunca vê, altera nem aciona nada de outra.
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const OK = 'http://127.0.0.1:5199', GW = 'http://127.0.0.1:3002', GRAPH = 'http://127.0.0.1:3004', AI = 'http://127.0.0.1:3005';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456';
const A = '00000000-0000-0000-0000-00000000000a', J = '00000000-0000-0000-0000-00000000000b';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const TA = jwt(A, 'andreas@t'), TJ = jwt(J, 'juline@t');
const sql = (q) => execSync(`su postgres -c "psql -d inboxe2e -tAq"`, { input: `do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', false); end $$;\n${q}` }).toString().trim();
import { shiftTs } from './fixture-time.mjs';
const fx = (n) => shiftTs(readFileSync(`tests/fixtures/whatsapp/${n}.json`, 'utf8'));
const results = [], seen = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };
async function call(path, { method = 'POST', token, body, raw, headers = {} } = {}) {
  const res = await fetch(OK + path, { method, headers: { ...(raw === undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text(); seen.push(text);
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}
const login = async (email, password) => { const r = await fetch(`${GW}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: 'sb_publishable_inbox' }, body: JSON.stringify({ email, password }) }); const j = await r.json(); return j.access_token ?? null; };
const rest = async (token, path, init = {}) => { const r = await fetch(`${GW}/rest/v1/${path}`, { ...init, headers: { apikey: 'sb_publishable_inbox', authorization: `Bearer ${token}`, 'content-type': 'application/json', prefer: 'return=representation', ...(init.headers || {}) } }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {} return { status: r.status, json: j, text: t }; };
const sign = (raw, secret) => `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
const graphLog = async () => (await (await fetch(`${GRAPH}/__requests`)).json());

// ---------------------------------------------------------------- estado inicial: só a Astarita, com WhatsApp configurado
sql(`truncate contacts, tags, webhook_events, quick_replies, reminders, internal_notes, ai_suggestions cascade; update profiles set active=true;
 delete from profiles where org_id in (select id from organizations where slug <> 'astarita'); delete from organizations where slug <> 'astarita'; delete from auth.users where email not in ('andreas@t','juline@t','intruso@t');`);
await fetch(`${GW}/__reset-users`);
await fetch(`${GRAPH}/__reset`); await fetch(`${AI}/__reset`);
const ORG_A = sql(`select id from organizations where slug='astarita'`);
const APP_A = 'astaritaappsecret0123456789abcdef', TOK_A = 'token-de-teste-da-meta';
let r = await call('/api/inbox/whatsapp', { token: TA, body: { phoneNumberId: '109876543210', version: 'v21.0', token: TOK_A, appSecret: APP_A } });
check('Astarita conectada (base para os testes)', r.status === 200 && r.json?.status?.whatsapp?.reachable === true, r.text);
r = await call('/api/inbox/whatsapp', { method: 'GET', token: TA });
const KEY_A = r.json.webhookKey, VER_A = r.json.verifyToken;

// ---------------------------------------------------------------- 1) painel do dono da plataforma
r = await call('/api/inbox/platform/orgs', { method: 'GET', token: TA });
check('dono da plataforma lista as empresas (só a Astarita por enquanto)', r.status === 200 && r.json.orgs.length === 1 && r.json.orgs[0].slug === 'astarita' && r.json.orgs[0].whatsappConnectedAt, r.text);
r = await call('/api/inbox/platform/orgs', { method: 'GET', token: TJ });
check('Juline (dona da Astarita, mas NÃO da plataforma) é barrada no painel (403)', r.status === 403);
r = await call('/api/inbox/platform/orgs', { method: 'GET' });
check('painel sem login: 401', r.status === 401);
r = await call('/api/inbox/platform/orgs', { token: TJ, body: { name: 'Golpe', slug: 'golpe', plan: 'business', ownerName: 'X', ownerEmail: 'x@golpe.test' } });
check('quem não é dono da plataforma não cria empresa (403)', r.status === 403 && sql(`select count(*) from organizations`) === '1');

r = await call('/api/inbox/platform/orgs', { token: TA, body: { name: 'Empresa B', slug: 'Slug Inválido!', plan: 'pro', ownerName: 'Dono B', ownerEmail: 'dono@b.test' } });
check('endereço inválido é recusado (400) e nada é criado', r.status === 400 && sql(`select count(*) from organizations`) === '1', r.text);
r = await call('/api/inbox/platform/orgs', { token: TA, body: { name: 'Empresa B', slug: 'empresa-b', plan: 'pro', ownerName: 'Dono B', ownerEmail: 'email-ruim' } });
check('e-mail inválido do dono: erro e a empresa NÃO fica criada pela metade', r.status === 400 && sql(`select count(*) from organizations where slug='empresa-b'`) === '0', r.text);
r = await call('/api/inbox/platform/orgs', { token: TA, body: { name: 'Empresa B', slug: 'empresa-b', plan: 'pro', ownerName: 'Dono B', ownerEmail: 'dono@b.test' } });
check('criar empresa B: devolve a senha temporária do dono UMA vez', r.status === 200 && r.json?.owner?.email === 'dono@b.test' && (r.json?.owner?.tempPassword ?? '').length >= 12, r.text);
const ORG_B = r.json.orgId, PASS_B = r.json.owner.tempPassword;
check('a empresa nasce com funil de 7 etapas, base de conhecimento VAZIA e credenciais em branco', sql(`select count(*) from pipeline_stages where org_id='${ORG_B}'`) === '7' && sql(`select count(*) from knowledge_base where org_id='${ORG_B}' and content <> ''`) === '1' && sql(`select count(*) from org_whatsapp where org_id='${ORG_B}' and phone_number_id is null and access_token_enc is null`) === '1');
check('limites do plano Pro aplicados (10 pessoas, 1000 sugestões)', sql(`select max_users||'|'||ai_monthly_limit from organizations where id='${ORG_B}'`) === '10|1000');
check('perfil do dono criado com acesso "owner", sem ser dono da plataforma', sql(`select access||'|'||is_platform_admin||'|'||org_id from profiles where id=(select id from auth.users where email='dono@b.test')`) === `owner|false|${ORG_B}`);
r = await call('/api/inbox/platform/orgs', { token: TA, body: { name: 'Outra B', slug: 'empresa-b', plan: 'starter', ownerName: 'Y', ownerEmail: 'y@b.test' } });
check('endereço repetido: 409', r.status === 409, r.text);
r = await call('/api/inbox/platform/orgs', { token: TA, body: { name: 'Outra', slug: 'outra-empresa', plan: 'starter', ownerName: 'Y', ownerEmail: 'dono@b.test' } });
check('e-mail que já tem conta: 409 e a empresa NÃO é criada', r.status === 409 && sql(`select count(*) from organizations where slug='outra-empresa'`) === '0', r.text);

const TB = await login('dono@b.test', PASS_B);
check('o dono da empresa B consegue entrar com a senha temporária', !!TB);
r = await call('/api/inbox/platform/orgs', { method: 'GET', token: TB });
check('o dono de B NÃO acessa o painel da plataforma (403)', r.status === 403);

// ---------------------------------------------------------------- 2) isolamento de leitura via API REST (RLS)
const ADMIN_ID_B = sql(`select id from auth.users where email='dono@b.test'`);
// dados da Astarita: contato + conversa pelo webhook assinado
const rawA = fx('text');
const hookA = (raw, sig) => call(`/api/whatsapp/webhook/${KEY_A}`, { raw, headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig ?? sign(raw, APP_A) } });
r = await hookA(rawA);
check('mensagem chega na Astarita pelo webhook dela', r.status === 200 && r.json.messages === 1, r.text);
const convA = sql(`select id from conversations where org_id='${ORG_A}'`), contactA = sql(`select id from contacts where org_id='${ORG_A}'`), msgA = sql(`select id from messages where org_id='${ORG_A}' limit 1`);
for (const t of ['contacts', 'conversations', 'messages', 'opportunities', 'webhook_events']) {
  r = await rest(TB, `${t}?select=id`);
  check(`B lê ${t} pela API REST: nenhuma linha da Astarita`, r.status === 200 && Array.isArray(r.json) && r.json.length === 0, r.text);
}
r = await rest(TB, 'knowledge_base?select=content');
check('B lê a base de conhecimento: só as 8 seções DELA, sem texto da Astarita', r.json.length === 8 && !r.text.includes('Astarita'), r.text.slice(0, 120));
r = await rest(TB, 'profiles?select=full_name');
check('B enxerga só o próprio perfil (nenhum da Astarita)', r.json.length === 1 && r.json[0].full_name === 'Dono B', r.text);
r = await rest(TB, 'organizations?select=slug');
check('B enxerga só a própria empresa', r.json.length === 1 && r.json[0].slug === 'empresa-b', r.text);
r = await rest(TB, 'org_whatsapp?select=*');
check('B não lê credenciais do WhatsApp pela API REST (nem as dele)', r.status === 401 || r.status === 403 || (Array.isArray(r.json) && r.json.length === 0) || r.json?.code === '42501', r.text);
r = await rest(TB, `contacts?id=eq.${contactA}`, { method: 'PATCH', body: JSON.stringify({ name: 'Hackeado' }) });
check('B não altera contato da Astarita', Array.isArray(r.json) && r.json.length === 0 && sql(`select name from contacts where id='${contactA}'`) !== 'Hackeado', r.text);
r = await rest(TB, `contacts?id=eq.${contactA}`, { method: 'DELETE' });
check('B não apaga contato da Astarita', sql(`select count(*) from contacts where id='${contactA}'`) === '1');
r = await rest(TB, 'messages', { method: 'POST', body: JSON.stringify({ conversation_id: convA, direction: 'out', type: 'text', body: 'invasão', status: 'pending', sent_by: ADMIN_ID_B, client_token: crypto.randomUUID() }) });
check('B não grava mensagem na conversa da Astarita', r.status >= 400 && sql(`select count(*) from messages where body='invasão'`) === '0', r.text);
r = await rest(TB, 'contacts', { method: 'POST', body: JSON.stringify({ name: 'Cliente do B', phone: '5511988880001' }) });
check('B cria contato próprio: a empresa é preenchida sozinha', r.status === 201 && r.json[0].org_id === ORG_B, r.text);
r = await rest(TB, 'contacts', { method: 'POST', body: JSON.stringify({ name: 'Mesmo telefone da Astarita', phone: sql(`select phone from contacts where id='${contactA}'`) }) });
check('o MESMO telefone pode existir em duas empresas (unicidade é por empresa)', r.status === 201, r.text);
r = await rest(TB, 'contacts', { method: 'POST', body: JSON.stringify({ name: 'Disfarce', phone: '5511988880002', org_id: ORG_A }) });
check('B não consegue criar contato "dizendo" que é da Astarita', r.status >= 400 && sql(`select count(*) from contacts where name='Disfarce'`) === '0', r.text);

// ---------------------------------------------------------------- 3) isolamento das rotas do servidor
const rImg = await hookA(fx('image'));
const imgA = sql(`select id from messages where wa_message_id='wamid.IMG1'`);
const gBefore = (await graphLog()).length;
r = await call('/api/inbox/media', { token: TB, body: { messageId: imgA } });
check('mídia de verdade: B não baixa o anexo da Astarita (404) e a Meta nem é consultada', rImg.status === 200 && r.status === 404 && (await graphLog()).length === gBefore && sql(`select media_path from messages where id='${imgA}'`) === '', r.text);
r = await call('/api/inbox/media', { token: TA, body: { messageId: imgA } });
check('a Astarita baixa o próprio anexo, guardado na pasta da empresa dela', r.status === 200 && sql(`select media_path from messages where id='${imgA}'`).startsWith(`${ORG_A}/`), r.text);
r = await call('/api/inbox/media', { token: TB, body: { messageId: msgA } });
check('mídia: B não acessa mensagem da Astarita (404, igual a "não existe")', r.status === 404, r.text);
r = await call('/api/inbox/ai', { token: TB, body: { conversationId: convA, kind: 'suggest' } });
check('IA: B não gera sugestão sobre conversa da Astarita (404)', r.status === 404 || r.json?.code === 'not_found' || r.json?.code === 'ai_not_configured', r.text);
const outA = await (async () => { const id = crypto.randomUUID(); sql(`insert into messages(id, org_id, conversation_id, direction, type, body, status, sent_by, client_token) values ('${id}', '${ORG_A}', '${convA}', 'out', 'text', 'da Astarita', 'pending', '${A}', gen_random_uuid())`); return id; })();
r = await call('/api/inbox/send', { token: TB, body: { messageId: outA } });
const posts0 = (await graphLog()).filter((x) => x.method === 'POST' && /\/messages$/.test(x.path)).length;
check('envio: B não dispara mensagem da Astarita (404) e a Meta não é chamada', r.status === 404 && posts0 === 0 && sql(`select status from messages where id='${outA}'`) === 'pending', `${r.status} ${r.text}`);
r = await call('/api/inbox/status', { method: 'GET', token: TB });
check('status de B: WhatsApp não configurado, sem dados da Astarita', r.status === 200 && r.json.status.whatsapp.configured === false && r.json.status.whatsapp.missing.length >= 3 && r.json.status.webhook.lastValidAt === null, r.text);

// ---------------------------------------------------------------- 4) WhatsApp da empresa B
r = await call('/api/inbox/whatsapp', { method: 'GET', token: TB });
const KEY_B = r.json.webhookKey;
check('cada empresa tem a SUA chave de webhook (diferentes) e o SEU verify token', /^[a-f0-9]{32}$/.test(KEY_B) && KEY_B !== KEY_A && r.json.hasToken === false);
r = await call('/api/inbox/whatsapp', { token: TB, body: { phoneNumberId: '109876543210', version: 'v21.0', token: 'token-da-empresa-b-0123456789', appSecret: 'empresabsecret0123456789abcdef01' } });
check('B não pode usar o número que já é da Astarita (409)', r.status === 409 && r.json?.code === 'phone_in_use', r.text);
const TOK_B = 'token-da-empresa-b-0123456789', APP_B = 'empresabsecret0123456789abcdef01';
r = await call('/api/inbox/whatsapp', { token: TB, body: { phoneNumberId: '209876543210', version: 'v21.0', token: TOK_B, appSecret: APP_B } });
check('B salva o próprio WhatsApp e a Meta confirma o número DELE (+1 555 000 2222)', r.status === 200 && r.json?.status?.whatsapp?.phone === '+1 555 000 2222' && r.json.status.whatsapp.verifiedName === 'Empresa B Teste', r.text);
r = await call('/api/inbox/status', { method: 'GET', token: TA });
check('status da Astarita continua sendo o dela (+1 555 000 1111)', r.json.status.whatsapp.phone === '+1 555 000 1111', r.text);
const gl = await graphLog();
check('cada empresa falou com a Meta usando o PRÓPRIO token', gl.some((x) => x.auth === 'ok') && gl.some((x) => x.auth === 'okB') && !gl.some((x) => x.auth === 'errado'));
r = await call('/api/inbox/whatsapp', { method: 'GET', token: TA });
check('a Astarita continua com a chave e o número dela intactos', r.json.webhookKey === KEY_A && r.json.phoneNumberId === '109876543210');
const VER_B = (await call('/api/inbox/whatsapp', { method: 'GET', token: TB })).json.verifyToken;

// ---------------------------------------------------------------- 5) webhook por empresa
const rawB = fx('text').replaceAll('109876543210', '209876543210').replace('wamid.TEXT1', 'wamid.B_TEXT1').replaceAll('5511999998888', '5511977771111').replaceAll('Maria Souza', 'Cliente do B').replaceAll('15550001111', '15550002222');
const hookB = (raw, sig, key = KEY_B) => call(`/api/whatsapp/webhook/${key}`, { raw, headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig ?? sign(raw, APP_B) } });
r = await call(`/api/whatsapp/webhook/${KEY_B}?hub.mode=subscribe&hub.verify_token=${VER_A}&hub.challenge=1`, { method: 'GET' });
check('verify token da Astarita NÃO vale no webhook de B (403)', r.status === 403);
r = await call(`/api/whatsapp/webhook/${KEY_B}?hub.mode=subscribe&hub.verify_token=${VER_B}&hub.challenge=777`, { method: 'GET' });
check('verify token de B vale no webhook de B', r.status === 200 && r.text === '777');
r = await hookB(rawB);
check('mensagem de B chega na empresa B', r.status === 200 && r.json.messages === 1, r.text);
check('o contato foi criado SÓ na empresa B', sql(`select org_id from contacts where phone='5511977771111'`) === ORG_B && sql(`select count(*) from contacts where phone='5511977771111'`) === '1');
check('conversa, mensagem e oportunidade de B caem no funil de B', sql(`select s.org_id from opportunities o join pipeline_stages s on s.id=o.stage_id join contacts c on c.id=o.contact_id where c.phone='5511977771111'`) === ORG_B);
r = await hookB(rawB, sign(rawB, APP_A));
check('assinatura com o App Secret da Astarita no webhook de B: recusada (401)', r.status === 401);
r = await hookA(rawB, sign(rawB, APP_B));
check('assinatura com o App Secret de B no webhook da Astarita: recusada (401)', r.status === 401);
r = await hookA(rawB);
check('evento do número de B enviado ao webhook da Astarita (assinado com o segredo dela): ignorado, nada gravado', r.status === 200 && r.json.ignored && sql(`select count(*) from contacts where org_id='${ORG_A}' and phone='5511977771111'`) === '0', r.text);
r = await hookB(fx('text'), sign(fx('text'), APP_B));
check('evento do número da Astarita no webhook de B: ignorado', r.status === 200 && r.json.ignored && sql(`select count(*) from messages where org_id='${ORG_B}' and wa_message_id='wamid.TEXT1'`) === '0', r.text);
r = await call(`/api/whatsapp/webhook/${'1'.repeat(32)}`, { raw: rawB, headers: { 'x-hub-signature-256': sign(rawB, APP_B) } });
check('chave de empresa desconhecida: 404, sem pista sobre quais existem', r.status === 404);
const stB = await call('/api/inbox/status', { method: 'GET', token: TB });
const stA = await call('/api/inbox/status', { method: 'GET', token: TA });
check('atividade do webhook é separada: B tem o dele; assinaturas recusadas de B não aparecem na Astarita', stB.json.status.webhook.lastValidAt && stB.json.status.webhook.invalidLast24h >= 1 && stA.json.status.webhook.invalidLast24h >= 1, JSON.stringify([stB.json.status.webhook, stA.json.status.webhook]));
check('contadores de recusa por empresa batem com o banco', Number(stB.json.status.webhook.invalidLast24h) === Number(sql(`select count(*) from webhook_events where org_id='${ORG_B}' and not signature_valid`)));

// B envia uma mensagem de verdade (Meta simulada): usa o token e o número de B
const convB = sql(`select id from conversations where org_id='${ORG_B}'`);
const pend = await rest(TB, 'messages', { method: 'POST', body: JSON.stringify({ conversation_id: convB, direction: 'out', type: 'text', body: 'Olá do B!', status: 'pending', sent_by: ADMIN_ID_B, client_token: crypto.randomUUID() }) });
r = await call('/api/inbox/send', { token: TB, body: { messageId: pend.json[0].id } });
const post = (await graphLog()).filter((x) => x.method === 'POST' && /\/messages$/.test(x.path)).at(-1);
check('B envia: a Meta recebe no número de B com o token de B', r.status === 200 && post?.path.includes('/209876543210/messages') && post.auth === 'okB' && post.body.to === '5511977771111', `${r.status} ${JSON.stringify(post)}`);
check('a mensagem enviada pertence à empresa B', sql(`select org_id from messages where id='${pend.json[0].id}'`) === ORG_B);

// ---------------------------------------------------------------- 6) equipe e limites
r = await call('/api/inbox/team', { token: TB, body: { fullName: 'Atendente B', email: 'agente@b.test', access: 'agent' } });
check('dono de B cria um atendente; senha temporária devolvida uma vez', r.status === 200 && (r.json?.tempPassword ?? '').length >= 12, r.text);
const PASS_AG = r.json.tempPassword, AG_ID = r.json.userId;
check('o atendente pertence à empresa B com acesso "agent"', sql(`select org_id||'|'||access from profiles where id='${AG_ID}'`) === `${ORG_B}|agent`);
const TAG = await login('agente@b.test', PASS_AG);
check('o atendente entra com a senha temporária', !!TAG);
r = await call('/api/inbox/team', { token: TAG, body: { fullName: 'X', email: 'x@b.test', access: 'agent' } });
check('atendente NÃO cria pessoas (403)', r.status === 403);
r = await call('/api/inbox/whatsapp', { method: 'GET', token: TAG });
check('atendente NÃO lê nem altera a conexão do WhatsApp (403)', r.status === 403);
r = await call('/api/inbox/whatsapp', { token: TAG, body: { version: 'v22.0' } });
check('atendente não salva credenciais (403)', r.status === 403 && sql(`select api_version from org_whatsapp where org_id='${ORG_B}'`) === 'v21.0');
r = await call('/api/inbox/team', { token: TB, body: { fullName: 'Atendente B', email: 'agente@b.test', access: 'agent' } });
check('e-mail repetido: 409', r.status === 409, r.text);
r = await call('/api/inbox/team', { token: TB, body: { fullName: 'Admin B', email: 'admin@b.test', access: 'admin' } });
check('o dono cria um administrador', r.status === 200);
const PASS_AD = r.json.tempPassword, AD_ID = r.json.userId;
const TAD = await login('admin@b.test', PASS_AD);
r = await call('/api/inbox/team', { token: TAD, body: { fullName: 'Outro Admin', email: 'admin2@b.test', access: 'admin' } });
check('administrador NÃO cria outro administrador (só o dono) (403)', r.status === 403);
r = await call('/api/inbox/team', { token: TAD, body: { fullName: 'Mais um', email: 'mais@b.test', access: 'agent' } });
check('administrador cria atendentes', r.status === 200);
// limite do plano
await call('/api/inbox/platform/orgs', { method: 'PATCH', token: TA, body: { orgId: ORG_B, maxUsers: 4 } });
r = await call('/api/inbox/team', { token: TB, body: { fullName: 'Quinto', email: 'quinto@b.test', access: 'agent' } });
check('limite de pessoas do plano é respeitado (400 user_limit) e nada é criado', r.status === 400 && r.json?.code === 'user_limit' && sql(`select count(*) from auth.users where email='quinto@b.test'`) === '0', r.text);
r = await call('/api/inbox/team', { method: 'PATCH', token: TB, body: { userId: AG_ID, active: false } });
check('dono desativa o atendente', r.status === 200 && sql(`select active from profiles where id='${AG_ID}'`) === 'f');
r = await call('/api/inbox/status', { method: 'GET', token: TAG });
check('atendente desativado perde o acesso na hora (403), mesmo com o token antigo', r.status === 403, r.text);
r = await call('/api/inbox/team', { token: TB, body: { fullName: 'Quinto', email: 'quinto@b.test', access: 'agent' } });
check('depois de desativar alguém, abre vaga no plano', r.status === 200, r.text);
r = await call('/api/inbox/team', { method: 'PATCH', token: TB, body: { userId: ADMIN_ID_B, active: false } });
check('ninguém desativa o próprio acesso (400)', r.status === 400);
r = await call('/api/inbox/team', { method: 'PATCH', token: TB, body: { userId: A, active: false } });
check('B não desativa pessoas da Astarita (404)', r.status === 404 && sql(`select active from profiles where id='${A}'`) === 't');
r = await call('/api/inbox/team', { method: 'PATCH', token: TB, body: { userId: J, resetPassword: true } });
check('B não troca a senha de pessoas da Astarita (404)', r.status === 404);
r = await call('/api/inbox/team', { method: 'PATCH', token: TAD, body: { userId: ADMIN_ID_B, resetPassword: true } });
check('administrador não mexe no acesso do dono (403)', r.status === 403);
r = await call('/api/inbox/team', { method: 'PATCH', token: TB, body: { userId: AD_ID, resetPassword: true } });
const NEWPASS = r.json?.tempPassword;
check('dono gera nova senha temporária para o administrador', r.status === 200 && NEWPASS && !!(await login('admin@b.test', NEWPASS)) && !(await login('admin@b.test', PASS_AD)), r.text);
r = await call('/api/inbox/team', { method: 'PATCH', token: TB, body: { userId: AD_ID, access: 'agent' } });
check('só o dono muda nível de acesso e consegue rebaixar o administrador', r.status === 200 && sql(`select access from profiles where id='${AD_ID}'`) === 'agent');
r = await call('/api/inbox/team', { method: 'PATCH', token: TB, body: { userId: A, access: 'agent' } });
check('mudar nível de pessoa de outra empresa: 404', r.status === 404);

// ---------------------------------------------------------------- 7) IA: conhecimento e limite por empresa
sql(`update knowledge_base set content='SERVIÇO EXCLUSIVO DA EMPRESA B: consultoria fiscal' where org_id='${ORG_B}' and section='servicos'`);
sql(`update knowledge_base set content='SERVIÇO EXCLUSIVO DA ASTARITA: identidade visual' where org_id='${ORG_A}' and section='servicos'`);
await fetch(`${AI}/__reset`);
r = await call('/api/inbox/ai', { token: TB, body: { conversationId: convB, kind: 'suggest' } });
const q = (await (await fetch(`${AI}/__requests`)).json()).at(-1) ?? {};
check('IA de B usa a base de B e o nome da empresa B, e NADA da Astarita', r.status === 200 && q.user?.includes('consultoria fiscal') && !q.user?.includes('identidade visual') && !q.user?.includes('Astarita') && /Empresa B/.test(q.system ?? '') && !/Astarita/.test(q.system ?? ''), `${r.status} ${q.system?.slice(0, 80)}`);
check('a sugestão fica gravada na empresa B', sql(`select count(*) from ai_suggestions where org_id='${ORG_B}'`) === '1' && sql(`select count(*) from ai_suggestions where org_id='${ORG_A}'`) === '0');
await call('/api/inbox/platform/orgs', { method: 'PATCH', token: TA, body: { orgId: ORG_B, aiMonthlyLimit: 1 } });
r = await call('/api/inbox/ai', { token: TB, body: { conversationId: convB, kind: 'suggest' } });
check('limite mensal da IA do plano: 429 ai_monthly_limit, sem chamar a IA', r.status === 429 && r.json?.code === 'ai_monthly_limit', r.text);
r = await call('/api/inbox/ai', { token: TA, body: { conversationId: convA, kind: 'suggest' } });
const qa = (await (await fetch(`${AI}/__requests`)).json()).at(-1) ?? {};
check('o limite de B não afeta a Astarita, e a IA dela usa a base DELA', r.status === 200 && qa.user?.includes('identidade visual') && !qa.user?.includes('consultoria fiscal') && /Astarita/.test(qa.system ?? ''), `${r.status} ${r.text}`);
await call('/api/inbox/platform/orgs', { method: 'PATCH', token: TA, body: { orgId: ORG_B, aiMonthlyLimit: 0 } });
r = await call('/api/inbox/ai', { token: TB, body: { conversationId: convB, kind: 'suggest' } });
check('limite 0 bloqueia a IA da empresa', r.status === 429);

// ---------------------------------------------------------------- 8) suspensão
r = await call('/api/inbox/platform/orgs', { method: 'PATCH', token: TA, body: { orgId: ORG_A, status: 'suspended' } });
check('o dono da plataforma não suspende a própria empresa (400)', r.status === 400 && sql(`select status from organizations where id='${ORG_A}'`) === 'active');
r = await call('/api/inbox/platform/orgs', { method: 'PATCH', token: TJ, body: { orgId: ORG_B, status: 'suspended' } });
check('quem não é dono da plataforma não suspende empresas (403)', r.status === 403 && sql(`select status from organizations where id='${ORG_B}'`) === 'active');
r = await call('/api/inbox/platform/orgs', { method: 'PATCH', token: TA, body: { orgId: ORG_B, status: 'suspended' } });
check('suspender a empresa B', r.status === 200 && sql(`select status from organizations where id='${ORG_B}'`) === 'suspended');
r = await call('/api/inbox/status', { method: 'GET', token: TB });
check('empresa suspensa: o dono dela recebe 403 org_suspended', r.status === 403 && r.json?.code === 'org_suspended', r.text);
r = await rest(TB, 'contacts?select=id');
check('empresa suspensa: nem pela API REST ela lê os próprios dados', r.status === 200 && r.json.length === 0, r.text);
r = await rest(TB, 'contacts', { method: 'POST', body: JSON.stringify({ name: 'x', phone: '5511900009999' }) });
check('empresa suspensa não escreve', r.status >= 400, r.text);
r = await hookB(rawB.replace('wamid.B_TEXT1', 'wamid.B_TEXT2'));
check('empresa suspensa não recebe mensagens do webhook (404)', r.status === 404 && sql(`select count(*) from messages where wa_message_id='wamid.B_TEXT2'`) === '0', r.text);
r = await call(`/api/whatsapp/webhook/${KEY_B}?hub.mode=subscribe&hub.verify_token=${VER_B}&hub.challenge=1`, { method: 'GET' });
check('nem a verificação do webhook funciona para empresa suspensa', r.status === 403);
r = await call('/api/inbox/status', { method: 'GET', token: TA });
check('a Astarita não é afetada pela suspensão de B', r.status === 200);
await call('/api/inbox/platform/orgs', { method: 'PATCH', token: TA, body: { orgId: ORG_B, status: 'active' } });
r = await hookB(rawB.replace('wamid.B_TEXT1', 'wamid.B_TEXT3'));
check('reativada: B volta a receber mensagens', r.status === 200 && r.json.messages === 1, r.text);

// ---------------------------------------------------------------- 9) listagem final e segredos
r = await call('/api/inbox/platform/orgs', { method: 'GET', token: TA });
const ob = r.json.orgs.find((o) => o.slug === 'empresa-b');
check('painel mostra o uso de B: pessoas, contatos, conversas, WhatsApp conectado', ob && ob.users >= 3 && ob.contacts >= 2 && ob.conversations >= 1 && ob.whatsappConnectedAt && ob.maxUsers === 4, JSON.stringify(ob));
check('nenhuma resposta do servidor contém tokens da Meta, App Secrets ou verify tokens', !seen.some((t) => [TOK_A, TOK_B, APP_A, APP_B].some((v) => t.includes(v))));
check('só criar empresa, criar pessoa (4x) e gerar nova senha devolvem senha temporária; nenhuma outra resposta', seen.filter((t) => t.includes('tempPassword')).length === 6, String(seen.filter((t) => t.includes('tempPassword')).length));

// limpeza: as outras suítes esperam só a Astarita
sql(`delete from profiles where org_id in (select id from organizations where slug <> 'astarita'); delete from organizations where slug <> 'astarita'; delete from auth.users where email not in ('andreas@t','juline@t','intruso@t');`);
await fetch(`${GW}/__reset-users`);

const fails = results.filter((x) => !x).length;
console.log(`\n${results.length - fails}/${results.length} passaram`);
process.exit(fails ? 1 : 0);
