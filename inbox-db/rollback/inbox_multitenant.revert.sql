-- REVERSÃO da migration inbox_multitenant. Só com aprovação explícita. Também roda como uma única transação.
-- Pré-condição: só pode existir UMA empresa (a Astarita). Com mais empresas, a reversão aborta: não há como juntar dados
-- de empresas diferentes de volta em um banco de empresa única sem perder a separação.
-- Devolve o esquema ao estado das migrations 20261009001027 e 20261009001210.

do $$
begin
  if (select count(*) from public.organizations) <> 1 then
    raise exception 'Reversão só é possível com uma única empresa; existem %', (select count(*) from public.organizations);
  end if;
end $$;

-- 1) políticas novas -> antigas
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in (
      'profiles', 'contacts', 'conversations', 'messages', 'tags', 'contact_tags', 'pipeline_stages',
      'opportunities', 'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions', 'webhook_events',
      'internal_notes', 'organizations')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "team_read_profiles" on public.profiles for select to authenticated
  using (public.is_inbox_member());
create policy "self_update_profile" on public.profiles for update to authenticated
  using (id = (select auth.uid()) and public.is_inbox_member())
  with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array[
    'contacts', 'conversations', 'tags', 'contact_tags', 'opportunities',
    'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions'
  ] loop
    execute format('create policy "team_select_%1$s" on public.%1$I for select to authenticated using (public.is_inbox_member())', t);
    execute format('create policy "team_insert_%1$s" on public.%1$I for insert to authenticated with check (public.is_inbox_member())', t);
    execute format('create policy "team_update_%1$s" on public.%1$I for update to authenticated using (public.is_inbox_member()) with check (public.is_inbox_member())', t);
    execute format('create policy "team_delete_%1$s" on public.%1$I for delete to authenticated using (public.is_inbox_member())', t);
  end loop;
end $$;
create policy "team_read_pipeline_stages" on public.pipeline_stages for select to authenticated using (public.is_inbox_member());
create policy "team_read_messages" on public.messages for select to authenticated using (public.is_inbox_member());
create policy "team_queue_outbound_messages" on public.messages for insert to authenticated
  with check (
    public.is_inbox_member()
    and direction = 'out'
    and status = 'pending'
    and sent_by = (select auth.uid())
    and wa_message_id is null
  );
create policy "team_read_webhook_events" on public.webhook_events for select to authenticated using (public.is_inbox_member());
create policy "team_read_internal_notes" on public.internal_notes for select to authenticated using (public.is_inbox_member());
create policy "team_add_internal_notes" on public.internal_notes for insert to authenticated
  with check (public.is_inbox_member() and created_by = (select auth.uid()));
create policy "author_delete_internal_notes" on public.internal_notes for delete to authenticated
  using (public.is_inbox_member() and created_by = (select auth.uid()));

drop policy if exists "inbox_org_read_media" on storage.objects;
create policy "inbox_members_read_media" on storage.objects for select to authenticated
  using (bucket_id = 'inbox-media' and public.is_inbox_member());

-- 2) funções do WhatsApp: novas (com empresa) saem, antigas voltam
drop function public.inbox_ingest_inbound(uuid, text, text, text, text, text, text, text, timestamptz);
drop function public.inbox_ingest_echo(uuid, text, text, text, text, text, text, timestamptz);
drop function public.inbox_apply_status(uuid, text, text, timestamptz, text, text);

create function public.inbox_ingest_inbound(
  p_wa_id text,
  p_profile_name text,
  p_wa_message_id text,
  p_type text,
  p_body text,
  p_media_mime text,
  p_wa_media_id text,
  p_sent_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_wa_id, ''), '\D', '', 'g');
  v_variants text[];
  v_type text := case when p_type in ('text','image','document','audio','video','sticker','template') then p_type else 'unsupported' end;
  v_ts timestamptz := coalesce(p_sent_at, now());
  v_name text;
  v_contact uuid;
  v_conv uuid;
  v_conv_status text;
  v_msg uuid;
  v_created boolean := false;
  v_reopened boolean := false;
  v_stage uuid;
  v_preview text;
begin
  if v_phone !~ '^[0-9]{8,15}$' then
    raise exception 'telefone inválido: %', left(v_phone, 20);
  end if;
  if coalesce(p_wa_message_id, '') = '' then
    raise exception 'wa_message_id é obrigatório';
  end if;

  v_variants := public.inbox_phone_variants(v_phone);
  v_name := left(coalesce(nullif(trim(p_profile_name), ''), '+' || v_phone), 160);

  select c.id into v_contact
  from public.contacts c
  where c.phone = any (v_variants)
  order by (c.phone = v_phone) desc
  limit 1;

  if v_contact is null then
    insert into public.contacts (name, phone, category)
    values (v_name, v_phone, 'lead')
    on conflict (phone) where phone is not null do nothing
    returning id into v_contact;
    if v_contact is null then
      -- outra requisição criou o contato ao mesmo tempo
      select c.id into v_contact from public.contacts c where c.phone = any (v_variants) limit 1;
    else
      v_created := true;
    end if;
  end if;

  insert into public.conversations (contact_id) values (v_contact) on conflict (contact_id) do nothing;
  select c.id, c.status into v_conv, v_conv_status
  from public.conversations c where c.contact_id = v_contact for update;

  v_preview := coalesce(
    nullif(left(p_body, 140), ''),
    case v_type
      when 'image' then 'Imagem'
      when 'document' then 'Documento'
      when 'audio' then 'Áudio'
      when 'video' then 'Vídeo'
      when 'sticker' then 'Figurinha'
      else 'Mensagem'
    end
  );

  insert into public.messages (conversation_id, direction, type, body, media_mime, wa_media_id, wa_message_id, status, created_at)
  values (v_conv, 'in', v_type, left(p_body, 4096), p_media_mime, p_wa_media_id, p_wa_message_id, 'received', v_ts)
  on conflict (wa_message_id) do nothing
  returning id into v_msg;

  if v_msg is null then
    -- Reentrega do webhook: nada muda.
    return jsonb_build_object(
      'duplicate', true, 'contact_id', v_contact, 'conversation_id', v_conv,
      'message_id', (select m.id from public.messages m where m.wa_message_id = p_wa_message_id),
      'contact_created', false, 'conversation_reopened', false);
  end if;

  v_reopened := (v_conv_status = 'resolved');

  update public.conversations c set
    last_message_at = greatest(coalesce(c.last_message_at, v_ts), v_ts),
    last_inbound_at = greatest(coalesce(c.last_inbound_at, v_ts), v_ts),
    last_message_preview = case when c.last_message_at is null or v_ts >= c.last_message_at then v_preview else c.last_message_preview end,
    unread_count = c.unread_count + 1,
    status = case when c.status = 'resolved' then (case when c.assigned_to is null then 'waiting' else 'in_progress' end) else c.status end
  where c.id = v_conv;

  if v_created then
    select s.id into v_stage from public.pipeline_stages s where s.slug = 'novo-lead';
    if v_stage is not null then
      insert into public.opportunities (contact_id, stage_id, title, last_interaction_at, position)
      values (v_contact, v_stage, v_name, v_ts,
              coalesce((select max(o.position) from public.opportunities o where o.stage_id = v_stage), 0) + 1);
    end if;
  end if;

  update public.opportunities o
  set last_interaction_at = greatest(coalesce(o.last_interaction_at, v_ts), v_ts)
  where o.contact_id = v_contact;

  return jsonb_build_object(
    'duplicate', false, 'contact_id', v_contact, 'conversation_id', v_conv, 'message_id', v_msg,
    'contact_created', v_created, 'conversation_reopened', v_reopened);
end;
$$;

-- ---------------------------------------------------------------------------
-- Mensagem enviada pelo próprio app WhatsApp Business (coexistência: webhook smb_message_echoes).
-- Entra na conversa como enviada, sem contar como não lida.
-- ---------------------------------------------------------------------------
create function public.inbox_ingest_echo(
  p_to_wa_id text,
  p_wa_message_id text,
  p_type text,
  p_body text,
  p_media_mime text,
  p_wa_media_id text,
  p_sent_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_to_wa_id, ''), '\D', '', 'g');
  v_variants text[];
  v_type text := case when p_type in ('text','image','document','audio','video','sticker','template') then p_type else 'unsupported' end;
  v_ts timestamptz := coalesce(p_sent_at, now());
  v_contact uuid;
  v_conv uuid;
  v_msg uuid;
  v_preview text;
begin
  if v_phone !~ '^[0-9]{8,15}$' then raise exception 'telefone inválido'; end if;
  if coalesce(p_wa_message_id, '') = '' then raise exception 'wa_message_id é obrigatório'; end if;

  v_variants := public.inbox_phone_variants(v_phone);
  select c.id into v_contact from public.contacts c where c.phone = any (v_variants)
  order by (c.phone = v_phone) desc limit 1;

  if v_contact is null then
    insert into public.contacts (name, phone, category) values ('+' || v_phone, v_phone, 'lead')
    on conflict (phone) where phone is not null do nothing returning id into v_contact;
    if v_contact is null then
      select c.id into v_contact from public.contacts c where c.phone = any (v_variants) limit 1;
    end if;
  end if;

  insert into public.conversations (contact_id) values (v_contact) on conflict (contact_id) do nothing;
  select c.id into v_conv from public.conversations c where c.contact_id = v_contact for update;

  v_preview := coalesce(nullif(left(p_body, 140), ''),
    case v_type when 'image' then 'Imagem' when 'document' then 'Documento' when 'audio' then 'Áudio'
                when 'video' then 'Vídeo' when 'sticker' then 'Figurinha' else 'Mensagem' end);

  insert into public.messages (conversation_id, direction, type, body, media_mime, wa_media_id, wa_message_id, status, created_at, status_updated_at)
  values (v_conv, 'out', v_type, left(p_body, 4096), p_media_mime, p_wa_media_id, p_wa_message_id, 'sent', v_ts, v_ts)
  on conflict (wa_message_id) do nothing
  returning id into v_msg;

  if v_msg is null then
    return jsonb_build_object('duplicate', true, 'conversation_id', v_conv);
  end if;

  update public.conversations c set
    last_message_at = greatest(coalesce(c.last_message_at, v_ts), v_ts),
    last_message_preview = case when c.last_message_at is null or v_ts >= c.last_message_at then v_preview else c.last_message_preview end
  where c.id = v_conv;

  update public.opportunities o
  set last_interaction_at = greatest(coalesce(o.last_interaction_at, v_ts), v_ts)
  where o.contact_id = v_contact;

  return jsonb_build_object('duplicate', false, 'contact_id', v_contact, 'conversation_id', v_conv, 'message_id', v_msg);
end;
$$;

-- ---------------------------------------------------------------------------
-- Status de entrega (webhook statuses). Eventos podem chegar fora de ordem:
-- o status só avança (enviada < entregue < lida). "failed" só vale enquanto não entregue.
-- ---------------------------------------------------------------------------
create function public.inbox_apply_status(
  p_wa_message_id text,
  p_status text,
  p_at timestamptz,
  p_error_code text,
  p_error_message text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cur text;
  v_rank_new integer;
  v_rank_cur integer;
begin
  if p_status not in ('sent', 'delivered', 'read', 'failed') then return 0; end if;

  select m.status into v_cur
  from public.messages m
  where m.wa_message_id = p_wa_message_id and m.direction = 'out'
  for update;
  if not found then return 0; end if; -- status de mensagem que não está no Inbox

  v_rank_cur := case v_cur when 'pending' then 0 when 'sent' then 1 when 'delivered' then 2 when 'read' then 3 else -1 end;

  if p_status = 'failed' then
    if v_rank_cur not in (0, 1) then return 0; end if;
    update public.messages set status = 'failed', error_code = left(p_error_code, 60), error_message = left(p_error_message, 500),
      status_updated_at = coalesce(p_at, now())
    where wa_message_id = p_wa_message_id;
    return 1;
  end if;

  v_rank_new := case p_status when 'sent' then 1 when 'delivered' then 2 else 3 end;
  if v_rank_new <= v_rank_cur then return 0; end if;

  update public.messages set status = p_status, status_updated_at = coalesce(p_at, now()),
    error_code = null, error_message = null
  where wa_message_id = p_wa_message_id;
  return 1;
end;
$$;


revoke all on function public.inbox_ingest_inbound(text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.inbox_ingest_echo(text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.inbox_apply_status(text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.inbox_ingest_inbound(text, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.inbox_ingest_echo(text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.inbox_apply_status(text, text, timestamptz, text, text) to service_role;

-- 3) gatilhos e funções de consistência
do $$
declare t text;
begin
  foreach t in array array[
    'contacts', 'conversations', 'messages', 'tags', 'contact_tags', 'pipeline_stages', 'opportunities',
    'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions', 'internal_notes'
  ] loop
    execute format('drop trigger if exists inbox_1_fill_org on public.%I', t);
    execute format('drop trigger if exists inbox_2_check_people on public.%I', t);
    execute format('drop trigger if exists inbox_2_check_reply on public.%I', t);
    execute format('drop trigger if exists inbox_3_lock_org on public.%I', t);
  end loop;
end $$;
drop function public.inbox_fill_org();
drop function public.inbox_lock_org();
drop function public.inbox_check_profile_org();
drop function public.inbox_check_reply();

-- 4) chaves compostas -> chaves simples (mesmos nomes e ON DELETE de antes)
alter table public.conversations drop constraint conversations_contact_id_org_fkey;
alter table public.conversations add constraint conversations_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete cascade;
alter table public.messages drop constraint messages_conversation_id_org_fkey;
alter table public.messages add constraint messages_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade;
alter table public.contact_tags drop constraint contact_tags_contact_id_org_fkey;
alter table public.contact_tags add constraint contact_tags_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete cascade;
alter table public.contact_tags drop constraint contact_tags_tag_id_org_fkey;
alter table public.contact_tags add constraint contact_tags_tag_id_fkey foreign key (tag_id) references public.tags(id) on delete cascade;
alter table public.opportunities drop constraint opportunities_contact_id_org_fkey;
alter table public.opportunities add constraint opportunities_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete cascade;
alter table public.opportunities drop constraint opportunities_stage_id_org_fkey;
alter table public.opportunities add constraint opportunities_stage_id_fkey foreign key (stage_id) references public.pipeline_stages(id);
alter table public.reminders drop constraint reminders_contact_id_org_fkey;
alter table public.reminders add constraint reminders_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete cascade;
alter table public.ai_suggestions drop constraint ai_suggestions_conversation_id_org_fkey;
alter table public.ai_suggestions add constraint ai_suggestions_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade;
alter table public.internal_notes drop constraint internal_notes_contact_id_org_fkey;
alter table public.internal_notes add constraint internal_notes_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete cascade;

alter table public.contacts drop constraint contacts_id_org_key;
alter table public.conversations drop constraint conversations_id_org_key;
alter table public.tags drop constraint tags_id_org_key;
alter table public.pipeline_stages drop constraint pipeline_stages_id_org_key;

-- 5) unicidades globais de volta
drop index public.contacts_org_phone_key;
create unique index contacts_phone_key on public.contacts (phone) where phone is not null;
drop index public.tags_org_name_key;
create unique index tags_name_key on public.tags (lower(name));
alter table public.pipeline_stages drop constraint pipeline_stages_org_slug_key;
alter table public.pipeline_stages drop constraint pipeline_stages_org_position_key;
alter table public.pipeline_stages add constraint pipeline_stages_slug_key unique (slug);
alter table public.pipeline_stages add constraint pipeline_stages_position_key unique (position);
alter table public.knowledge_base drop constraint knowledge_base_org_section_key;
alter table public.knowledge_base add constraint knowledge_base_section_key unique (section);
drop index public.webhook_events_key;
create unique index webhook_events_key on public.webhook_events (provider, event_key) where event_key is not null;

-- 6) colunas org_id saem (os índices e as FKs delas saem junto)
do $$
declare t text;
begin
  foreach t in array array[
    'contacts', 'conversations', 'messages', 'tags', 'contact_tags', 'pipeline_stages', 'opportunities',
    'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions', 'internal_notes', 'webhook_events'
  ] loop
    execute format('alter table public.%I drop column org_id', t);
  end loop;
end $$;

alter table public.profiles drop constraint profiles_id_org_key;
alter table public.profiles drop column org_id, drop column access, drop column is_platform_admin;

-- 7) porteiros e tabelas novas saem; is_inbox_member volta ao corpo original
create or replace function public.is_inbox_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.active
  );
$$;
drop function public.is_org_admin();
drop function public.inbox_create_org(text, text, text);
drop function public.current_org_id();
drop table public.org_whatsapp;
drop table public.organizations;
