// Graph API da Meta SIMULADA (porta 3004). Não é a Meta: serve para testar o nosso lado do contrato.
// Registra o que recebe (GET /__requests) e reproduz erros reais conhecidos conforme o texto da mensagem:
//   FORCE_WINDOW_ERROR -> 400, código 131047 | FORCE_AUTH_ERROR -> 401, código 190 | FORCE_RATE -> 429, código 130429
//   FORCE_DELAY -> responde depois de 1200 ms (para testar status que chegam antes do id gravado; id fixo wamid.RACE1)
import http from 'node:http';
const TOKEN = 'token-de-teste-da-meta';
const log = [];
let n = 0;
const MEDIA = { MEDIA_IMG_1: { mime: 'image/jpeg', bytes: Buffer.from('fake-jpeg-bytes') }, MEDIA_DOC_1: { mime: 'application/pdf', bytes: Buffer.from('%PDF-fake') } };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (code, body, extra = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...extra }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
  if (url.pathname === '/__requests') return send(200, log);
  if (url.pathname === '/__reset') { log.length = 0; n = 0; return send(200, { ok: true }); }
  let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    const auth = req.headers.authorization || '';
    const body = raw ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : null;
    log.push({ method: req.method, path: url.pathname + url.search, auth: auth === `Bearer ${TOKEN}` ? 'ok' : auth ? 'errado' : 'ausente', body });
    if (auth !== `Bearer ${TOKEN}`) return send(401, { error: { message: 'Invalid OAuth access token.', type: 'OAuthException', code: 190 } });

    if (req.method === 'POST' && /^\/v[\d.]+\/[^/]+\/messages$/.test(url.pathname)) {
      const text = body?.text?.body ?? '';
      if (text.includes('FORCE_WINDOW_ERROR')) return send(400, { error: { message: '(#131047) Re-engagement message', type: 'OAuthException', code: 131047, error_data: { messaging_product: 'whatsapp', details: 'Message failed to send because more than 24 hours have passed since the customer last replied to this number.' } } });
      if (text.includes('FORCE_AUTH_ERROR')) return send(401, { error: { message: 'Error validating access token', type: 'OAuthException', code: 190 } });
      if (text.includes('FORCE_RATE')) return send(429, { error: { message: 'Too many messages', code: 130429 } });
      const id = text.includes('FORCE_DELAY') ? 'wamid.RACE1' : `wamid.SENT${++n}`;
      const reply = () => send(200, { messaging_product: 'whatsapp', contacts: [{ input: body.to, wa_id: body.to }], messages: [{ id }] });
      return text.includes('FORCE_DELAY') ? setTimeout(reply, 1200) : reply();
    }
    if (req.method === 'GET' && /^\/v[\d.]+\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split('/').pop();
      if (MEDIA[id]) return send(200, { url: `http://127.0.0.1:3004/media-download/${id}`, mime_type: MEDIA[id].mime, file_size: MEDIA[id].bytes.length, id });
      if (id === 'PHONE_ID') return send(200, { display_phone_number: '+1 555 000 1111', verified_name: 'Astarita Teste', id });
      return send(400, { error: { message: 'Unsupported get request', code: 100 } });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/media-download/')) {
      const m = MEDIA[url.pathname.split('/').pop()];
      return m ? send(200, m.bytes, { 'content-type': m.mime }) : send(404, {});
    }
    return send(404, { error: { message: 'not found', code: 100 } });
  });
}).listen(3004, '127.0.0.1');
