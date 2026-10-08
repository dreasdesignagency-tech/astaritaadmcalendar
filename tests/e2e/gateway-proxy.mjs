// Faz o papel do gateway do projeto Supabase do Inbox (porta 3002):
//   /rest/v1/*  -> PostgREST real (porta 3001), com RLS e JWT
//   /auth/v1/*  -> GoTrue SIMULADO (só o necessário para testar as telas de login; não é o GoTrue de verdade)
// Realtime não existe aqui (responde 404): o app cai no modo de contingência, que é o que o teste valida.
import http from 'node:http';
import { createHmac } from 'node:crypto';

const SECRET = 'e2e-secret-e2e-secret-e2e-secret-123456';
const STORE = new Map();
const PASSWORD = 'senha-teste-123';
const USERS = { 'andreas@t': '00000000-0000-0000-0000-00000000000a', 'juline@t': '00000000-0000-0000-0000-00000000000b' };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = (sub, email) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };

http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': req.headers['access-control-request-headers'] || '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': 'content-range,content-type' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const json = (code, body) => { res.writeHead(code, { ...cors, 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };

  if (req.url.startsWith('/auth/v1/token')) {
    let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
      const { email, password } = JSON.parse(raw || '{}');
      const id = USERS[(email || '').toLowerCase()];
      if (!id || password !== PASSWORD) return json(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      const now = Math.floor(Date.now() / 1000);
      json(200, { access_token: sign(id, email), token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'r', user: { id, aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } });
    });
    return;
  }
  if (req.url.startsWith('/auth/v1/settings')) return json(200, { disable_signup: true, external: { email: true, phone: false, google: false }, mailer_autoconfirm: false });
  if (req.url.startsWith('/auth/v1/logout')) { res.writeHead(204, cors); return res.end(); }
  if (req.url.startsWith('/auth/v1/user') && req.method === 'GET') { // valida o JWT como o GoTrue (simulado)
    const tok = (req.headers.authorization || '').replace(/^Bearer /, '');
    const [h, p, sig] = tok.split('.');
    let claims = null;
    try {
      if (sig && createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url') === sig) claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    } catch {}
    if (!claims || !claims.sub || (claims.exp && claims.exp < Date.now() / 1000)) return json(401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' });
    return json(200, { id: claims.sub, aud: 'authenticated', role: 'authenticated', email: claims.email ?? null, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });
  }
  if (req.url.startsWith('/auth/v1/user')) { // set password (simulado)
    let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => json(200, { id: USERS['andreas@t'], email: 'andreas@t', received_password_field: 'password' in JSON.parse(raw || '{}') }));
    return;
  }
  // Storage SIMULADO (em memória): upload, URL assinada e download. Não é o Storage de verdade.
  if (req.url.startsWith('/storage/v1/object/')) {
    const u = new URL(req.url, 'http://x');
    const rest = decodeURIComponent(u.pathname.replace('/storage/v1/object/', ''));
    if (req.method === 'POST' && rest.startsWith('sign/')) {
      const key = rest.slice('sign/'.length);
      return json(200, { signedURL: `/object/sign/${encodeURI(key)}?token=tok-${Math.random().toString(36).slice(2)}` });
    }
    if (req.method === 'GET' && rest.startsWith('sign/')) {
      const f = STORE.get(rest.slice('sign/'.length));
      if (!f) { res.writeHead(404, cors); return res.end(); }
      res.writeHead(200, { ...cors, 'content-type': f.type }); return res.end(f.bytes);
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
        STORE.set(rest, { bytes: Buffer.concat(chunks), type: req.headers['content-type'] || 'application/octet-stream' });
        json(200, { Key: rest, Id: rest });
      });
      return;
    }
  }
  if (!req.url.startsWith('/rest/v1/')) { res.writeHead(404, cors); return res.end('not found'); }
  const up = http.request({ host: '127.0.0.1', port: 3001, path: req.url.replace('/rest/v1', ''), method: req.method, headers: { ...req.headers, host: '127.0.0.1:3001' } }, (r) => { res.writeHead(r.statusCode, { ...r.headers, ...cors }); r.pipe(res); });
  up.on('error', () => { res.writeHead(502, cors); res.end(); });
  req.pipe(up);
}).listen(3002, '127.0.0.1');
