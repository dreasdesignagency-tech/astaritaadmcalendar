// Faz o papel do gateway do Supabase: /rest/v1/* -> PostgREST, com CORS. Realtime não existe aqui (404).
import http from 'node:http';
http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': req.headers['access-control-request-headers'] || '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': 'content-range,content-type' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (!req.url.startsWith('/rest/v1/')) { res.writeHead(404, cors); return res.end('not found'); }
  const up = http.request({ host: '127.0.0.1', port: 3001, path: req.url.replace('/rest/v1', ''), method: req.method, headers: { ...req.headers, host: '127.0.0.1:3001' } }, (r) => { res.writeHead(r.statusCode, { ...r.headers, ...cors }); r.pipe(res); });
  up.on('error', () => { res.writeHead(502, cors); res.end(); });
  req.pipe(up);
}).listen(3002, '127.0.0.1');
