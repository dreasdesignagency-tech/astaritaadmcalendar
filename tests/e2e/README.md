# Teste de ponta a ponta do Inbox (local)

Roda o app no navegador contra um Postgres local com as migrations reais, com PostgREST no meio
(o mesmo servidor de API do Supabase), JWT assinado e RLS ligada. Não usa o projeto Supabase de verdade
e não toca em nenhum dado de produção.

**Não cobre o Supabase Realtime** (não há servidor Realtime local). Nesse cenário o app cai no modo de
contingência (consulta a cada 15s), e é isso que o teste valida.

Pré-requisitos: PostgreSQL 16, binário do PostgREST, Playwright com Chromium.

```bash
# 1. banco
createdb inboxe2e
cat tests/e2e/auth-stub.sql supabase/migrations/*.sql | psql -v ON_ERROR_STOP=1 -d inboxe2e
psql -d inboxe2e -c "insert into auth.users(id,email) values
  ('00000000-0000-0000-0000-00000000000a','andreas@t'),('00000000-0000-0000-0000-00000000000b','juline@t'),('00000000-0000-0000-0000-00000000000c','intruso@t');
  insert into profiles(id,full_name,role) values
  ('00000000-0000-0000-0000-00000000000a','Andreas','director'),('00000000-0000-0000-0000-00000000000b','Juline','ceo');"
# 2. PostgREST na 3001 (db-uri com o role authenticator/senha x, jwt-secret = e2e-secret-e2e-secret-e2e-secret-123456)
# 3. node tests/e2e/gateway-proxy.mjs                      # porta 3002, imita /rest/v1
# 4. VITE_SUPABASE_URL=http://127.0.0.1:3002 VITE_SUPABASE_PUBLISHABLE_KEY=x npx vite dev --host 127.0.0.1 --port 5199
# 5. node tests/e2e/inbox.e2e.mjs ./saida-de-screenshots
```
Os caminhos do Chromium/Playwright e o usuário `postgres` do `psql` estão fixos no topo do script; ajuste ao seu ambiente.
