#!/usr/bin/env bash
# Testes de banco (Postgres local, nada toca em projeto Supabase real).
#  A) baseline + hardening + notas/WhatsApp  -> tests/db/whatsapp_notes.test.sql
#  B) A + dados "da Astarita" + migration multiempresa -> tests/db/multitenant.test.sql
#     e reaplicar a migration precisa abortar.
set -euo pipefail
cd "$(dirname "$0")/../.."
M=inbox-db/supabase/migrations
PSQL() { su postgres -c "psql -q -v ON_ERROR_STOP=1 $*"; }
build() { # $1 = nome do banco, $2.. = migrations extras
  local db=$1; shift
  PSQL -c "'drop database if exists $db with (force)'" -c "'create database $db'" >/dev/null
  {
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
    cat $M/20261008000000_inbox_install.sql $M/20261009001027_inbox_hardening.sql $M/20261009001210_inbox_whatsapp_notes.sql
  } | su postgres -c "psql -q -v ON_ERROR_STOP=1 -d $db" 2>&1 | grep -v -E "NOTICE|WARNING|HINT" || true
}
filter() { grep -v -E "NOTICE|WARNING|HINT|^$" || true; }

echo "== A) migration de notas/WhatsApp"
build mta
out=$(su postgres -c "psql -v ON_ERROR_STOP=1 -d mta -f $PWD/tests/db/whatsapp_notes.test.sql" 2>&1) || { echo "$out" | filter; echo "FALHOU (A)"; exit 1; }
echo "$out" | grep -E "PASSARAM" 

echo "== B) multiempresa sobre dados existentes"
build mtb
su postgres -c "psql -q -v ON_ERROR_STOP=1 -d mtb" <<'SQL' 2>&1 | filter
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1','a@t'),('00000000-0000-0000-0000-0000000000b1','b@t');
insert into public.profiles (id, full_name, role) values ('00000000-0000-0000-0000-0000000000a1','Andreas','director'),('00000000-0000-0000-0000-0000000000b1','Juline','ceo');
insert into public.contacts (id, name, phone) values ('11111111-1111-4111-8111-111111111111','Cliente 1','5511999990101'),('22222222-2222-4222-8222-222222222222','Cliente 2','5511999990202');
insert into public.conversations (id, contact_id) values ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111'),('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222');
insert into public.messages (conversation_id, direction, type, body, status, wa_message_id) values
  ('33333333-3333-4333-8333-333333333333','in','text','oi','received','wamid.A1'),('44444444-4444-4444-8444-444444444444','in','text','olá','received','wamid.A2');
insert into public.opportunities (contact_id, stage_id) select '11111111-1111-4111-8111-111111111111', id from public.pipeline_stages where slug='novo-lead';
insert into public.internal_notes (contact_id, body, created_by) values ('11111111-1111-4111-8111-111111111111','nota antiga','00000000-0000-0000-0000-0000000000a1');
SQL
out=$(su postgres -c "psql -q -v ON_ERROR_STOP=1 -d mtb -f $PWD/$M/20261010000000_inbox_multitenant.sql" 2>&1) || { echo "$out" | filter; echo "FALHOU (migration multiempresa)"; exit 1; }
out=$(su postgres -c "psql -v ON_ERROR_STOP=1 -d mtb -f $PWD/tests/db/multitenant.test.sql" 2>&1) || { echo "$out" | filter; echo "FALHOU (B)"; exit 1; }
echo "$out" | grep -E "PASSARAM"
if su postgres -c "psql -q -v ON_ERROR_STOP=1 -d mtb -f $PWD/$M/20261010000000_inbox_multitenant.sql" >/dev/null 2>&1; then echo "FALHOU: reaplicar a migration deveria abortar"; exit 1; else echo "reaplicar a migration aborta (ok)"; fi
echo "== C) reversão da migration multiempresa: o esquema volta idêntico e os dados continuam"
out=$(su postgres -c "psql -q -v ON_ERROR_STOP=1 -d mtb -f $PWD/inbox-db/rollback/inbox_multitenant.revert.sql" 2>&1) || { echo "$out" | filter; echo "FALHOU (reversão)"; exit 1; }
su postgres -c "pg_dump -s -d mta" | grep -v -E "^--|^$|restrict" > /tmp/mt_before.sql
su postgres -c "pg_dump -s -d mtb" | grep -v -E "^--|^$|restrict" > /tmp/mt_after.sql
if ! diff <(sort /tmp/mt_before.sql) <(sort /tmp/mt_after.sql) >/tmp/mt_diff.txt; then echo "FALHOU: o esquema revertido difere do original:"; head -30 /tmp/mt_diff.txt; exit 1; fi
n=$(su postgres -c "psql -d mtb -tAc \"select (select count(*) from contacts)||'|'||(select count(*) from messages)||'|'||(select count(*) from profiles)||'|'||(select count(*) from knowledge_base)||'|'||(select count(*) from internal_notes)\"")
[ "$n" = "2|2|2|8|1" ] || { echo "FALHOU: dados após a reversão = $n (esperado 2|2|2|8|1)"; exit 1; }
echo "reversão ok: esquema idêntico ao anterior e nenhum dado perdido"
echo "TUDO OK"
