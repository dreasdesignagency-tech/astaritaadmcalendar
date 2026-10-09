-- APLICADA em 09/10/2026 no projeto Astarita Inbox (yappbzpayqejqpkfebho) como migration 20261009001210, com autorização do usuário.
-- Projeto: Astarita Inbox (yappbzpayqejqpkfebho). Fases 3 e 4: observações internas, ingestão do WhatsApp, mídia.
--
-- Só ADICIONA: uma tabela, uma coluna, funções e um bucket privado. Não apaga nem altera dados existentes.
-- Sem BEGIN/COMMIT de propósito: o apply_migration e o CLI já executam o arquivo numa única transação.
-- Guardas no início abortam tudo se algo já existir (evita reaplicar às cegas).
-- Depende de: baseline 20261008000000_inbox_install.sql e (recomendado) inbox_hardening.sql.

do $$
begin
  if to_regclass('public.internal_notes') is not null then
    raise exception 'public.internal_notes já existe; auditar antes de aplicar';
  end if;
  if to_regprocedure('public.inbox_ingest_inbound(text,text,text,text,text,text,text,timestamptz)') is not null
     or to_regprocedure('public.inbox_apply_status(text,text,timestamptz,text,text)') is not null then
    raise exception 'Funções de ingestão já existem; auditar antes de aplicar';
  end if;
  if to_regclass('public.messages') is null or to_regclass('public.pipeline_stages') is null then
    raise exception 'Baseline do Inbox não encontrada; aplicar 20261008000000_inbox_install.sql antes';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Mensagens: guarda o id da mídia na Meta até o arquivo ser baixado para o Storage privado.
-- ---------------------------------------------------------------------------
alter table public.messages add column if not exists wa_media_id text;

-- ---------------------------------------------------------------------------
-- Observações internas (linha do tempo por contato; nunca vão para o cliente)
-- ---------------------------------------------------------------------------
create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index internal_notes_contact_idx on public.internal_notes (contact_id, created_at desc);
create index internal_notes_created_by_idx on public.internal_notes (created_by);

alter table public.internal_notes enable row level security;
revoke all on public.internal_notes from public, anon, authenticated;
grant all on public.internal_notes to service_role;
grant select, insert, delete on public.internal_notes to authenticated;

create policy "team_read_internal_notes" on public.internal_notes for select to authenticated
  using (public.is_inbox_member());
-- A autoria é forçada ao próprio usuário; só o autor apaga a própria observação.
create policy "team_add_internal_notes" on public.internal_notes for insert to authenticated
  with check (public.is_inbox_member() and created_by = (select auth.uid()));
create policy "author_delete_internal_notes" on public.internal_notes for delete to authenticated
  using (public.is_inbox_member() and created_by = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Telefones: o WhatsApp do Brasil ora envia o número com o nono dígito, ora sem.
-- Mesma regra de src/lib/inbox/phone.ts (phoneVariants).
-- ---------------------------------------------------------------------------
create function public.inbox_phone_variants(p text)
returns text[]
language sql
immutable
set search_path = public
as $$
  select case
    when p ~ '^55[0-9]{2}9[0-9]{8}$' then array[p, substr(p, 1, 4) || substr(p, 6)]
    when p ~ '^55[0-9]{2}[6-9][0-9]{7}$' then array[p, substr(p, 1, 4) || '9' || substr(p, 5)]
    else array[p]
  end;
$$;

-- ---------------------------------------------------------------------------
-- Ingestão ATÔMICA de mensagem recebida (chamada só pelo backend, com service role).
-- Idempotente: o mesmo wa_message_id nunca duplica mensagem nem soma contador duas vezes.
-- ---------------------------------------------------------------------------
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

-- Só o backend (service role) chama estas funções. Nem anon nem authenticated.
revoke all on function public.inbox_phone_variants(text) from public, anon, authenticated;
revoke all on function public.inbox_ingest_inbound(text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.inbox_ingest_echo(text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.inbox_apply_status(text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.inbox_phone_variants(text) to service_role;
grant execute on function public.inbox_ingest_inbound(text, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.inbox_ingest_echo(text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.inbox_apply_status(text, text, timestamptz, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Mídia: bucket PRIVADO. Só o backend grava (service role); membros leem por URL assinada.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('inbox-media', 'inbox-media', false, 52428800)
on conflict (id) do nothing;

create policy "inbox_members_read_media" on storage.objects for select to authenticated
  using (bucket_id = 'inbox-media' and public.is_inbox_member());

-- ---------------------------------------------------------------------------
-- Realtime nas tabelas que a interface passa a mostrar ao vivo.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'Publicação supabase_realtime ausente; parar e investigar';
  end if;
  begin alter publication supabase_realtime add table public.internal_notes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.opportunities; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.reminders; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.quick_replies; exception when duplicate_object then null; end;
end $$;
