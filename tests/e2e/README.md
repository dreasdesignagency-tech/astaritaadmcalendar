# Testes de ponta a ponta do Inbox (local)

Rodam o app no navegador contra um Postgres local com **o SQL exato instalado** (`inbox-db/supabase/migrations/…_inbox_install.sql`),
PostgREST (o mesmo servidor de API do Supabase), JWT assinado e RLS ligada. Não usam nenhum projeto Supabase real.

Limites do ambiente: o GoTrue (login) é **simulado** pelo `gateway-proxy.mjs` (aceita só `andreas@t`/`juline@t` com a senha de teste)
e **não há Realtime** (o app cai no modo de contingência, que é o que se valida). O projeto do calendário é um mock somente leitura.

Pré-requisitos: PostgreSQL 16, binário do PostgREST, Playwright com Chromium.

```bash
# 1. banco (com privilégios padrão estilo Supabase, o cenário que importa para a RLS)
createdb inboxe2e
{ cat tests/e2e/auth-stub.sql
  echo "alter default privileges in schema public grant all on tables to anon, authenticated, service_role;"
  echo "alter default privileges in schema public grant all on functions to anon, authenticated, service_role;"; } | psql -v ON_ERROR_STOP=1 -d inboxe2e
psql -v ON_ERROR_STOP=1 -d inboxe2e -f inbox-db/supabase/migrations/20261008000000_inbox_install.sql
psql -d inboxe2e -c "insert into auth.users(id,email) values
  ('00000000-0000-0000-0000-00000000000a','andreas@t'),('00000000-0000-0000-0000-00000000000b','juline@t'),('00000000-0000-0000-0000-00000000000c','intruso@t');
  insert into profiles(id,full_name,role) values
  ('00000000-0000-0000-0000-00000000000a','Andreas','director'),('00000000-0000-0000-0000-00000000000b','Juline','ceo');"
# 2. PostgREST na 3001 (db-uri com o role authenticator/senha x; jwt-secret = e2e-secret-e2e-secret-e2e-secret-123456)
# 3. node tests/e2e/gateway-proxy.mjs ; node tests/e2e/calendar-mock.mjs        # portas 3002 e 3003
# 4. dois servidores de desenvolvimento:
#    VITE_SUPABASE_URL=http://127.0.0.1:3003 VITE_SUPABASE_PUBLISHABLE_KEY=x \
#    VITE_INBOX_SUPABASE_URL=http://127.0.0.1:3002 VITE_INBOX_SUPABASE_PUBLISHABLE_KEY=y \
#      npx vite dev --host 127.0.0.1 --port 5199
#    VITE_SUPABASE_URL=http://127.0.0.1:3003 VITE_SUPABASE_PUBLISHABLE_KEY=x \
#      npx vite dev --host 127.0.0.1 --port 5198        # Inbox sem configuração
# 5. node tests/e2e/inbox.e2e.mjs ./saida ; node tests/e2e/isolation.e2e.mjs ./saida
#    (zere os dados entre execuções: truncate contacts, tags cascade;)
```
Os caminhos do Chromium/Playwright e o usuário `postgres` do `psql` estão fixos no topo dos scripts; ajuste ao seu ambiente.
