#!/usr/bin/env bash
# Sobe/derruba a pilha de teste local do Inbox (nada disto toca em projeto Supabase real).
# Uso: POSTGREST_BIN=/caminho/postgrest tests/e2e/stack.sh up|down|reset-db
# Requer: PostgreSQL 16 (usuário postgres via su), binário do PostgREST, Node 22.
set -euo pipefail
cd "$(dirname "$0")/../.."
RUN=${STACK_DIR:-/tmp/inbox-stack}; mkdir -p "$RUN"
PSQL() { su postgres -c "psql -q -v ON_ERROR_STOP=1 $*"; }
SECRET='e2e-secret-e2e-secret-e2e-secret-123456'
jwt() { node -e "const c=require('crypto');const b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');const h=b({alg:'HS256',typ:'JWT'}),p=b({role:'$1',iss:'e2e'});console.log(h+'.'+p+'.'+c.createHmac('sha256','$SECRET').update(h+'.'+p).digest('base64url'))"; }

reset_db() {
  pg_ctlcluster 16 main start 2>/dev/null || true; sleep 2
  out=$(su postgres -c "psql -q -v ON_ERROR_STOP=1 -c 'drop database if exists inboxe2e with (force)' -c 'create database inboxe2e'" 2>&1) \
    || { echo "$out"; echo "FALHA ao recriar o banco"; exit 1; }
  out=$( {
    cat tests/e2e/auth-stub.sql tests/db/storage-stub.sql
    echo "alter default privileges in schema public grant all on tables to anon, authenticated, service_role;"
    cat <<'SQL'
create function public.rls_auto_enable() returns event_trigger language plpgsql security definer set search_path = pg_catalog as $$
declare cmd record;
begin
  for cmd in select * from pg_event_trigger_ddl_commands() where command_tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') loop
    execute format('alter table %s enable row level security', cmd.object_identity);
  end loop;
end $$;
create event trigger ensure_rls on ddl_command_end when tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') execute function public.rls_auto_enable();
SQL
    cat inbox-db/supabase/migrations/20261008000000_inbox_install.sql
    cat inbox-db/proposed/inbox_hardening.sql inbox-db/proposed/inbox_whatsapp_notes.sql
    cat <<'SQL'
insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000000a','andreas@t'),('00000000-0000-0000-0000-00000000000b','juline@t'),('00000000-0000-0000-0000-00000000000c','intruso@t');
insert into profiles(id,full_name,role) values ('00000000-0000-0000-0000-00000000000a','Andreas','director'),('00000000-0000-0000-0000-00000000000b','Juline','ceo');
SQL
  } | su postgres -c "psql -q -v ON_ERROR_STOP=1 -d inboxe2e" 2>&1 ) \
    || { echo "$out" | grep -v -E "NOTICE|WARNING|HINT"; echo "FALHA ao montar o banco de teste"; exit 1; }
}

case "${1:-}" in
  reset-db) reset_db ;;
  up)
    : "${POSTGREST_BIN:?defina POSTGREST_BIN}"
    reset_db
    cat > "$RUN/pgrst.conf" <<CONF
db-uri = "postgres://authenticator:x@127.0.0.1:5432/inboxe2e"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRET"
server-host = "127.0.0.1"
server-port = 3001
CONF
    nohup "$POSTGREST_BIN" "$RUN/pgrst.conf" > "$RUN/postgrest.log" 2>&1 & echo $! >> "$RUN/pids"
    for f in gateway-proxy calendar-mock graph-mock; do nohup node tests/e2e/$f.mjs > "$RUN/$f.log" 2>&1 & echo $! >> "$RUN/pids"; done
    SERVICE=$(jwt service_role)
    CAL="VITE_SUPABASE_URL=http://127.0.0.1:3003 VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_cal"
    INBOX="VITE_INBOX_SUPABASE_URL=http://127.0.0.1:3002 VITE_INBOX_SUPABASE_PUBLISHABLE_KEY=sb_publishable_inbox INBOX_SUPABASE_URL=http://127.0.0.1:3002 INBOX_SUPABASE_SERVICE_ROLE_KEY=$SERVICE"
    WA="WHATSAPP_ACCESS_TOKEN=token-de-teste-da-meta WHATSAPP_PHONE_NUMBER_ID=PHONE_ID WHATSAPP_VERIFY_TOKEN=verify-teste META_APP_SECRET=segredo-do-app-teste WHATSAPP_API_VERSION=v21.0 WHATSAPP_GRAPH_BASE_URL=http://127.0.0.1:3004"
    # 5199: tudo configurado. 5198: Inbox sem variáveis (tela "não configurado"). 5197: servidor com Supabase mas SEM WhatsApp/IA.
    (env $CAL $INBOX $WA ${EXTRA_5199:-} nohup npx vite dev --host 127.0.0.1 --port 5199 > "$RUN/dev-5199.log" 2>&1 & echo $! >> "$RUN/pids")
    (env $CAL nohup npx vite dev --host 127.0.0.1 --port 5198 > "$RUN/dev-5198.log" 2>&1 & echo $! >> "$RUN/pids")
    (env $CAL $INBOX nohup npx vite dev --host 127.0.0.1 --port 5197 > "$RUN/dev-5197.log" 2>&1 & echo $! >> "$RUN/pids")
    sleep 14; echo "pilha no ar ($RUN)" ;;
  down)
    [ -f "$RUN/pids" ] && xargs -r kill < "$RUN/pids" 2>/dev/null || true; rm -f "$RUN/pids"
    pkill -x postgrest 2>/dev/null || true
    # vite roda como filhos de npm exec: encerra pelas portas
    for port in 5197 5198 5199; do fuser -k $port/tcp 2>/dev/null || true; done
    echo "pilha derrubada" ;;
  *) echo "uso: stack.sh up|down|reset-db"; exit 1 ;;
esac
