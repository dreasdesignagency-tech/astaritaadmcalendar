// Provedor de IA SIMULADO (porta 3005), com os formatos Anthropic (/v1/messages) e OpenAI (/v1/chat/completions).
// Não é IA de verdade: serve para testar o NOSSO lado (prompt, erros, limites, segurança). Registra o que recebe em /__requests.
// Palavras-gatilho no texto do usuário: FORCE_401, FORCE_429, FORCE_500, FORCE_REFUSAL, FORCE_MAXTOKENS, FORCE_EMPTY, FORCE_SLOW.
import http from 'node:http';
const KEY = 'ai-key-test';
const log = [];
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (url.pathname === '/__requests') return send(200, log);
  if (url.pathname === '/__reset') { log.length = 0; return send(200, { ok: true }); }
  let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    let body = null; try { body = JSON.parse(raw); } catch {}
    const anth = url.pathname === '/v1/messages', oai = url.pathname === '/v1/chat/completions';
    const auth = anth ? req.headers['x-api-key'] === KEY : req.headers.authorization === `Bearer ${KEY}`;
    const user = anth ? (body?.messages?.[0]?.content ?? '') : (body?.messages?.find((m) => m.role === 'user')?.content ?? '');
    const system = anth ? (body?.system ?? '') : (body?.messages?.find((m) => m.role === 'system')?.content ?? '');
    log.push({ path: url.pathname, auth: auth ? 'ok' : 'errado', model: body?.model, max: body?.max_tokens ?? body?.max_completion_tokens, system, user, hasTemperature: 'temperature' in (body ?? {}) });
    if (!anth && !oai) return send(404, { error: 'rota' });
    if (!auth) return send(401, { error: { message: 'bad key' } });
    const reply = (text, stop = 'end_turn') => anth
      ? send(200, { id: 'msg_1', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'text', text }], stop_reason: stop })
      : send(200, { id: 'c1', choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: stop === 'max_tokens' ? 'length' : 'stop' }] });
    if (user.includes('FORCE_401')) return send(401, { error: { message: 'bad key' } });
    if (user.includes('FORCE_429')) return send(429, { error: { message: 'slow down' } });
    if (user.includes('FORCE_500')) return send(500, { error: { message: 'boom' } });
    if (user.includes('FORCE_REFUSAL')) return anth ? send(200, { content: [], stop_reason: 'refusal' }) : send(200, { choices: [{ message: { refusal: 'no' }, finish_reason: 'stop' }] });
    if (user.includes('FORCE_MAXTOKENS')) return reply('cortad', 'max_tokens');
    if (user.includes('FORCE_EMPTY')) return reply('   ');
    if (user.includes('FORCE_SLOW')) return setTimeout(() => reply('tarde demais'), 60_000);
    // Resposta determinística que ecoa a instrução para o teste conferir o que foi pedido.
    const m = /\n([^\n]+)$/.exec(user.trim());
    reply(`"SUGESTAO: ${m ? m[1].slice(0, 40) : ''}"`);
  });
}).listen(3005, '127.0.0.1');
