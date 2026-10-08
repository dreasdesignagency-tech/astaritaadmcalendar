-- Testes da migration inbox_whatsapp_notes. Rodar com: psql -v ON_ERROR_STOP=1 -f este arquivo.
-- Tudo dentro de uma transação que termina em ROLLBACK: não deixa nada no banco.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@t'), ('00000000-0000-0000-0000-0000000000b1', 'b@t'), ('00000000-0000-0000-0000-0000000000c1', 'intruso@t');
insert into public.profiles (id, full_name, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Andreas', 'director'), ('00000000-0000-0000-0000-0000000000b1', 'Juline', 'ceo');

create temp table _r (k text primary key, v jsonb);
grant all on _r to service_role;

set local role service_role;

-- 1) Primeira mensagem de número desconhecido cria contato, conversa, mensagem e oportunidade
insert into _r select 'm1', public.inbox_ingest_inbound('5511999998888', 'Maria Souza', 'wamid.IN1', 'text', 'Oi! Vocês fazem social media?', null, null, now() - interval '2 minutes');
do $$
declare r jsonb := (select v from _r where k = 'm1'); c record; n int;
begin
  assert (r->>'duplicate')::boolean = false, '1: não deveria ser duplicada';
  assert (r->>'contact_created')::boolean = true, '1: deveria criar contato';
  select * into c from public.conversations where id = (r->>'conversation_id')::uuid;
  assert c.status = 'waiting' and c.unread_count = 1, format('1: conversa %s unread %s', c.status, c.unread_count);
  assert c.last_message_preview = 'Oi! Vocês fazem social media?', '1: prévia';
  assert c.last_inbound_at is not null, '1: last_inbound_at (janela de 24h)';
  assert (select name from public.contacts where id = (r->>'contact_id')::uuid) = 'Maria Souza', '1: nome do perfil do WhatsApp';
  select count(*) into n from public.opportunities o join public.pipeline_stages s on s.id = o.stage_id where o.contact_id = (r->>'contact_id')::uuid and s.slug = 'novo-lead';
  assert n = 1, '1: oportunidade em Novo lead';
end $$;

-- 2) Reentrega do webhook (mesmo wa_message_id) não duplica nem soma contador
insert into _r select 'm1b', public.inbox_ingest_inbound('5511999998888', 'Maria Souza', 'wamid.IN1', 'text', 'Oi! Vocês fazem social media?', null, null, now());
do $$
declare r jsonb := (select v from _r where k = 'm1b'); n int; u int;
begin
  assert (r->>'duplicate')::boolean = true, '2: deveria ser duplicada';
  select count(*) into n from public.messages where wa_message_id = 'wamid.IN1';
  select unread_count into u from public.conversations where id = (r->>'conversation_id')::uuid;
  assert n = 1 and u = 1, format('2: mensagens %s, unread %s', n, u);
end $$;

-- 3) Segunda mensagem soma, atualiza a prévia; mídia sem legenda usa rótulo
insert into _r select 'm2', public.inbox_ingest_inbound('5511999998888', 'Maria Souza', 'wamid.IN2', 'image', null, 'image/jpeg', 'MEDIA123', now());
do $$
declare c record;
begin
  select * into c from public.conversations where contact_id = (select (v->>'contact_id')::uuid from _r where k = 'm1');
  assert c.unread_count = 2 and c.last_message_preview = 'Imagem', format('3: unread %s prévia %s', c.unread_count, c.last_message_preview);
  assert (select wa_media_id from public.messages where wa_message_id = 'wamid.IN2') = 'MEDIA123', '3: id da mídia guardado';
end $$;

-- 4) Nono dígito: o mesmo cliente chega sem o 9 (e o contrário) e não vira contato novo
insert into _r select 'v1', public.inbox_ingest_inbound('551199998888', null, 'wamid.IN3', 'text', 'sem nono dígito', null, null, now());
insert into _r select 'v2', public.inbox_ingest_inbound('551188887777', 'Sem Nove', 'wamid.IN4', 'text', 'contato salvo sem 9', null, null, now());
insert into _r select 'v3', public.inbox_ingest_inbound('5511988887777', null, 'wamid.IN5', 'text', 'agora com 9', null, null, now());
do $$
begin
  assert (select v->>'contact_id' from _r where k = 'v1') = (select v->>'contact_id' from _r where k = 'm1'), '4: 12 dígitos deveria achar o contato de 13';
  assert (select (v->>'contact_created')::boolean from _r where k = 'v1') = false, '4: não deveria criar contato';
  assert (select v->>'contact_id' from _r where k = 'v3') = (select v->>'contact_id' from _r where k = 'v2'), '4: 13 dígitos deveria achar o contato de 12';
  assert (select count(*) from public.contacts) = 2, format('4: contatos = %s (esperado 2)', (select count(*) from public.contacts));
end $$;

-- 5) Conversa resolvida reabre quando o cliente escreve de novo (sem responsável: waiting; com: in_progress)
reset role;
update public.conversations set status = 'resolved' where contact_id = (select (v->>'contact_id')::uuid from _r where k = 'm1');
set local role service_role;
insert into _r select 'r1', public.inbox_ingest_inbound('5511999998888', null, 'wamid.IN6', 'text', 'voltei', null, null, now());
do $$
begin
  assert (select (v->>'conversation_reopened')::boolean from _r where k = 'r1') = true, '5: deveria reabrir';
  assert (select status from public.conversations where contact_id = (select (v->>'contact_id')::uuid from _r where k = 'm1')) = 'waiting', '5: sem responsável volta para waiting';
end $$;
reset role;
update public.conversations set status = 'resolved', assigned_to = '00000000-0000-0000-0000-0000000000a1' where contact_id = (select (v->>'contact_id')::uuid from _r where k = 'm1');
set local role service_role;
insert into _r select 'r2', public.inbox_ingest_inbound('5511999998888', null, 'wamid.IN7', 'text', 'de novo', null, null, now());
do $$
begin
  assert (select status from public.conversations where contact_id = (select (v->>'contact_id')::uuid from _r where k = 'm1')) = 'in_progress', '5: com responsável volta para in_progress';
end $$;

-- 6) Eco do app WhatsApp Business (coexistência): entra como enviada, sem contar como não lida
do $$ declare u0 int; begin select unread_count into u0 from public.conversations where contact_id = (select (v->>'contact_id')::uuid from _r where k = 'm1'); perform set_config('t.u0', u0::text, true); end $$;
insert into _r select 'e1', public.inbox_ingest_echo('5511999998888', 'wamid.ECHO1', 'text', 'Resposta pelo celular', null, null, now());
insert into _r select 'e1b', public.inbox_ingest_echo('5511999998888', 'wamid.ECHO1', 'text', 'Resposta pelo celular', null, null, now());
do $$
declare m record;
begin
  select * into m from public.messages where wa_message_id = 'wamid.ECHO1';
  assert m.direction = 'out' and m.status = 'sent' and m.sent_by is null, '6: eco como enviada';
  assert (select (v->>'duplicate')::boolean from _r where k = 'e1b') = true, '6: eco duplicado detectado';
  assert (select unread_count from public.conversations where id = m.conversation_id)::text = current_setting('t.u0'), '6: eco não soma não lidas';
  assert (select last_message_preview from public.conversations where id = m.conversation_id) = 'Resposta pelo celular', '6: prévia atualizada pelo eco';
end $$;

-- 7) Status de entrega: só avança; fora de ordem não regride; failed só antes de entregar
reset role;
insert into public.messages (conversation_id, direction, body, status, sent_by, wa_message_id) values
  ((select id from public.conversations limit 1), 'out', 'a', 'pending', '00000000-0000-0000-0000-0000000000a1', 'wamid.OUT1'),
  ((select id from public.conversations limit 1), 'out', 'b', 'pending', '00000000-0000-0000-0000-0000000000a1', 'wamid.OUT2');
set local role service_role;
do $$
begin
  assert public.inbox_apply_status('wamid.OUT1', 'delivered', now(), null, null) = 1, '7: delivered aplicado';
  assert public.inbox_apply_status('wamid.OUT1', 'sent', now(), null, null) = 0, '7: sent atrasado ignorado';
end $$;
do $$
begin
  assert (select status from public.messages where wa_message_id = 'wamid.OUT1') = 'delivered', '7: continua delivered';
  assert public.inbox_apply_status('wamid.OUT1', 'read', now(), null, null) = 1, '7: read aplicado';
  assert public.inbox_apply_status('wamid.OUT1', 'failed', now(), '131026', 'x') = 0, '7: failed depois de read ignorado';
  assert (select status from public.messages where wa_message_id = 'wamid.OUT1') = 'read', '7: continua read';
  assert public.inbox_apply_status('wamid.OUT2', 'sent', now(), null, null) = 1, '7: sent';
  assert public.inbox_apply_status('wamid.OUT2', 'failed', now(), '131047', 'Re-engagement message') = 1, '7: failed depois de sent vale';
  assert (select error_code from public.messages where wa_message_id = 'wamid.OUT2') = '131047', '7: erro registrado';
  assert public.inbox_apply_status('wamid.NAOEXISTE', 'read', now(), null, null) = 0, '7: id desconhecido devolve 0';
  assert public.inbox_apply_status('wamid.OUT1', 'inventado', now(), null, null) = 0, '7: status inválido ignorado';
end $$;

-- 8) Telefone inválido e id ausente são rejeitados
do $$
begin
  begin perform public.inbox_ingest_inbound('abc', null, 'wamid.X', 'text', 'x', null, null, now()); assert false, '8: aceitou telefone inválido';
  exception when raise_exception then if sqlerrm like '8:%' then raise; end if; end;
  begin perform public.inbox_ingest_inbound('5511999998888', null, '', 'text', 'x', null, null, now()); assert false, '8: aceitou id vazio';
  exception when raise_exception then if sqlerrm like '8:%' then raise; end if; end;
end $$;

-- 9) Privilégios: só service_role executa as funções do backend
reset role;
do $$
declare f text;
begin
  foreach f in array array[
    'public.inbox_ingest_inbound(text,text,text,text,text,text,text,timestamptz)',
    'public.inbox_ingest_echo(text,text,text,text,text,text,timestamptz)',
    'public.inbox_apply_status(text,text,timestamptz,text,text)',
    'public.inbox_phone_variants(text)'] loop
    assert has_function_privilege('service_role', f, 'EXECUTE'), '9: service_role deveria executar ' || f;
    assert not has_function_privilege('authenticated', f, 'EXECUTE'), '9: authenticated NÃO deveria executar ' || f;
    assert not has_function_privilege('anon', f, 'EXECUTE'), '9: anon NÃO deveria executar ' || f;
  end loop;
end $$;

-- 10) Observações internas: RLS
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', true);
insert into public.internal_notes (contact_id, body) values ((select id from public.contacts limit 1), 'Prefere áudio');
do $$
begin
  assert (select created_by from public.internal_notes limit 1) = '00000000-0000-0000-0000-0000000000a1', '10: autoria preenchida por padrão';
  begin
    insert into public.internal_notes (contact_id, body, created_by) values ((select id from public.contacts limit 1), 'em nome da Juline', '00000000-0000-0000-0000-0000000000b1');
    assert false, '10: aceitou autoria falsa';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', true);
do $$
declare n int;
begin
  assert (select count(*) from public.internal_notes) = 1, '10: Juline (membro) lê a nota';
  with d as (delete from public.internal_notes returning 1) select count(*) into n from d;
  assert n = 0, '10: Juline não apaga nota do Andreas';
  begin update public.internal_notes set body = 'editada'; assert false, '10: aceitou update';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', true);
do $$
begin
  assert (select count(*) from public.internal_notes) = 0, '10: usuário sem perfil não vê notas';
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', true);
do $$
declare n int;
begin
  with d as (delete from public.internal_notes returning 1) select count(*) into n from d;
  assert n = 1, '10: autor apaga a própria nota';
end $$;

-- 11) Mídia e Realtime
reset role;
do $$
begin
  assert (select public from storage.buckets where id = 'inbox-media') = false, '11: bucket deve ser privado';
  assert exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'inbox_members_read_media'), '11: política de leitura da mídia';
  assert (select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('internal_notes','opportunities','reminders','quick_replies')) = 4, '11: Realtime nas 4 tabelas novas';
end $$;

select 'TODOS OS TESTES DA MIGRATION PASSARAM' as resultado;
rollback;
