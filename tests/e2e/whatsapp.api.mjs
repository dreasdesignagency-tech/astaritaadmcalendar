// Teste do backend do WhatsApp (webhook, envio, status, mídia, canais) contra a pilha local (stack.sh up).
// Meta e Storage são SIMULADOS (graph-mock.mjs e gateway-proxy.mjs): isto valida o NOSSO lado do contrato, não a Meta de verdade.
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const OK_BASE = 'http://127.0.0.1:5199', NOWA_BASE = 'http://127.0.0.1:5197', GRAPH = 'http://127.0.0.1:3004', REST = 'http://127.0.0.1:3002/rest/v1';
const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456', APP_SECRET = 'segredo-do-app-teste', META_TOKEN = 'token-de-teste-da-meta';
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b', X = '00000000-0000-0000-0000-00000000000c';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, email, role = 'authenticated') => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const TA = jwt(A, 'andreas@t'), TB = jwt(B, 'juline@t'), TX = jwt(X, 'intruso@t');
const sql = (q) => execSync(`su postgres -c "psql -d inboxe2e -tAq"`, { input: q }).toString().trim();
const fx = (n) => readFileSync(`tests/fixtures/whatsapp/${n}.json`, 'utf8');
const sign = (raw, secret = APP_SECRET) => `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [], seen = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };

async function call(base, path, { method = 'POST', token, body, raw, headers = {} } = {}) {
  const res = await fetch(base + path, { method, headers: { ...(raw === undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text(); seen.push(text);
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}
const hook = (base, raw, sig) => call(base, '/api/whatsapp/webhook', { raw, headers: sig === null ? {} : { 'x-hub-signature-256': sig ?? sign(raw), 'content-type': 'application/json' } });
const graphLog = async () => (await (await fetch(`${GRAPH}/__requests`)).json());
const graphPosts = async () => (await graphLog()).filter((r) => r.method === 'POST' && /\/messages$/.test(r.path));
async function pendingMsg(token, convId, userId, body, extra = {}) {
  const r = await fetch(`${REST}/messages`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: 'sb_publishable_inbox', authorization: `Bearer ${token}`, prefer: 'return=representation' },
    body: JSON.stringify({ conversation_id: convId, direction: 'out', type: 'text', body, status: 'pending', sent_by: userId, client_token: crypto.randomUUID(), ...extra }) });
  const j = await r.json(); if (!r.ok) throw new Error('insert pending falhou: ' + JSON.stringify(j)); return j[0].id;
}
const row = (id) => sql(`select status||'|'||coalesce(wa_message_id,'')||'|'||coalesce(error_code,'')||'|'||coalesce(error_message,'') from messages where id='${id}'`).split('|');

await fetch(`${GRAPH}/__reset`);
sql(`truncate contacts, tags, webhook_events, quick_replies, reminders, internal_notes, ai_suggestions cascade; update profiles set active=true;`);

// ================================================================ webhook: verificação e assinatura
let r = await call(OK_BASE, '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-teste&hub.challenge=987654', { method: 'GET' });
check('GET verificação: token certo devolve o challenge', r.status === 200 && r.text === '987654', `${r.status} ${r.text}`);
r = await call(OK_BASE, '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=1', { method: 'GET' });
check('GET verificação: token errado é recusado (403)', r.status === 403);
r = await call(OK_BASE, '/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=1', { method: 'GET' });
check('GET verificação: sem token é recusado', r.status === 403);

const rawText = fx('text');
r = await hook(OK_BASE, rawText, null);
check('POST sem assinatura é recusado (401)', r.status === 401);
r = await hook(OK_BASE, rawText, sign(rawText, 'segredo-errado'));
check('POST com assinatura de outro segredo é recusado (401)', r.status === 401);
r = await hook(OK_BASE, rawText + ' ', sign(rawText));
check('POST com corpo alterado depois de assinado é recusado (401)', r.status === 401);
check('nada foi gravado pelos POSTs recusados (contatos/mensagens)', sql(`select count(*) from contacts`) === '0' && sql(`select count(*) from messages`) === '0');
check('eventos recusados ficam no histórico SEM o conteúdo do corpo', sql(`select count(*) from webhook_events where signature_valid=false`) === '3' && sql(`select count(*) from webhook_events where signature_valid=false and payload::text like '%Maria%'`) === '0');

// ================================================================ webhook: mensagem de texto
r = await hook(OK_BASE, rawText);
check('POST de texto válido: 200', r.status === 200 && r.json?.messages === 1, r.text);
check('contato novo criado com o nome do perfil e telefone', sql(`select name||'|'||phone||'|'||category from contacts`) === 'Maria Souza|5511999998888|lead');
check('conversa aguardando, 1 não lida, janela de 24h iniciada', sql(`select status||'|'||unread_count||'|'||(last_inbound_at is not null) from conversations`) === 'waiting|1|true');
check('mensagem recebida gravada', sql(`select direction||'|'||type||'|'||status||'|'||body from messages where wa_message_id='wamid.TEXT1'`) === 'in|text|received|Oi! Vocês fazem social media?');
check('lead novo entrou no funil em "Novo lead"', sql(`select s.slug from opportunities o join pipeline_stages s on s.id=o.stage_id`) === 'novo-lead');
check('histórico do webhook registra o evento como processado', sql(`select count(*) from webhook_events where event_key='msg:wamid.TEXT1' and processed_at is not null and signature_valid`) === '1');

r = await hook(OK_BASE, rawText);
check('reentrega do mesmo evento não duplica (200, duplicates=1)', r.status === 200 && r.json?.duplicates === 1 && r.json?.messages === 0, r.text);
check('reentrega não soma não lidas nem mensagens nem eventos', sql(`select unread_count from conversations`) === '1' && sql(`select count(*) from messages`) === '1' && sql(`select count(*) from webhook_events where event_key='msg:wamid.TEXT1'`) === '1');

const same = await Promise.all([hook(OK_BASE, fx('audio')), hook(OK_BASE, fx('audio')), hook(OK_BASE, fx('audio'))]);
check('3 entregas simultâneas do mesmo evento geram UMA mensagem', same.every((x) => x.status === 200) && sql(`select count(*) from messages where wa_message_id='wamid.AUD1'`) === '1' && sql(`select unread_count from conversations`) === '2', same.map((x) => x.text).join(' | '));

r = await hook(OK_BASE, fx('reaction'));
check('reação é ignorada: não cria mensagem nem conta como não lida', r.status === 200 && r.json?.ignored === 1 && sql(`select count(*) from messages`) === '2' && sql(`select unread_count from conversations`) === '2', r.text);
r = await hook(OK_BASE, fx('unknown-field'));
check('campo desconhecido não derruba o webhook', r.status === 200);
r = await hook(OK_BASE, fx('garbage'));
check('payload esquisito (JSON válido) não derruba o webhook', r.status === 200);
r = await hook(OK_BASE, 'isto não é json');
check('corpo que não é JSON (assinado) devolve 400', r.status === 400);

r = await hook(OK_BASE, fx('reply-context'));
check('mensagem com contexto liga-se à mensagem original', r.status === 200, r.text);
await hook(OK_BASE, fx('image'));
await hook(OK_BASE, fx('document'));
await hook(OK_BASE, fx('location'));
await hook(OK_BASE, fx('interactive'));
check('imagem, documento, localização e botão viram mensagens (sem quebrar)', sql(`select count(*) from messages where direction='in'`) === '7', sql(`select count(*) from messages`));
check('prévia da conversa mostra a última mensagem', sql(`select last_message_preview from conversations`) !== '');

// ================================================================ envio
const conv = sql(`select id from conversations`);
const inboundText = sql(`select id from messages where wa_message_id='wamid.TEXT1'`);
let id = await pendingMsg(TA, conv, A, 'Olá, Maria! Tudo bem?');
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('envio de texto: 200 com id da Meta', r.status === 200 && r.json?.waMessageId === 'wamid.SENT1', r.text);
check('mensagem fica "sent" com o id da Meta', row(id).slice(0, 2).join('|') === 'sent|wamid.SENT1', row(id).join('|'));
check('conversa passa a "em atendimento" com o responsável que enviou', sql(`select status||'|'||assigned_to from conversations`) === `in_progress|${A}`);
let posts = await graphPosts();
const last = posts.at(-1);
check('a Meta recebeu o corpo certo (destino, tipo, texto) com o token do servidor', last.body.to === '5511999998888' && last.body.type === 'text' && last.body.text.body === 'Olá, Maria! Tudo bem?' && last.body.messaging_product === 'whatsapp' && last.auth === 'ok', JSON.stringify(last));

r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('enviar de novo a mesma mensagem é idempotente (não chama a Meta)', r.status === 200 && r.json?.duplicate === true && (await graphPosts()).length === posts.length, r.text);
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id, retry: true } });
check('"tentar de novo" numa mensagem já enviada também não duplica', r.json?.duplicate === true && (await graphPosts()).length === posts.length, r.text);

id = await pendingMsg(TA, conv, A, 'Disparo simultâneo');
const before = (await graphPosts()).length;
const par = await Promise.all(Array.from({ length: 6 }, () => call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } })));
check('6 envios simultâneos da mesma mensagem chamam a Meta UMA vez', (await graphPosts()).length === before + 1 && par.every((x) => x.status === 200), `${(await graphPosts()).length - before} chamadas`);

id = await pendingMsg(TA, conv, A, 'Em nome do André');
r = await call(OK_BASE, '/api/inbox/send', { token: TB, body: { messageId: id } });
check('outra pessoa não consegue enviar a mensagem alheia (403)', r.status === 403 && row(id)[0] === 'pending', r.text);
r = await call(OK_BASE, '/api/inbox/send', { body: { messageId: id } });
check('sem login: 401', r.status === 401);
r = await call(OK_BASE, '/api/inbox/send', { token: 'lixo', body: { messageId: id } });
check('token inválido: 401', r.status === 401);
r = await call(OK_BASE, '/api/inbox/send', { token: TX, body: { messageId: id } });
check('usuário sem perfil no Inbox: 403', r.status === 403, r.text);
sql(`update profiles set active=false where id='${A}'`);
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('perfil desativado perde o envio na hora (403)', r.status === 403, r.text);
sql(`update profiles set active=true where id='${A}'`);
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: 'não-é-uuid' } });
check('messageId inválido: 400', r.status === 400);
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id, template: { name: 'Nome Inválido!', language: 'pt_BR' } } });
check('modelo com nome inválido: 400', r.status === 400);
check('nada foi enviado nos casos recusados', row(id)[0] === 'pending');

// erros reais da Meta
id = await pendingMsg(TA, conv, A, 'FORCE_WINDOW_ERROR');
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
let m = row(id);
check('erro 131047 da Meta: 409, mensagem marcada como falha com o motivo em português', r.status === 409 && r.json?.code === 'window_closed' && m[0] === 'failed' && m[2] === '131047' && /24 horas/.test(m[3]), `${r.status} ${m.join('|')}`);
sql(`update messages set body='Agora vai' where id='${id}'`);
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id, retry: true } });
check('"tentar de novo" depois da falha envia e limpa o erro', r.status === 200 && row(id)[0] === 'sent' && row(id)[2] === '', `${r.status} ${row(id).join('|')}`);

id = await pendingMsg(TA, conv, A, 'FORCE_AUTH_ERROR');
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('erro 190 (token da Meta inválido) vira falha clara, sem expor o token', r.status === 502 && row(id)[0] === 'failed' && /token/i.test(row(id)[3]) && !r.text.includes(META_TOKEN), `${r.status} ${r.text}`);
id = await pendingMsg(TA, conv, A, 'FORCE_RATE');
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('limite de envio da Meta (429) vira falha com orientação', row(id)[0] === 'failed' && /Limite/.test(row(id)[3]), row(id).join('|'));

// resposta com contexto
id = await pendingMsg(TA, conv, A, 'Respondendo isto', { reply_to_id: inboundText });
await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('resposta a uma mensagem envia o contexto (id da mensagem original) à Meta', (await graphPosts()).at(-1).body.context?.message_id === 'wamid.TEXT1');

// janela fechada: o servidor confere de novo (a tela só avisa)
sql(`update conversations set last_inbound_at = now() - interval '25 hours'`);
const nBefore = (await graphPosts()).length;
id = await pendingMsg(TA, conv, A, 'Mensagem livre fora da janela');
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('fora da janela de 24h o texto livre é recusado pelo servidor, sem chamar a Meta', r.status === 409 && r.json?.code === 'window_closed' && (await graphPosts()).length === nBefore && row(id)[2] === 'window_closed', `${r.status} ${r.text}`);
id = await pendingMsg(TA, conv, A, 'Modelo aprovado: retorno_contato (Maria)', { type: 'template' });
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id, template: { name: 'retorno_contato', language: 'pt_BR', variables: ['Maria'] } } });
const tb = (await graphPosts()).at(-1).body;
check('fora da janela, o modelo aprovado é enviado', r.status === 200 && tb.type === 'template' && tb.template.name === 'retorno_contato' && tb.template.language.code === 'pt_BR' && tb.template.components[0].parameters[0].text === 'Maria' && row(id)[0] === 'sent', `${r.status} ${r.text} ${JSON.stringify(tb)}`);
id = await pendingMsg(TA, conv, A, 'Modelo sem dados', { type: 'template' });
r = await call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('mensagem do tipo modelo sem os dados do modelo é recusada (400)', r.status === 400, r.text);
sql(`update conversations set last_inbound_at = now()`);

// status que chega ANTES de o id da Meta estar gravado
id = await pendingMsg(TA, conv, A, 'FORCE_DELAY corrida de status');
const sending = call(OK_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
await sleep(400);
const early = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: 'W', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', statuses: [{ id: 'wamid.RACE1', status: 'delivered', timestamp: '1791500800', recipient_id: '5511999998888' }] } }] }] });
const rEarly = await hook(OK_BASE, early);
check('status de mensagem ainda não registrada é aceito e guardado para depois (200)', rEarly.status === 200 && rEarly.json?.deferred === 1, rEarly.text);
const sendRes = await sending;
await sleep(300);
check('quando o envio termina, o status que chegou antes é aplicado (entregue)', sendRes.status === 200 && row(id)[0] === 'delivered', `${sendRes.status} ${row(id).join('|')}`);

// ================================================================ status de entrega
const sent1 = sql(`select id from messages where wa_message_id='wamid.SENT1'`);
const stat = (waId, status, ts = '1791500900') => JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: 'W', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', statuses: [{ id: waId, status, timestamp: ts, recipient_id: '5511999998888' }] } }] }] });
await hook(OK_BASE, stat('wamid.SENT1', 'delivered'));
check('status "entregue" atualiza a mensagem', row(sent1)[0] === 'delivered');
await hook(OK_BASE, stat('wamid.SENT1', 'sent'));
check('"sent" atrasado depois de "entregue" não regride', row(sent1)[0] === 'delivered');
await hook(OK_BASE, stat('wamid.SENT1', 'read'));
check('status "lida" atualiza', row(sent1)[0] === 'read');
await hook(OK_BASE, fx('status-failed').replace('wamid.OUT2', 'wamid.SENT1'));
check('"failed" depois de "lida" é ignorado', row(sent1)[0] === 'read' && row(sent1)[2] === '');
const sent2 = sql(`select id from messages where wa_message_id='wamid.SENT2'`);
await hook(OK_BASE, stat('wamid.SENT2', 'read'));
await hook(OK_BASE, stat('wamid.SENT2', 'delivered'));
check('"lida" antes de "entregue" (fora de ordem) fica "lida"', row(sent2)[0] === 'read');
r = await hook(OK_BASE, stat('wamid.NAOEXISTE', 'delivered'));
check('status de mensagem desconhecida não derruba nem apaga nada', r.status === 200);
check('todos os status ficam no histórico do webhook', Number(sql(`select count(*) from webhook_events where event_key like 'st:%'`)) >= 6);

// ================================================================ eco do app WhatsApp Business (coexistência)
const unread = sql(`select unread_count from conversations`);
r = await hook(OK_BASE, fx('echo'));
check('eco do app (coexistência) entra como mensagem enviada, sem contar como não lida', r.status === 200 && r.json?.echoes === 1 && sql(`select direction||'|'||status||'|'||coalesce(sent_by::text,'-') from messages where wa_message_id='wamid.ECHO1'`) === 'out|sent|-' && sql(`select unread_count from conversations`) === unread, r.text);

// ================================================================ mídia sob demanda (Storage SIMULADO)
const img = sql(`select id from messages where wa_message_id='wamid.IMG1'`);
const gBefore = (await graphLog()).length;
r = await call(OK_BASE, '/api/inbox/media', { token: TA, body: { messageId: img } });
check('mídia: devolve URL assinada', r.status === 200 && /\/storage\/v1\/object\/sign\//.test(r.json?.url ?? ''), r.text);
const bytes = await fetch(r.json.url);
check('o arquivo baixado da Meta chega íntegro pela URL assinada', (await bytes.text()) === 'fake-jpeg-bytes');
const gl = (await graphLog()).slice(gBefore);
check('o servidor falou com a Meta usando o token (metadados e download), nunca o navegador', gl.length === 2 && gl.every((x) => x.auth === 'ok'), JSON.stringify(gl.map((x) => [x.path, x.auth])));
check('o caminho guardado é privado e previsível (conversa/mensagem)', sql(`select media_path from messages where id='${img}'`) === `${conv}/${img}.jpg`);
const g2 = (await graphLog()).length;
r = await call(OK_BASE, '/api/inbox/media', { token: TB, body: { messageId: img } });
check('segunda abertura usa o arquivo já guardado (não chama a Meta de novo)', r.status === 200 && (await graphLog()).length === g2);
r = await call(OK_BASE, '/api/inbox/media', { body: { messageId: img } });
check('mídia sem login: 401', r.status === 401);
r = await call(OK_BASE, '/api/inbox/media', { token: TX, body: { messageId: img } });
check('mídia para quem não é membro: 403', r.status === 403);
r = await call(OK_BASE, '/api/inbox/media', { token: TA, body: { messageId: inboundText } });
check('mensagem sem anexo: 404', r.status === 404);
const doc = sql(`select id from messages where wa_message_id='wamid.DOC1'`);
r = await call(OK_BASE, '/api/inbox/media', { token: TA, body: { messageId: doc } });
check('documento PDF também é guardado e servido', r.status === 200 && sql(`select media_path from messages where id='${doc}'`).endsWith('.pdf'), r.text);

// ================================================================ estado dos canais
r = await call(OK_BASE, '/api/inbox/status', { method: 'GET', token: TA });
const wa = r.json?.status?.whatsapp;
check('estado do WhatsApp: configurado e CONFIRMADO pela Meta (número e nome)', r.status === 200 && wa?.configured && wa?.reachable === true && wa?.phone === '+1 555 000 1111' && wa?.verifiedName === 'Astarita Teste', r.text);
check('estado da IA (servidor com IA): ligada, mostra provedor e modelo, NUNCA a chave', r.json?.status?.ai?.configured === true && r.json.status.ai.provider === 'anthropic' && r.json.status.ai.model === 'modelo-teste' && !r.text.includes('ai-key-test'), r.text);
const r0 = await call(NOWA_BASE, '/api/inbox/status', { method: 'GET', token: TA });
check('estado da IA (servidor sem IA): faltam só os nomes das variáveis', r0.json?.status?.ai?.configured === false && r0.json.status.ai.missing.includes('INBOX_AI_API_KEY') && !r0.text.includes('ai-key-test'), r0.text);
r = await call(OK_BASE, '/api/inbox/status', { method: 'GET' });
check('estado dos canais exige login (401)', r.status === 401);
r = await call(NOWA_BASE, '/api/inbox/status', { method: 'GET', token: TA });
check('servidor sem WhatsApp: configured=false e lista os NOMES que faltam', r.status === 200 && r.json.status.whatsapp.configured === false && r.json.status.whatsapp.missing.includes('WHATSAPP_ACCESS_TOKEN') && r.json.status.whatsapp.reachable === null, r.text);
const conv5197 = conv;
id = await pendingMsg(TA, conv5197, A, 'Sem WhatsApp configurado');
r = await call(NOWA_BASE, '/api/inbox/send', { token: TA, body: { messageId: id } });
check('envio sem WhatsApp configurado: 503 claro, mensagem marcada como falha', r.status === 503 && r.json?.code === 'not_configured' && row(id)[0] === 'failed' && row(id)[2] === 'not_configured', `${r.status} ${r.text}`);
r = await hook(NOWA_BASE, rawText);
check('webhook sem META_APP_SECRET: 503 (nunca aceita sem poder validar a assinatura)', r.status === 503, `${r.status} ${r.text}`);
r = await call(NOWA_BASE, '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-teste&hub.challenge=1', { method: 'GET' });
check('verificação sem WHATSAPP_VERIFY_TOKEN configurado: 403', r.status === 403);

// ================================================================ segredos
const joined = seen.join('\n');
const service = execSync(`grep -o "INBOX_SUPABASE_SERVICE_ROLE_KEY=[^ ]*" /proc/$(fuser 5199/tcp 2>/dev/null | tr -d ' ' | head -c 20)/environ 2>/dev/null || true`).toString();
check('nenhuma resposta do servidor contém o token da Meta nem o segredo do app', !joined.includes(META_TOKEN) && !joined.includes(APP_SECRET));
check('nenhuma resposta contém uma chave service_role (JWT com role service_role)', !/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]*c2VydmljZV9yb2xl/.test(joined));

const fails = results.filter((x) => !x).length;
console.log(`\n${results.length - fails}/${results.length} passaram`);
process.exit(fails ? 1 : 0);
