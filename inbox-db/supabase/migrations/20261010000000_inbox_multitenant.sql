-- PROPOSTA, NÃO APLICADA NO BANCO REAL. Só rodar com aprovação explícita.
-- Projeto: Astarita Inbox (yappbzpayqejqpkfebho). Transforma o Inbox em multiempresa (SaaS).
--
-- O que faz:
--  * cria `organizations` e coloca TODOS os dados atuais na empresa "Astarita" (backfill);
--  * adiciona `org_id` em todas as tabelas de dados, com chaves compostas e gatilhos que impedem misturar empresas;
--  * troca o porteiro das políticas: de "membro ativo" para "membro ativo DA MESMA empresa" (e empresa ativa);
--  * guarda as credenciais do WhatsApp por empresa em `org_whatsapp` (sem nenhum acesso para o navegador);
--  * cria `inbox_create_org()` e reescreve as funções de ingestão do WhatsApp para receber a empresa.
--
-- Não apaga dados. Compatível com o cliente já publicado (org_id é preenchido sozinho nas inserções do navegador).
-- Sem BEGIN/COMMIT de propósito: o apply_migration já roda tudo numa transação; se algo falhar, nada é aplicado.

do $$
begin
  if to_regclass('public.organizations') is not null then
    raise exception 'public.organizations já existe; auditar antes de aplicar';
  end if;
  if to_regclass('public.internal_notes') is null
     or to_regprocedure('public.inbox_ingest_inbound(text,text,text,text,text,text,text,timestamptz)') is null then
    raise exception 'Aplicar inbox_whatsapp_notes antes desta migration';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Empresas
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  status text not null default 'active' check (status in ('active', 'suspended')),
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'business')),
  max_users integer not null default 3 check (max_users between 1 and 500),
  ai_monthly_limit integer not null default 200 check (ai_monthly_limit between 0 and 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.inbox_set_updated_at();

alter table public.organizations enable row level security;
revoke all on public.organizations from public, anon, authenticated;
grant all on public.organizations to service_role;

-- Credenciais do WhatsApp por empresa. Os segredos ficam CRIPTOGRAFADOS (o servidor tem a chave); o navegador não lê nada daqui.
create table public.org_whatsapp (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  -- Parte aleatória do endereço do webhook desta empresa: /api/whatsapp/webhook/<webhook_key>
  webhook_key text not null unique check (webhook_key ~ '^[a-f0-9]{32}$'),
  phone_number_id text unique,
  api_version text,
  access_token_enc text,
  app_secret_enc text,
  verify_token_enc text,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger org_whatsapp_set_updated_at before update on public.org_whatsapp
  for each row execute function public.inbox_set_updated_at();

alter table public.org_whatsapp enable row level security;
revoke all on public.org_whatsapp from public, anon, authenticated;
grant all on public.org_whatsapp to service_role;

-- A empresa que já existe: Astarita. Todos os dados atuais passam a ser dela.
insert into public.organizations (name, slug, plan, max_users, ai_monthly_limit)
values ('Astarita Creative Studio', 'astarita', 'business', 10, 2000);

-- ---------------------------------------------------------------------------
-- profiles: empresa, nível de acesso e dono da plataforma
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column org_id uuid references public.organizations(id),
  add column access text not null default 'agent' check (access in ('owner', 'admin', 'agent')),
  add column is_platform_admin boolean not null default false;

update public.profiles
set org_id = (select o.id from public.organizations o where o.slug = 'astarita'),
    access = 'owner',
    is_platform_admin = (role = 'director');

alter table public.profiles alter column org_id set not null;
create index profiles_org_idx on public.profiles (org_id);
alter table public.profiles add constraint profiles_id_org_key unique (id, org_id);

-- ---------------------------------------------------------------------------
-- Porteiros. current_org_id() devolve a empresa de quem está logado (ativo, em empresa ativa), senão null.
-- Com null, qualquer política `org_id = current_org_id()` nega: nada vaza.
-- ---------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.org_id
  from public.profiles p
  join public.organizations o on o.id = p.org_id
  where p.id = auth.uid() and p.active and o.status = 'active';
$$;

create or replace function public.is_inbox_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_org_id() is not null;
$$;

create or replace function public.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    join public.organizations o on o.id = p.org_id
    where p.id = auth.uid() and p.active and o.status = 'active' and p.access in ('owner', 'admin')
  );
$$;

revoke all on function public.current_org_id() from public, anon;
revoke all on function public.is_org_admin() from public, anon;
grant execute on function public.current_org_id() to authenticated, service_role;
grant execute on function public.is_org_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- org_id em todas as tabelas de dados (backfill = Astarita)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  v_org uuid := (select o.id from public.organizations o where o.slug = 'astarita');
begin
  foreach t in array array[
    'contacts', 'conversations', 'messages', 'tags', 'contact_tags', 'pipeline_stages', 'opportunities',
    'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions', 'internal_notes'
  ] loop
    execute format('alter table public.%I add column org_id uuid references public.organizations(id) on delete cascade', t);
    execute format('update public.%I set org_id = %L', t, v_org);
    execute format('alter table public.%I alter column org_id set not null', t);
    execute format('create index %I on public.%I (org_id)', t || '_org_idx', t);
  end loop;
  -- Eventos de webhook: org_id fica vazio quando a empresa não é reconhecida (ex.: assinatura inválida).
  alter table public.webhook_events add column org_id uuid references public.organizations(id) on delete cascade;
  update public.webhook_events set org_id = v_org;
  create index webhook_events_org_idx on public.webhook_events (org_id);
end $$;

-- Preenchimento automático nas inserções feitas pelo navegador (empresa de quem está logado).
-- As tabelas filhas sobrescrevem isso com a empresa do registro pai (gatilho abaixo).
alter table public.contacts alter column org_id set default public.current_org_id();
alter table public.tags alter column org_id set default public.current_org_id();
alter table public.quick_replies alter column org_id set default public.current_org_id();
alter table public.knowledge_base alter column org_id set default public.current_org_id();
alter table public.conversations alter column org_id set default public.current_org_id();
alter table public.messages alter column org_id set default public.current_org_id();
alter table public.contact_tags alter column org_id set default public.current_org_id();
alter table public.opportunities alter column org_id set default public.current_org_id();
alter table public.reminders alter column org_id set default public.current_org_id();
alter table public.ai_suggestions alter column org_id set default public.current_org_id();
alter table public.internal_notes alter column org_id set default public.current_org_id();

-- ---------------------------------------------------------------------------
-- Unicidade por empresa (antes era global)
-- ---------------------------------------------------------------------------
drop index public.contacts_phone_key;
create unique index contacts_org_phone_key on public.contacts (org_id, phone) where phone is not null;

drop index public.tags_name_key;
create unique index tags_org_name_key on public.tags (org_id, lower(name));

alter table public.pipeline_stages drop constraint pipeline_stages_slug_key;
alter table public.pipeline_stages drop constraint pipeline_stages_position_key;
alter table public.pipeline_stages add constraint pipeline_stages_org_slug_key unique (org_id, slug);
alter table public.pipeline_stages add constraint pipeline_stages_org_position_key unique (org_id, position);

alter table public.knowledge_base drop constraint knowledge_base_section_key;
alter table public.knowledge_base add constraint knowledge_base_org_section_key unique (org_id, section);

drop index public.webhook_events_key;
create unique index webhook_events_key on public.webhook_events (provider, coalesce(org_id::text, '-'), event_key)
  where event_key is not null;

-- ---------------------------------------------------------------------------
-- Chaves compostas: um filho só pode apontar para um pai DA MESMA empresa.
-- ---------------------------------------------------------------------------
alter table public.contacts add constraint contacts_id_org_key unique (id, org_id);
alter table public.conversations add constraint conversations_id_org_key unique (id, org_id);
alter table public.tags add constraint tags_id_org_key unique (id, org_id);
alter table public.pipeline_stages add constraint pipeline_stages_id_org_key unique (id, org_id);

-- Troca a FK simples (child.col -> parent.id) pela composta (child.col, org_id -> parent.id, org_id), mantendo o ON DELETE.
create or replace function pg_temp.swap_fk(p_child text, p_col text, p_parent text, p_delete text)
returns void language plpgsql as $$
declare v_name text;
begin
  select k.conname into v_name
  from pg_constraint k
  where k.contype = 'f'
    and k.conrelid = format('public.%I', p_child)::regclass
    and k.confrelid = format('public.%I', p_parent)::regclass
    and k.conkey = array[(select a.attnum from pg_attribute a where a.attrelid = k.conrelid and a.attname = p_col)];
  if v_name is null then
    raise exception 'FK % (%) -> % não encontrada', p_child, p_col, p_parent;
  end if;
  execute format('alter table public.%I drop constraint %I', p_child, v_name);
  execute format(
    'alter table public.%I add constraint %I foreign key (%I, org_id) references public.%I (id, org_id) on delete %s',
    p_child, p_child || '_' || p_col || '_org_fkey', p_col, p_parent, p_delete);
end $$;

select pg_temp.swap_fk('conversations', 'contact_id', 'contacts', 'cascade');
select pg_temp.swap_fk('messages', 'conversation_id', 'conversations', 'cascade');
select pg_temp.swap_fk('contact_tags', 'contact_id', 'contacts', 'cascade');
select pg_temp.swap_fk('contact_tags', 'tag_id', 'tags', 'cascade');
select pg_temp.swap_fk('opportunities', 'contact_id', 'contacts', 'cascade');
select pg_temp.swap_fk('opportunities', 'stage_id', 'pipeline_stages', 'no action');
select pg_temp.swap_fk('reminders', 'contact_id', 'contacts', 'cascade');
select pg_temp.swap_fk('ai_suggestions', 'conversation_id', 'conversations', 'cascade');
select pg_temp.swap_fk('internal_notes', 'contact_id', 'contacts', 'cascade');

-- ---------------------------------------------------------------------------
-- Gatilhos de consistência (rodam com as permissões de quem escreve, então a RLS vale dentro deles)
-- ---------------------------------------------------------------------------

-- Empresa do filho = empresa do pai. O cliente não escolhe a empresa.
create or replace function public.inbox_fill_org()
returns trigger
language plpgsql
set search_path = public
as $$
declare v uuid;
begin
  execute format('select org_id from public.%I where id = $1', tg_argv[0])
    into v using (to_jsonb(new) ->> tg_argv[1])::uuid;
  if v is null then
    raise exception 'registro pai não encontrado' using errcode = '23503';
  end if;
  new.org_id := v;
  return new;
end $$;

-- A empresa de um registro nunca muda.
create or replace function public.inbox_lock_org()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.org_id is distinct from old.org_id then
    raise exception 'não é permitido mudar a empresa de um registro' using errcode = '23514';
  end if;
  return new;
end $$;

-- Pessoas citadas (responsável, autor...) precisam ser da mesma empresa do registro.
create or replace function public.inbox_check_profile_org()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  c text;
  v uuid;
begin
  foreach c in array tg_argv loop
    v := (to_jsonb(new) ->> c)::uuid;
    if v is not null and not exists (
      select 1 from public.profiles p where p.id = v and p.org_id = new.org_id
    ) then
      raise exception 'pessoa de outra empresa em %', c using errcode = '23514';
    end if;
  end loop;
  return new;
end $$;

-- Resposta (reply) só dentro da mesma conversa.
create or replace function public.inbox_check_reply()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.reply_to_id is not null and not exists (
    select 1 from public.messages m where m.id = new.reply_to_id and m.conversation_id = new.conversation_id
  ) then
    raise exception 'resposta a mensagem de outra conversa' using errcode = '23514';
  end if;
  return new;
end $$;

revoke all on function public.inbox_fill_org() from public, anon, authenticated;
revoke all on function public.inbox_lock_org() from public, anon, authenticated;
revoke all on function public.inbox_check_profile_org() from public, anon, authenticated;
revoke all on function public.inbox_check_reply() from public, anon, authenticated;

create trigger inbox_1_fill_org before insert on public.conversations
  for each row execute function public.inbox_fill_org('contacts', 'contact_id');
create trigger inbox_1_fill_org before insert on public.messages
  for each row execute function public.inbox_fill_org('conversations', 'conversation_id');
create trigger inbox_1_fill_org before insert on public.contact_tags
  for each row execute function public.inbox_fill_org('contacts', 'contact_id');
create trigger inbox_1_fill_org before insert on public.opportunities
  for each row execute function public.inbox_fill_org('contacts', 'contact_id');
create trigger inbox_1_fill_org before insert on public.reminders
  for each row execute function public.inbox_fill_org('contacts', 'contact_id');
create trigger inbox_1_fill_org before insert on public.ai_suggestions
  for each row execute function public.inbox_fill_org('conversations', 'conversation_id');
create trigger inbox_1_fill_org before insert on public.internal_notes
  for each row execute function public.inbox_fill_org('contacts', 'contact_id');

do $$
declare t text;
begin
  foreach t in array array[
    'contacts', 'conversations', 'messages', 'tags', 'contact_tags', 'pipeline_stages', 'opportunities',
    'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions', 'internal_notes'
  ] loop
    execute format('create trigger inbox_3_lock_org before update on public.%I for each row execute function public.inbox_lock_org()', t);
  end loop;
end $$;

create trigger inbox_2_check_people before insert or update on public.contacts
  for each row execute function public.inbox_check_profile_org('assigned_to');
create trigger inbox_2_check_people before insert or update on public.conversations
  for each row execute function public.inbox_check_profile_org('assigned_to');
create trigger inbox_2_check_people before insert or update on public.opportunities
  for each row execute function public.inbox_check_profile_org('assigned_to');
create trigger inbox_2_check_people before insert or update on public.reminders
  for each row execute function public.inbox_check_profile_org('assigned_to', 'created_by');
create trigger inbox_2_check_people before insert or update on public.quick_replies
  for each row execute function public.inbox_check_profile_org('created_by');
create trigger inbox_2_check_people before insert or update on public.knowledge_base
  for each row execute function public.inbox_check_profile_org('updated_by');
create trigger inbox_2_check_people before insert or update on public.messages
  for each row execute function public.inbox_check_profile_org('sent_by');
create trigger inbox_2_check_people before insert or update on public.ai_suggestions
  for each row execute function public.inbox_check_profile_org('created_by');
create trigger inbox_2_check_people before insert or update on public.internal_notes
  for each row execute function public.inbox_check_profile_org('created_by');
create trigger inbox_2_check_reply before insert or update on public.messages
  for each row execute function public.inbox_check_reply();

-- ---------------------------------------------------------------------------
-- RLS: tudo por empresa. Apaga as políticas antigas (por nome) e recria.
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in (
      'profiles', 'contacts', 'conversations', 'messages', 'tags', 'contact_tags', 'pipeline_stages',
      'opportunities', 'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions', 'webhook_events',
      'internal_notes')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles: a equipe da MESMA empresa se enxerga; cada pessoa edita só o próprio nome/avatar.
create policy "org_read_profiles" on public.profiles for select to authenticated
  using (org_id = (select public.current_org_id()));
create policy "self_update_profile" on public.profiles for update to authenticated
  using (id = (select auth.uid()) and org_id = (select public.current_org_id()))
  with check (id = (select auth.uid()) and org_id = (select public.current_org_id()));

-- A empresa vê só a própria linha (nome, plano, limites). Sem escrita.
grant select on public.organizations to authenticated;
create policy "org_read_own" on public.organizations for select to authenticated
  using (id = (select public.current_org_id()));

-- Tabelas de trabalho: leitura e escrita só na própria empresa.
do $$
declare t text;
begin
  foreach t in array array[
    'contacts', 'conversations', 'tags', 'contact_tags', 'opportunities',
    'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions'
  ] loop
    execute format('create policy "org_select_%1$s" on public.%1$I for select to authenticated using (org_id = (select public.current_org_id()))', t);
    execute format('create policy "org_insert_%1$s" on public.%1$I for insert to authenticated with check (org_id = (select public.current_org_id()))', t);
    execute format('create policy "org_update_%1$s" on public.%1$I for update to authenticated using (org_id = (select public.current_org_id())) with check (org_id = (select public.current_org_id()))', t);
    execute format('create policy "org_delete_%1$s" on public.%1$I for delete to authenticated using (org_id = (select public.current_org_id()))', t);
  end loop;
end $$;

create policy "org_read_pipeline_stages" on public.pipeline_stages for select to authenticated
  using (org_id = (select public.current_org_id()));

create policy "org_read_messages" on public.messages for select to authenticated
  using (org_id = (select public.current_org_id()));
create policy "org_queue_outbound_messages" on public.messages for insert to authenticated
  with check (
    org_id = (select public.current_org_id())
    and direction = 'out'
    and status = 'pending'
    and sent_by = (select auth.uid())
    and wa_message_id is null
  );

create policy "org_read_webhook_events" on public.webhook_events for select to authenticated
  using (org_id = (select public.current_org_id()));

create policy "org_read_internal_notes" on public.internal_notes for select to authenticated
  using (org_id = (select public.current_org_id()));
create policy "org_add_internal_notes" on public.internal_notes for insert to authenticated
  with check (org_id = (select public.current_org_id()) and created_by = (select auth.uid()));
create policy "author_delete_internal_notes" on public.internal_notes for delete to authenticated
  using (org_id = (select public.current_org_id()) and created_by = (select auth.uid()));

-- Mídia: leitura só da pasta da própria empresa (o servidor grava em <org_id>/...).
drop policy if exists "inbox_members_read_media" on storage.objects;
create policy "inbox_org_read_media" on storage.objects for select to authenticated
  using (
    bucket_id = 'inbox-media'
    and (storage.foldername(name))[1] = (select public.current_org_id())::text
  );

-- ---------------------------------------------------------------------------
-- Criar empresa (só service role): empresa + funil de 7 etapas + base de conhecimento vazia + webhook_key
-- ---------------------------------------------------------------------------
create function public.inbox_create_org(p_name text, p_slug text, p_plan text default 'starter')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_max integer;
  v_ai integer;
begin
  v_max := case p_plan when 'business' then 25 when 'pro' then 10 else 3 end;
  v_ai := case p_plan when 'business' then 3000 when 'pro' then 1000 else 200 end;
  insert into public.organizations (name, slug, plan, max_users, ai_monthly_limit)
  values (trim(p_name), lower(trim(p_slug)), p_plan, v_max, v_ai)
  returning id into v_org;

  insert into public.pipeline_stages (org_id, slug, name, position, is_won, is_lost) values
    (v_org, 'novo-lead', 'Novo lead', 1, false, false),
    (v_org, 'em-conversa', 'Em conversa', 2, false, false),
    (v_org, 'reuniao-marcada', 'Reunião marcada', 3, false, false),
    (v_org, 'proposta-enviada', 'Proposta enviada', 4, false, false),
    (v_org, 'negociacao', 'Negociação', 5, false, false),
    (v_org, 'fechado', 'Fechado', 6, true, false),
    (v_org, 'perdido', 'Perdido', 7, false, true);

  -- Tudo vazio de propósito: valores e condições de cada empresa não podem ser inventados.
  insert into public.knowledge_base (org_id, section, title, content) values
    (v_org, 'apresentacao', 'Apresentação da empresa', ''),
    (v_org, 'servicos', 'Serviços', ''),
    (v_org, 'diferenciais', 'Diferenciais', ''),
    (v_org, 'metodologia', 'Metodologia', ''),
    (v_org, 'tom_de_voz', 'Tom de voz', 'Natural, próximo, profissional e objetivo. Mensagens curtas quando uma resolve.'),
    (v_org, 'faq', 'Perguntas frequentes', ''),
    (v_org, 'condicoes_comerciais', 'Condições comerciais', ''),
    (v_org, 'respostas_aprovadas', 'Respostas aprovadas', '');

  insert into public.org_whatsapp (org_id, webhook_key) values (v_org, replace(gen_random_uuid()::text, '-', ''));
  return v_org;
end $$;

revoke all on function public.inbox_create_org(text, text, text) from public, anon, authenticated;
grant execute on function public.inbox_create_org(text, text, text) to service_role;

-- A Astarita também ganha a linha de credenciais do WhatsApp (vazia até ser configurada).
insert into public.org_whatsapp (org_id, webhook_key)
select id, replace(gen_random_uuid()::text, '-', '') from public.organizations where slug = 'astarita';

-- ---------------------------------------------------------------------------
-- Funções do WhatsApp: agora recebem a empresa. As antigas (sem empresa) saem.
-- ---------------------------------------------------------------------------
drop function public.inbox_ingest_inbound(text, text, text, text, text, text, text, timestamptz);
drop function public.inbox_ingest_echo(text, text, text, text, text, text, timestamptz);
drop function public.inbox_apply_status(text, text, timestamptz, text, text);

create function public.inbox_ingest_inbound(
  p_org uuid,
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
  if not exists (select 1 from public.organizations o where o.id = p_org and o.status = 'active') then
    raise exception 'empresa inexistente ou suspensa';
  end if;
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
  where c.org_id = p_org and c.phone = any (v_variants)
  order by (c.phone = v_phone) desc
  limit 1;

  if v_contact is null then
    insert into public.contacts (org_id, name, phone, category)
    values (p_org, v_name, v_phone, 'lead')
    on conflict (org_id, phone) where phone is not null do nothing
    returning id into v_contact;
    if v_contact is null then
      select c.id into v_contact from public.contacts c where c.org_id = p_org and c.phone = any (v_variants) limit 1;
    else
      v_created := true;
    end if;
  end if;

  insert into public.conversations (org_id, contact_id) values (p_org, v_contact) on conflict (contact_id) do nothing;
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

  insert into public.messages (org_id, conversation_id, direction, type, body, media_mime, wa_media_id, wa_message_id, status, created_at)
  values (p_org, v_conv, 'in', v_type, left(p_body, 4096), p_media_mime, p_wa_media_id, p_wa_message_id, 'received', v_ts)
  on conflict (wa_message_id) do nothing
  returning id into v_msg;

  if v_msg is null then
    return jsonb_build_object(
      'duplicate', true, 'contact_id', v_contact, 'conversation_id', v_conv,
      'message_id', (select m.id from public.messages m where m.wa_message_id = p_wa_message_id and m.org_id = p_org),
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
    select s.id into v_stage from public.pipeline_stages s where s.org_id = p_org and s.slug = 'novo-lead';
    if v_stage is not null then
      insert into public.opportunities (org_id, contact_id, stage_id, title, last_interaction_at, position)
      values (p_org, v_contact, v_stage, v_name, v_ts,
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

create function public.inbox_ingest_echo(
  p_org uuid,
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
  if not exists (select 1 from public.organizations o where o.id = p_org and o.status = 'active') then
    raise exception 'empresa inexistente ou suspensa';
  end if;
  if v_phone !~ '^[0-9]{8,15}$' then raise exception 'telefone inválido'; end if;
  if coalesce(p_wa_message_id, '') = '' then raise exception 'wa_message_id é obrigatório'; end if;

  v_variants := public.inbox_phone_variants(v_phone);
  select c.id into v_contact from public.contacts c where c.org_id = p_org and c.phone = any (v_variants)
  order by (c.phone = v_phone) desc limit 1;

  if v_contact is null then
    insert into public.contacts (org_id, name, phone, category) values (p_org, '+' || v_phone, v_phone, 'lead')
    on conflict (org_id, phone) where phone is not null do nothing returning id into v_contact;
    if v_contact is null then
      select c.id into v_contact from public.contacts c where c.org_id = p_org and c.phone = any (v_variants) limit 1;
    end if;
  end if;

  insert into public.conversations (org_id, contact_id) values (p_org, v_contact) on conflict (contact_id) do nothing;
  select c.id into v_conv from public.conversations c where c.contact_id = v_contact for update;

  v_preview := coalesce(nullif(left(p_body, 140), ''),
    case v_type when 'image' then 'Imagem' when 'document' then 'Documento' when 'audio' then 'Áudio'
                when 'video' then 'Vídeo' when 'sticker' then 'Figurinha' else 'Mensagem' end);

  insert into public.messages (org_id, conversation_id, direction, type, body, media_mime, wa_media_id, wa_message_id, status, created_at, status_updated_at)
  values (p_org, v_conv, 'out', v_type, left(p_body, 4096), p_media_mime, p_wa_media_id, p_wa_message_id, 'sent', v_ts, v_ts)
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

create function public.inbox_apply_status(
  p_org uuid,
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

  -- A empresa precisa ser a dona da mensagem: um webhook de uma empresa nunca mexe em mensagens de outra.
  select m.status into v_cur
  from public.messages m
  where m.wa_message_id = p_wa_message_id and m.direction = 'out' and m.org_id = p_org
  for update;
  if not found then return 0; end if;

  v_rank_cur := case v_cur when 'pending' then 0 when 'sent' then 1 when 'delivered' then 2 when 'read' then 3 else -1 end;

  if p_status = 'failed' then
    if v_rank_cur not in (0, 1) then return 0; end if;
    update public.messages set status = 'failed', error_code = left(p_error_code, 60), error_message = left(p_error_message, 500),
      status_updated_at = coalesce(p_at, now())
    where wa_message_id = p_wa_message_id and org_id = p_org;
    return 1;
  end if;

  v_rank_new := case p_status when 'sent' then 1 when 'delivered' then 2 else 3 end;
  if v_rank_new <= v_rank_cur then return 0; end if;

  update public.messages set status = p_status, status_updated_at = coalesce(p_at, now()),
    error_code = null, error_message = null
  where wa_message_id = p_wa_message_id and org_id = p_org;
  return 1;
end;
$$;

revoke all on function public.inbox_ingest_inbound(uuid, text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.inbox_ingest_echo(uuid, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.inbox_apply_status(uuid, text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.inbox_ingest_inbound(uuid, text, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.inbox_ingest_echo(uuid, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.inbox_apply_status(uuid, text, text, timestamptz, text, text) to service_role;

-- Realtime: a publicação já tem as tabelas de dados; organizations não precisa.
