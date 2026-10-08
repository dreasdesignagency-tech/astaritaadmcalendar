-- Astarita Inbox: auditoria SOMENTE LEITURA do banco instalado.
-- Cole no SQL Editor do projeto Astarita Inbox e rode. Não escreve nada, não cria nada.
-- Devolve uma linha por verificação, com o valor encontrado, o esperado e OK/FALHA.
-- Se der erro 'relation ... does not exist', a instalação ainda não foi feita neste projeto.
begin read only;

with inbox_tables(t) as (values
  ('profiles'),('contacts'),('conversations'),('messages'),('tags'),('contact_tags'),
  ('pipeline_stages'),('opportunities'),('quick_replies'),('reminders'),('knowledge_base'),
  ('ai_suggestions'),('webhook_events')),
rel as (
  select c.oid, c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'),
checks(ordem, verificacao, encontrado, esperado) as (
  select 1, 'tabelas do Inbox no schema public', (select count(*)::text from rel where relname in (select t from inbox_tables)), '13'
  union all select 2, 'tabelas FORA do Inbox no schema public (projeto deve ser exclusivo)', (select count(*)::text from rel where relname not in (select t from inbox_tables)), '0'
  union all select 3, 'tabelas do Inbox com RLS ligada', (select count(*)::text from rel where relname in (select t from inbox_tables) and relrowsecurity), '13'
  union all select 4, 'políticas RLS', (select count(*)::text from pg_policies where schemaname = 'public'), '42'
  union all select 5, 'constraints validadas', (select count(*)::text from pg_constraint k join pg_namespace n on n.oid = k.connamespace where n.nspname = 'public' and k.convalidated), '59'
  union all select 6, 'constraints NÃO validadas', (select count(*)::text from pg_constraint k join pg_namespace n on n.oid = k.connamespace where n.nspname = 'public' and not k.convalidated), '0'
  union all select 7, 'triggers de aplicação', (select count(*)::text from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not t.tgisinternal), '7'
  union all select 8, 'publicação supabase_realtime existe', (select count(*)::text from pg_publication where pubname = 'supabase_realtime'), '1'
  union all select 9, 'tabelas no Realtime (ordem alfabética)', coalesce((select string_agg(tablename, ',' order by tablename) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'), 'nenhuma'), 'contact_tags,contacts,conversations,messages,tags'
  union all select 10, 'etapas do funil (sementes)', (select count(*)::text from public.pipeline_stages), '7'
  union all select 11, 'seções da base de conhecimento (sementes)', (select count(*)::text from public.knowledge_base), '8'
  union all select 12, 'função is_inbox_member é SECURITY DEFINER', (select p.prosecdef::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'is_inbox_member'), 'true'
  union all select 13, 'authenticated pode atualizar profiles.role', has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')::text, 'false'
  union all select 14, 'authenticated pode atualizar profiles.active', has_column_privilege('authenticated', 'public.profiles', 'active', 'UPDATE')::text, 'false'
  union all select 15, 'authenticated pode atualizar profiles.full_name', has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')::text, 'true'
  union all select 16, 'tabelas com SELECT para anon', (select count(*)::text from rel where relname in (select t from inbox_tables) and has_table_privilege('anon', oid, 'SELECT')), '0'
  union all select 17, 'tabelas com TRUNCATE para authenticated', (select count(*)::text from rel where relname in (select t from inbox_tables) and has_table_privilege('authenticated', oid, 'TRUNCATE')), '0'
  union all select 18, 'authenticated pode UPDATE em messages (deve ser só backend)', has_table_privilege('authenticated', 'public.messages', 'UPDATE')::text, 'false'
  union all select 19, 'authenticated pode escrever em webhook_events', (has_table_privilege('authenticated', 'public.webhook_events', 'INSERT') or has_table_privilege('authenticated', 'public.webhook_events', 'UPDATE') or has_table_privilege('authenticated', 'public.webhook_events', 'DELETE'))::text, 'false'
  union all select 20, 'authenticated pode alterar pipeline_stages', (has_table_privilege('authenticated', 'public.pipeline_stages', 'INSERT') or has_table_privilege('authenticated', 'public.pipeline_stages', 'UPDATE') or has_table_privilege('authenticated', 'public.pipeline_stages', 'DELETE'))::text, 'false'
  union all select 21, 'authenticated pode executar inbox_set_updated_at()', coalesce(has_function_privilege('authenticated', to_regprocedure('public.inbox_set_updated_at()'), 'EXECUTE')::text, 'função ausente'), 'false'
  union all select 22, 'anon pode executar is_inbox_member()', coalesce(has_function_privilege('anon', to_regprocedure('public.is_inbox_member()'), 'EXECUTE')::text, 'função ausente'), 'false'
  union all select 23, 'usuários em Authentication (informativo)', (select count(*)::text from auth.users), 'informativo'
  union all select 24, 'perfis do Inbox (informativo)', (select count(*)::text from public.profiles), 'informativo'
  union all select 25, 'perfis sem usuário correspondente', (select count(*)::text from public.profiles p where not exists (select 1 from auth.users u where u.id = p.id)), '0'
)
select ordem, verificacao, encontrado, esperado,
       case when esperado = 'informativo' then '-' when encontrado = esperado then 'OK' else 'FALHA' end as resultado
from checks order by ordem;

rollback;
