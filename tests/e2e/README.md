# Testes de ponta a ponta do Inbox (local)

Rodam o app no navegador contra um Postgres local com **o SQL exato instalado** (baseline + `as migrations de `inbox-db/supabase/migrations/``), PostgREST
(o mesmo servidor de API do Supabase), JWT assinado e RLS ligada. Não usam nenhum projeto Supabase real e não falam com a Meta
nem com provedor de IA de verdade.

Simulados: GoTrue/Storage (`gateway-proxy.mjs`), Graph API da Meta (`graph-mock.mjs`, porta 3004)
e provedor de IA (`ai-mock.mjs`, porta 3005). **Ausente:** Realtime (o app cai no modo de contingência, que é o que se valida).
Os testes validam o NOSSO lado do contrato, não a Meta nem um modelo de IA reais.

Pré-requisitos: PostgreSQL 16 (usuário `postgres` via `su`), binário do PostgREST, Node 22, Playwright com Chromium.

```bash
POSTGREST_BIN=/caminho/postgrest tests/e2e/stack.sh up      # banco + simulados + 3 servidores (5197 sem WhatsApp/IA, 5198 sem Inbox, 5199 completo)
npm test                                                    # unitários
node tests/e2e/inbox.e2e.mjs ./saida
node tests/e2e/isolation.e2e.mjs ./saida
node tests/e2e/whatsapp.api.mjs
node tests/e2e/phase34.e2e.mjs ./saida                      # ~5 min (espera a contingência de 15 s)
node tests/e2e/ai.api.mjs
node tests/e2e/ai.e2e.mjs ./saida
tests/e2e/stack.sh down
```
Cada script zera os dados que usa no começo. Os caminhos do Chromium/Playwright e o `psql` via `su postgres` estão fixos no
topo dos scripts; ajuste ao seu ambiente.
