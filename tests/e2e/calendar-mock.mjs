// Faz o papel do projeto Supabase do CALENDÁRIO (porta 3003), com dados fixos e somente leitura.
// Serve para provar que o calendário continua funcionando e que o Inbox nunca fala com ele.
import http from 'node:http';
const CLIENTS = [{ id: 'c1', name: 'Cliente do Calendário', color: '#831a4b', active: true, created_at: '2026-09-01T00:00:00Z', owner_id: 'cal-user' }];
http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': req.headers['access-control-request-headers'] || '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const json = (body) => { res.writeHead(200, { ...cors, 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (req.url.startsWith('/rest/v1/clients')) return json(CLIENTS);
  if (req.url.startsWith('/rest/v1/')) return json([]);
  res.writeHead(404, cors); res.end();
}).listen(3003, '127.0.0.1');
