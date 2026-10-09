-- Testes da migration inbox_multitenant. Roda DEPOIS dela, num banco que já tinha dados da Astarita (ver run-db-tests.sh).
-- Tudo numa transação que termina em ROLLBACK.
begin;

create schema mttest;
grant usage on schema mttest to authenticated, service_role, anon;
-- Executa um comando e devolve o SQLSTATE do erro ('OK' se não deu erro).
create function mttest.fails(q text) returns text language plpgsql as $$
begin execute q; return 'OK'; exception when others then return sqlstate; end $$;
grant execute on function mttest.fails(text) to authenticated, service_role, anon;
create function mttest.rows_affected(q text) returns integer language plpgsql as $$
declare n integer; begin execute q; get diagnostics n = row_count; return n; end $$;
grant execute on function mttest.rows_affected(text) to authenticated, service_role, anon;

create temp table _r (k text primary key, v jsonb);
alter table _r disable row level security; -- o gatilho ensure_rls liga a RLS em toda tabela criada, até nas temporárias
grant all on _r to service_role, authenticated;

-- ---------------------------------------------------------------- 1) backfill
do $$
declare ast uuid := (select id from public.organizations where slug = 'astarita');
begin
  assert ast is not null, '1: empresa Astarita existe';
  assert (select count(*) from public.organizations) = 1, '1: só a Astarita antes dos testes';
  assert (select count(*) from public.contacts where org_id is distinct from ast) = 0, '1: contatos todos da Astarita';
  assert (select count(*) from public.conversations where org_id is distinct from ast) = 0, '1: conversas';
  assert (select count(*) from public.messages where org_id is distinct from ast) = 0, '1: mensagens';
  assert (select count(*) from public.internal_notes where org_id is distinct from ast) = 0, '1: notas';
  assert (select count(*) from public.opportunities where org_id is distinct from ast) = 0, '1: oportunidades';
  assert (select count(*) from public.pipeline_stages where org_id = ast) = 7, '1: 7 etapas';
  assert (select count(*) from public.knowledge_base where org_id = ast) = 8, '1: 8 seções da base';
  assert (select content from public.knowledge_base where org_id = ast and section = 'apresentacao') like 'Astarita Creative Studio.%', '1: base da Astarita preservada';
  assert (select access from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'owner', '1: Andreas é dono';
  assert (select is_platform_admin from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = true, '1: Andreas é admin da plataforma';
  assert (select is_platform_admin from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = false, '1: Juline não é admin da plataforma';
  assert (select count(*) from public.org_whatsapp where org_id = ast and webhook_key ~ '^[a-f0-9]{32}$') = 1, '1: linha de credenciais com chave de webhook';
  assert (select count(*) from public.contacts) = 2 and (select count(*) from public.messages) = 2, '1: nenhum dado perdido';
end $$;

-- ---------------------------------------------------------------- 2) segunda empresa e usuários
set local role service_role;
insert into _r select 'orgB', to_jsonb(public.inbox_create_org('Empresa B', 'empresa-b', 'pro'));
insert into _r select 'orgC', to_jsonb(public.inbox_create_org('Empresa C', 'empresa-c', 'starter'));
reset role;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'dono@b'), ('00000000-0000-0000-0000-0000000000c2', 'agente@b'),
  ('00000000-0000-0000-0000-0000000000d1', 'dono@c'), ('00000000-0000-0000-0000-0000000000e1', 'intruso@x');
insert into public.profiles (id, full_name, role, org_id, access) values
  ('00000000-0000-0000-0000-0000000000c1', 'Dono B', 'member', (select (v #>> '{}')::uuid from _r where k = 'orgB'), 'owner'),
  ('00000000-0000-0000-0000-0000000000c2', 'Agente B', 'member', (select (v #>> '{}')::uuid from _r where k = 'orgB'), 'agent'),
  ('00000000-0000-0000-0000-0000000000d1', 'Dono C', 'member', (select (v #>> '{}')::uuid from _r where k = 'orgC'), 'owner');
do $$
declare b uuid := (select (v #>> '{}')::uuid from _r where k = 'orgB');
begin
  assert (select count(*) from public.pipeline_stages where org_id = b) = 7, '2: empresa nova ganha 7 etapas';
  assert (select count(*) from public.knowledge_base where org_id = b) = 8, '2: empresa nova ganha 8 seções';
  assert (select content from public.knowledge_base where org_id = b and section = 'apresentacao') = '', '2: base nova vem vazia (nada inventado)';
  assert (select max_users from public.organizations where id = b) = 10 and (select ai_monthly_limit from public.organizations where id = b) = 1000, '2: limites do plano pro';
  assert (select count(*) from public.org_whatsapp where org_id = b) = 1, '2: credenciais criadas vazias';
  assert (select count(*) from public.organizations where slug = 'empresa-b') = 1, '2: slug';
end $$;
do $$ begin
  assert mttest.fails($q$select public.inbox_create_org('X', 'Slug Inválido!', 'starter')$q$) <> 'OK', '2: slug inválido recusado';
  assert mttest.fails($q$select public.inbox_create_org('Dup', 'empresa-b', 'starter')$q$) <> 'OK', '2: slug repetido recusado';
  assert mttest.fails($q$select public.inbox_create_org('Plano', 'empresa-d', 'ouro')$q$) <> 'OK', '2: plano inválido recusado';
end $$;

-- ---------------------------------------------------------------- 3) isolamento de leitura
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', true);
set local role authenticated;
do $$
begin
  assert (select count(*) from public.contacts) = 0, '3: empresa B não vê contatos da Astarita';
  assert (select count(*) from public.conversations) = 0, '3: conversas';
  assert (select count(*) from public.messages) = 0, '3: mensagens';
  assert (select count(*) from public.internal_notes) = 0, '3: notas';
  assert (select count(*) from public.opportunities) = 0, '3: oportunidades';
  assert (select count(*) from public.reminders) = 0, '3: lembretes';
  assert (select count(*) from public.tags) = 0 and (select count(*) from public.contact_tags) = 0, '3: etiquetas';
  assert (select count(*) from public.quick_replies) = 0 and (select count(*) from public.ai_suggestions) = 0, '3: respostas e sugestões';
  assert (select count(*) from public.pipeline_stages) = 7, '3: só as 7 etapas da própria empresa';
  assert (select count(*) from public.knowledge_base) = 8, '3: só a própria base';
  assert (select count(*) from public.knowledge_base where content like 'Astarita%') = 0, '3: base da Astarita não aparece';
  assert (select count(*) from public.profiles) = 2, '3: só os 2 perfis da própria empresa';
  assert (select count(*) from public.organizations) = 1 and (select slug from public.organizations) = 'empresa-b', '3: só a própria empresa';
  assert (select count(*) from public.webhook_events) = 0, '3: eventos de webhook';
  assert mttest.fails('select * from public.org_whatsapp') = '42501', '3: credenciais do WhatsApp inacessíveis ao navegador';
  assert public.current_org_id() = (select (v #>> '{}')::uuid from _r where k = 'orgB'), format('3: current_org_id %s vs %s', public.current_org_id(), (select v from _r where k = 'orgB'));
  assert public.is_org_admin() = true, '3: dono é admin da empresa';
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2"}', true);
do $$ begin assert public.is_org_admin() = false and public.is_inbox_member() = true, '3: atendente é membro mas não admin'; end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', true);
do $$
begin
  assert (select count(*) from public.contacts) = 2, '3: Astarita continua vendo os seus 2 contatos';
  assert (select count(*) from public.profiles) = 2, '3: Astarita vê só os seus 2 perfis';
  assert (select count(*) from public.organizations) = 1 and (select slug from public.organizations) = 'astarita', '3: Astarita vê só a própria empresa';
end $$;
-- usuário sem perfil
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1"}', true);
do $$
begin
  assert public.current_org_id() is null and public.is_inbox_member() = false, '3: sem perfil: sem empresa';
  assert (select count(*) from public.contacts) = 0 and (select count(*) from public.organizations) = 0, '3: sem perfil não vê nada';
end $$;
-- anônimo
reset role;
set local role anon;
do $$ begin
  assert mttest.fails('select * from public.contacts') = '42501', '3: anônimo não lê contatos';
  assert mttest.fails('select * from public.organizations') = '42501', '3: anônimo não lê empresas';
end $$;
reset role;

-- ---------------------------------------------------------------- 4) escrita entre empresas
-- dados da empresa B para os testes (via service role)
set local role service_role;
insert into _r select 'cB', to_jsonb(public.inbox_ingest_inbound((select (v #>> '{}')::uuid from _r where k = 'orgB'), '5511999990001', 'Cliente de B', 'wamid.B1', 'text', 'oi B', null, null, now()));
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', true);
set local role authenticated;
do $$
declare
  ast uuid := (select id from public.organizations where slug = 'astarita');  -- invisível para B: devolve null
  a_contact uuid; a_conv uuid; a_stage uuid; a_prof uuid := '00000000-0000-0000-0000-0000000000a1';
  b_contact uuid; b_stage uuid; b_conv uuid;
begin
  assert ast is null, '4: B não consegue nem descobrir o id da empresa Astarita';
  select id into b_contact from public.contacts limit 1;
  select id into b_conv from public.conversations limit 1;
  select id into b_stage from public.pipeline_stages where slug = 'novo-lead';
  assert b_contact is not null and b_conv is not null, '4: dados de B visíveis para B';
  -- ids reais da Astarita, descobertos fora da RLS (como um atacante poderia chutar)
  perform set_config('t.a_contact', coalesce((select id::text from (select null::uuid id) x), ''), true);
end $$;
reset role;
do $$
begin
  perform set_config('t.a_contact', (select id::text from public.contacts where org_id = (select id from public.organizations where slug='astarita') limit 1), true);
  perform set_config('t.a_conv', (select c.id::text from public.conversations c where c.org_id = (select id from public.organizations where slug='astarita') limit 1), true);
  perform set_config('t.a_stage', (select id::text from public.pipeline_stages where slug='novo-lead' and org_id = (select id from public.organizations where slug='astarita')), true);
  perform set_config('t.a_msg', (select m.id::text from public.messages m where m.org_id = (select id from public.organizations where slug='astarita') limit 1), true);
  perform set_config('t.a_tag', (select t.id::text from public.tags t where t.org_id = (select id from public.organizations where slug='astarita') limit 1), true);
  perform set_config('t.b_org', (select (v #>> '{}')::uuid::text from _r where k = 'orgB'), true);
  perform set_config('t.ast_org', (select id::text from public.organizations where slug='astarita'), true);
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', true);
set local role authenticated;
do $$
declare
  a_contact text := current_setting('t.a_contact'); a_conv text := current_setting('t.a_conv');
  a_stage text := current_setting('t.a_stage'); a_msg text := current_setting('t.a_msg'); a_tag text := current_setting('t.a_tag');
  ast text := current_setting('t.ast_org');
  b_contact uuid; b_conv uuid;
begin
  select id into b_contact from public.contacts limit 1;
  select id into b_conv from public.conversations limit 1;
  -- inserir como se fosse da Astarita
  assert mttest.fails(format($q$insert into public.contacts (org_id, name, phone) values (%L, 'Invasor', '5511900000000')$q$, ast)) <> 'OK', '4: B não cria contato na Astarita';
  assert mttest.fails(format($q$insert into public.tags (org_id, name) values (%L, 'x')$q$, ast)) <> 'OK', '4: B não cria etiqueta na Astarita';
  assert mttest.fails(format($q$insert into public.quick_replies (org_id, category, title, body) values (%L, 'servicos', 't', 'b')$q$, ast)) <> 'OK', '4: B não cria resposta rápida na Astarita';
  -- inserir filhos em pais da Astarita
  assert mttest.fails(format($q$insert into public.messages (conversation_id, direction, type, body, status, sent_by) values (%L, 'out', 'text', 'x', 'pending', '00000000-0000-0000-0000-0000000000c1')$q$, a_conv)) <> 'OK', '4: B não escreve mensagem em conversa da Astarita';
  assert mttest.fails(format($q$insert into public.internal_notes (contact_id, body) values (%L, 'x')$q$, a_contact)) <> 'OK', '4: B não escreve nota em contato da Astarita';
  assert mttest.fails(format($q$insert into public.reminders (contact_id, description, due_at) values (%L, 'x', now())$q$, a_contact)) <> 'OK', '4: B não cria lembrete em contato da Astarita';
  assert mttest.fails(format($q$insert into public.opportunities (contact_id, stage_id) values (%L, (select id from public.pipeline_stages limit 1))$q$, a_contact)) <> 'OK', '4: B não cria oportunidade em contato da Astarita';
  assert mttest.fails(format($q$insert into public.ai_suggestions (conversation_id, kind, content) values (%L, 'suggest', 'x')$q$, a_conv)) <> 'OK', '4: B não grava sugestão em conversa da Astarita';
  -- pais próprios, mas filho apontando para algo da Astarita
  assert mttest.fails(format($q$insert into public.opportunities (contact_id, stage_id) values (%L, %L)$q$, b_contact, a_stage)) <> 'OK', '4: oportunidade de B com etapa da Astarita recusada';
  assert mttest.fails(format($q$insert into public.contact_tags (contact_id, tag_id) values (%L, %L)$q$, b_contact, a_tag)) <> 'OK', '4: contato de B com etiqueta da Astarita recusado';
  assert mttest.fails(format($q$update public.contacts set assigned_to = '00000000-0000-0000-0000-0000000000a1' where id = %L$q$, b_contact)) <> 'OK', '4: responsável da Astarita em contato de B recusado';
  assert mttest.fails(format($q$update public.conversations set assigned_to = '00000000-0000-0000-0000-0000000000a1' where id = %L$q$, b_conv)) <> 'OK', '4: responsável de outra empresa em conversa recusado';
  assert mttest.fails(format($q$insert into public.messages (conversation_id, direction, type, body, status, sent_by, reply_to_id) values (%L, 'out', 'text', 'x', 'pending', '00000000-0000-0000-0000-0000000000c1', %L)$q$, b_conv, a_msg)) <> 'OK', '4: resposta a mensagem de outra empresa recusada';
  -- alterar/apagar o que é da Astarita
  assert mttest.rows_affected(format($q$update public.contacts set name = 'Hackeado' where id = %L$q$, a_contact)) = 0, '4: B não edita contato da Astarita';
  assert mttest.rows_affected(format($q$delete from public.contacts where id = %L$q$, a_contact)) = 0, '4: B não apaga contato da Astarita';
  assert mttest.rows_affected($q$update public.knowledge_base set content = 'invadido' where content like 'Astarita%'$q$) = 0, '4: B não edita a base da Astarita';
  assert mttest.rows_affected(format($q$update public.profiles set full_name = 'x' where id = '00000000-0000-0000-0000-0000000000a1'$q$)) = 0, '4: B não edita perfil da Astarita';
  -- mudar a empresa de um registro próprio
  assert mttest.fails(format($q$update public.contacts set org_id = %L where id = %L$q$, ast, b_contact)) <> 'OK', '4: mudar a empresa de um contato é recusado';
  assert mttest.fails(format($q$update public.profiles set org_id = %L where id = '00000000-0000-0000-0000-0000000000c1'$q$, ast)) <> 'OK', '4: usuário não se muda de empresa';
  assert mttest.fails($q$update public.profiles set access = 'owner' where id = '00000000-0000-0000-0000-0000000000c2'$q$) <> 'OK', '4: navegador não promove ninguém';
  assert mttest.fails($q$update public.profiles set is_platform_admin = true where id = '00000000-0000-0000-0000-0000000000c1'$q$) <> 'OK', '4: navegador não vira admin da plataforma';
  assert mttest.fails($q$update public.organizations set plan = 'business', max_users = 500 where true$q$) <> 'OK', '4: navegador não muda plano/limites';
  assert mttest.fails($q$insert into public.organizations (name, slug) values ('Nova', 'nova-empresa')$q$) <> 'OK', '4: navegador não cria empresa';
  assert mttest.fails($q$select public.inbox_create_org('Nova', 'nova-empresa', 'starter')$q$) = '42501', '4: navegador não chama inbox_create_org';
  assert mttest.fails(format($q$select public.inbox_ingest_inbound(%L, '5511999990009', 'x', 'wamid.HACK', 'text', 'x', null, null, now())$q$, ast)) = '42501', '4: navegador não chama a ingestão';
end $$;
-- escrita legítima de B funciona e o org_id é preenchido sozinho
do $$
declare b uuid := current_setting('t.b_org')::uuid; c uuid; n int;
begin
  insert into public.contacts (name, phone) values ('Contato do B', '5511999990002') returning id into c;
  assert (select org_id from public.contacts where id = c) = b, '4: org_id do contato preenchido sozinho';
  insert into public.reminders (contact_id, description, due_at) values (c, 'ligar', now());
  insert into public.internal_notes (contact_id, body) values (c, 'nota de B');
  assert (select org_id from public.internal_notes where contact_id = c) = b, '4: org_id da nota vem do contato';
  insert into public.tags (name) values ('VIP');
  insert into public.contact_tags (contact_id, tag_id) select c, id from public.tags where name = 'VIP';
  assert (select org_id from public.contact_tags where contact_id = c) = b, '4: org_id de contact_tags';
  insert into public.opportunities (contact_id, stage_id) select c, id from public.pipeline_stages where slug = 'em-conversa';
  assert (select org_id from public.opportunities where contact_id = c) = b, '4: org_id da oportunidade';
  insert into public.messages (conversation_id, direction, type, body, status, sent_by)
    select id, 'out', 'text', 'olá', 'pending', '00000000-0000-0000-0000-0000000000c1' from public.conversations limit 1;
  assert (select count(*) from public.messages where org_id = b) = 2, '4: mensagem pendente de B gravada com a empresa certa';
  -- mesmo telefone e mesma etiqueta/seção em empresas diferentes são permitidos (unicidade é por empresa)
end $$;
reset role;

-- ---------------------------------------------------------------- 5) unicidade por empresa
do $$
declare ast uuid := current_setting('t.ast_org')::uuid; b uuid := current_setting('t.b_org')::uuid; phone text;
begin
  select c.phone into phone from public.contacts c where c.org_id = ast limit 1;
  insert into public.contacts (org_id, name, phone) values (b, 'Mesmo telefone em B', phone);
  assert mttest.fails(format($q$insert into public.contacts (org_id, name, phone) values (%L, 'Dup', %L)$q$, b, phone)) = '23505', '5: duplicidade dentro da mesma empresa continua barrada';
  insert into public.tags (org_id, name) values (ast, 'VIP');
  assert (select count(*) from public.tags where lower(name) = 'vip') = 2, '5: mesma etiqueta em duas empresas';
  assert mttest.fails(format($q$insert into public.tags (org_id, name) values (%L, 'vip')$q$, ast)) = '23505', '5: etiqueta repetida na mesma empresa barrada';
  assert mttest.fails(format($q$insert into public.knowledge_base (org_id, section, title) values (%L, 'faq', 'x')$q$, b)) = '23505', '5: seção repetida na mesma empresa barrada';
end $$;

-- ---------------------------------------------------------------- 6) ingestão por empresa
set local role service_role;
do $$
declare ast uuid := current_setting('t.ast_org')::uuid; b uuid := current_setting('t.b_org')::uuid;
        r1 jsonb; r2 jsonb; r3 jsonb;
begin
  r1 := public.inbox_ingest_inbound(ast, '5511977770000', 'Fulano', 'wamid.X1', 'text', 'oi', null, null, now());
  r2 := public.inbox_ingest_inbound(b, '5511977770000', 'Fulano', 'wamid.X2', 'text', 'oi', null, null, now());
  assert r1->>'contact_id' <> r2->>'contact_id', '6: mesmo telefone vira contatos diferentes em empresas diferentes';
  assert (select org_id from public.contacts where id = (r1->>'contact_id')::uuid) = ast, '6: contato da Astarita';
  assert (select org_id from public.contacts where id = (r2->>'contact_id')::uuid) = b, '6: contato de B';
  assert (select org_id from public.messages where wa_message_id = 'wamid.X2') = b, '6: mensagem de B';
  assert (select s.org_id from public.opportunities o join public.pipeline_stages s on s.id = o.stage_id where o.contact_id = (r2->>'contact_id')::uuid) = b, '6: oportunidade cai no funil de B';
  r3 := public.inbox_ingest_inbound(b, '5511977770000', 'Fulano', 'wamid.X2', 'text', 'oi', null, null, now());
  assert (r3->>'duplicate')::boolean = true, '6: reentrega é duplicada';
  -- eco
  perform public.inbox_ingest_echo(b, '5511977770000', 'wamid.E1', 'text', 'pelo app', null, null, now());
  assert (select org_id from public.messages where wa_message_id = 'wamid.E1') = b, '6: eco na empresa certa';
  -- status: só a empresa dona mexe
  perform public.inbox_ingest_echo(b, '5511977770000', 'wamid.E2', 'text', 'x', null, null, now());
  assert public.inbox_apply_status(ast, 'wamid.E2', 'delivered', now(), null, null) = 0, '6: status vindo de outra empresa é ignorado';
  assert (select status from public.messages where wa_message_id = 'wamid.E2') = 'sent', '6: mensagem de B intacta';
  assert public.inbox_apply_status(b, 'wamid.E2', 'delivered', now(), null, null) = 1, '6: status da empresa dona vale';
  assert public.inbox_apply_status(b, 'wamid.E2', 'sent', now(), null, null) = 0, '6: status não retrocede';
  -- empresa inexistente
  assert mttest.fails(format($q$select public.inbox_ingest_inbound(%L, '5511900001111', 'x', 'wamid.Z', 'text', 'x', null, null, now())$q$, gen_random_uuid())) <> 'OK', '6: empresa inexistente recusada';
end $$;
reset role;

-- ---------------------------------------------------------------- 7) empresa suspensa
update public.organizations set status = 'suspended' where slug = 'empresa-c';
set local role service_role;
do $$
declare c uuid := (select id from public.organizations where slug = 'empresa-c');
begin
  assert mttest.fails(format($q$select public.inbox_ingest_inbound(%L, '5511900002222', 'x', 'wamid.S1', 'text', 'x', null, null, now())$q$, c)) <> 'OK', '7: empresa suspensa não recebe mensagens';
end $$;
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1"}', true);
set local role authenticated;
do $$ begin
  assert public.current_org_id() is null and public.is_inbox_member() = false, '7: usuário de empresa suspensa perde o acesso';
  assert (select count(*) from public.pipeline_stages) = 0 and (select count(*) from public.profiles) = 0, '7: e não lê nada';
  assert mttest.fails($q$insert into public.contacts (name, phone) values ('x', '5511900003333')$q$) <> 'OK', '7: nem escreve';
end $$;
reset role;
update public.organizations set status = 'active' where slug = 'empresa-c';

-- ---------------------------------------------------------------- 8) mídia por empresa
insert into storage.objects (bucket_id, name) values
  ('inbox-media', current_setting('t.ast_org') || '/a.jpg'), ('inbox-media', current_setting('t.b_org') || '/b.jpg');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', true);
set local role authenticated;
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'inbox-media') = 1, '8: B só enxerga a mídia da pasta dele';
  assert (select name from storage.objects where bucket_id = 'inbox-media') like current_setting('t.b_org') || '/%', '8: e é a dele';
end $$;
reset role;

-- ---------------------------------------------------------------- 9) privilégios das funções e tabelas novas
do $$
begin
  assert not has_table_privilege('authenticated', 'public.org_whatsapp', 'SELECT'), '9: org_whatsapp fechada';
  assert not has_table_privilege('anon', 'public.organizations', 'SELECT'), '9: anon sem organizations';
  assert not has_table_privilege('authenticated', 'public.organizations', 'UPDATE'), '9: authenticated sem update em organizations';
  assert not has_function_privilege('authenticated', 'public.inbox_create_org(text,text,text)', 'EXECUTE'), '9: inbox_create_org só service_role';
  assert not has_function_privilege('authenticated', 'public.inbox_ingest_inbound(uuid,text,text,text,text,text,text,text,timestamptz)', 'EXECUTE'), '9: ingestão só service_role';
  assert not has_function_privilege('anon', 'public.inbox_apply_status(uuid,text,text,timestamptz,text,text)', 'EXECUTE'), '9: apply_status só service_role';
  assert not has_function_privilege('authenticated', 'public.inbox_fill_org()', 'EXECUTE'), '9: funções de gatilho fechadas';
  assert has_function_privilege('service_role', 'public.inbox_create_org(text,text,text)', 'EXECUTE'), '9: service_role cria empresas';
  assert to_regprocedure('public.inbox_ingest_inbound(text,text,text,text,text,text,text,timestamptz)') is null, '9: função antiga (sem empresa) removida';
  assert (select count(*) from public.contacts where org_id is null) = 0, '9: nenhum registro sem empresa';
  assert not exists (select 1 from information_schema.columns where table_schema = 'public' and column_name = 'org_id' and is_nullable = 'YES' and table_name <> 'webhook_events'), '9: org_id é obrigatório em todas as tabelas (exceto webhook_events)';
end $$;

-- ---------------------------------------------------------------- 10) apagar uma empresa leva tudo dela junto (e só dela)
do $$
declare c uuid := (select id from public.organizations where slug = 'empresa-c'); n int;
begin
  insert into public.contacts (org_id, name, phone) values (c, 'Contato C', '5511900004444');
  perform public.inbox_ingest_inbound(c, '5511900005555', 'Fulano C', 'wamid.C1', 'text', 'oi', null, null, now());
  assert (select count(*) from public.contacts where org_id = c) = 2, '10: dados da empresa C criados';
  begin delete from public.organizations where id = c; assert false, '10: empresa com pessoas não pode ser apagada sem antes remover as pessoas'; exception when foreign_key_violation then null; end;
  delete from public.profiles where org_id = c;
  delete from public.organizations where id = c;
  assert (select count(*) from public.pipeline_stages where org_id = c) = 0, '10: etapas apagadas junto';
  assert (select count(*) from public.contacts where org_id = c) = 0, '10: contatos apagados junto';
  assert (select count(*) from public.messages where org_id = c) = 0, '10: mensagens apagadas junto';
  assert (select count(*) from public.knowledge_base where org_id = c) = 0, '10: base apagada junto';
  assert (select count(*) from public.org_whatsapp where org_id = c) = 0, '10: credenciais apagadas junto';
  assert (select count(*) from public.contacts where org_id = (select id from public.organizations where slug = 'astarita')) >= 2, '10: dados da Astarita intactos';
end $$;

select 'TODOS OS TESTES MULTIEMPRESA PASSARAM' as resultado;
rollback;
