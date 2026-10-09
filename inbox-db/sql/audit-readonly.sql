-- Astarita Inbox: auditoria SOMENTE LEITURA do banco instalado.
-- Cole no SQL Editor do projeto Astarita Inbox e rode. Não escreve nada, não cria nada.
-- Devolve uma linha por verificação, com o valor encontrado, o esperado e OK/FALHA.
-- Se der erro 'relation ... does not exist', a instalação ainda não foi feita neste projeto.
begin read only;

with fase as (
  -- A auditoria reconhece três estados: baseline (13 tabelas), + Fase 3/4 (internal_notes e funções do WhatsApp) e
  -- + multiempresa (organizations, org_whatsapp, org_id em tudo).
  select to_regclass('public.internal_notes') is not null as completa,
         to_regclass('public.organizations') is not null as saas),
inbox_tables(t) as (
  select t from (values
    ('profiles'),('contacts'),('conversations'),('messages'),('tags'),('contact_tags'),
    ('pipeline_stages'),('opportunities'),('quick_replies'),('reminders'),('knowledge_base'),
    ('ai_suggestions'),('webhook_events')) v(t)
  union all select 'internal_notes' from fase where completa
  union all select 'organizations' from fase where saas
  union all select 'org_whatsapp' from fase where saas),
rel as (
  select c.oid, c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'),
checks(ordem, verificacao, encontrado, esperado) as (
  select 1, 'tabelas do Inbox no schema public', (select count(*)::text from rel where relname in (select t from inbox_tables)), (select case when saas then '16' when completa then '14' else '13' end from fase)
  union all select 2, 'tabelas FORA do Inbox no schema public (projeto deve ser exclusivo)', (select count(*)::text from rel where relname not in (select t from inbox_tables)), '0'
  union all select 3, 'tabelas do Inbox com RLS ligada', (select count(*)::text from rel where relname in (select t from inbox_tables) and relrowsecurity), (select case when saas then '16' when completa then '14' else '13' end from fase)
  union all select 4, 'políticas RLS', (select count(*)::text from pg_policies where schemaname = 'public'), (select case when saas then '46' when completa then '45' else '42' end from fase)
  union all select 5, 'constraints validadas', (select count(*)::text from pg_constraint k join pg_namespace n on n.oid = k.connamespace where n.nspname = 'public' and k.convalidated), (select case when saas then '96' when completa then '63' else '59' end from fase)
  union all select 6, 'constraints NÃO validadas', (select count(*)::text from pg_constraint k join pg_namespace n on n.oid = k.connamespace where n.nspname = 'public' and not k.convalidated), '0'
  union all select 7, 'triggers de aplicação', (select count(*)::text from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not t.tgisinternal), (select case when saas then '38' else '7' end from fase)
  union all select 8, 'publicação supabase_realtime existe', (select count(*)::text from pg_publication where pubname = 'supabase_realtime'), '1'
  union all select 9, 'tabelas no Realtime (ordem alfabética)', coalesce((select string_agg(tablename, ',' order by tablename) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'), 'nenhuma'), (select case when completa then 'contact_tags,contacts,conversations,internal_notes,messages,opportunities,quick_replies,reminders,tags' else 'contact_tags,contacts,conversations,messages,tags' end from fase)
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
  union all select 26, 'estado reconhecido do esquema (informativo)', (select case when saas then 'baseline + Fase 3/4 + multiempresa' when completa then 'baseline + Fase 3/4' else 'baseline' end from fase), 'informativo'
  union all select 27, 'funções de ingestão do WhatsApp só para service_role (Fase 3/4)', (select case when not completa then 'n/a' when saas then (has_function_privilege('service_role', 'public.inbox_ingest_inbound(uuid,text,text,text,text,text,text,text,timestamptz)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_ingest_inbound(uuid,text,text,text,text,text,text,text,timestamptz)', 'EXECUTE') and not has_function_privilege('anon', 'public.inbox_ingest_inbound(uuid,text,text,text,text,text,text,text,timestamptz)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_apply_status(uuid,text,text,timestamptz,text,text)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_ingest_echo(uuid,text,text,text,text,text,text,timestamptz)', 'EXECUTE'))::text else (has_function_privilege('service_role', 'public.inbox_ingest_inbound(text,text,text,text,text,text,text,timestamptz)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_ingest_inbound(text,text,text,text,text,text,text,timestamptz)', 'EXECUTE') and not has_function_privilege('anon', 'public.inbox_ingest_inbound(text,text,text,text,text,text,text,timestamptz)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_apply_status(text,text,timestamptz,text,text)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_ingest_echo(text,text,text,text,text,text,timestamptz)', 'EXECUTE'))::text end from fase), (select case when completa then 'true' else 'n/a' end from fase)
  union all select 28, 'bucket inbox-media existe e é privado (Fase 3/4)', (select case when not completa then 'n/a' else coalesce((select (not b.public)::text from storage.buckets b where b.id = 'inbox-media'), 'ausente') end from fase), (select case when completa then 'true' else 'n/a' end from fase)
  union all select 31, 'org_id obrigatório em todas as tabelas de dados (multiempresa)', (select case when not saas then 'n/a' else (select count(*)::text from information_schema.columns c where c.table_schema = 'public' and c.column_name = 'org_id' and c.is_nullable = 'NO' and c.table_name in ('contacts','conversations','messages','tags','contact_tags','pipeline_stages','opportunities','quick_replies','reminders','knowledge_base','ai_suggestions','internal_notes','profiles')) end from fase), (select case when saas then '13' else 'n/a' end from fase)
  union all select 32, 'registros sem empresa (multiempresa)', (select case when not saas then 'n/a' else (select (select count(*) from public.contacts c where to_jsonb(c) ->> 'org_id' is null) + (select count(*) from public.profiles p where to_jsonb(p) ->> 'org_id' is null))::text end from fase), (select case when saas then '0' else 'n/a' end from fase)
  union all select 33, 'authenticated NÃO lê org_whatsapp (credenciais) nem escreve em organizations', (select case when not saas then 'n/a' else (not has_table_privilege('authenticated', 'public.org_whatsapp', 'SELECT') and not has_table_privilege('anon', 'public.org_whatsapp', 'SELECT') and not has_table_privilege('authenticated', 'public.organizations', 'UPDATE') and not has_table_privilege('authenticated', 'public.organizations', 'INSERT') and not has_table_privilege('anon', 'public.organizations', 'SELECT'))::text end from fase), (select case when saas then 'true' else 'n/a' end from fase)
  union all select 34, 'funções de empresa só para service_role (create_org e ingestão com empresa)', (select case when not saas then 'n/a' else (has_function_privilege('service_role', 'public.inbox_create_org(text,text,text)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_create_org(text,text,text)', 'EXECUTE') and not has_function_privilege('anon', 'public.inbox_create_org(text,text,text)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_ingest_inbound(uuid,text,text,text,text,text,text,text,timestamptz)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.inbox_apply_status(uuid,text,text,timestamptz,text,text)', 'EXECUTE'))::text end from fase), (select case when saas then 'true' else 'n/a' end from fase)
  union all select 35, 'política de mídia por pasta da empresa', (select case when not saas then 'n/a' else (select count(*)::text from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'inbox_org_read_media') end from fase), (select case when saas then '1' else 'n/a' end from fase)
  union all select 36, 'empresas cadastradas (informativo)', (select case when not saas then 'n/a' else (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.organizations', false, true, '')))[1]::text end from fase), 'informativo'
  union all select 25, 'perfis sem usuário correspondente', (select count(*)::text from public.profiles p where not exists (select 1 from auth.users u where u.id = p.id)), '0'
)
select ordem, verificacao, encontrado, esperado,
       case when esperado = 'informativo' then '-' when esperado = 'n/a' then '-' when encontrado = esperado then 'OK' else 'FALHA' end as resultado
from checks order by ordem;

rollback;
