-- Astarita Inbox: instalação em projeto NOVO e exclusivo do Inbox.
-- Destino confirmado: Astarita Inbox / yappbzpayqejqpkfebho.
-- URL: https://yappbzpayqejqpkfebho.supabase.co
-- Preparado em 08/10/2026. Ainda não aplicado.
-- Não usar no projeto do calendário. Não recria objetos existentes.
-- Mantém as duas migrations da branch, com função de trigger exclusiva
-- e permissões explícitas para evitar grants herdados.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $$
DECLARE t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    RAISE EXCEPTION 'Publicação supabase_realtime ausente; parar e investigar';
  END IF;
  FOREACH t IN ARRAY ARRAY[
    'profiles','contacts','conversations','messages','tags','contact_tags',
    'pipeline_stages','opportunities','quick_replies','reminders','knowledge_base',
    'ai_suggestions','webhook_events'
  ] LOOP
    IF to_regclass(format('public.%I',t)) IS NOT NULL THEN
      RAISE EXCEPTION 'Objeto public.% já existe; auditoria necessária antes de aplicar',t;
    END IF;
  END LOOP;
  IF to_regprocedure('public.inbox_set_updated_at()') IS NOT NULL
     OR to_regprocedure('public.is_inbox_member()') IS NOT NULL THEN
    RAISE EXCEPTION 'Função Inbox já existe; auditar antes de aplicar';
  END IF;
END $$;

-- ASTARITA INBOX, fundação do banco (Fase 1).
--
-- Acesso: somente quem tem linha ativa em public.profiles enxerga os dados do Inbox.
-- Perfis só são criados pelo script de provisionamento (service role), nunca pelo navegador.
-- As tabelas do calendário (clients, contents) não são tocadas.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------

create or replace function public.inbox_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: a equipe autorizada (Andreas e Juline)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  role text not null default 'member' check (role in ('director', 'ceo', 'member')),
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.inbox_set_updated_at();

-- Porteiro de todas as políticas. security definer evita recursão de RLS em profiles.
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

revoke all on function public.is_inbox_member() from public, anon;
grant execute on function public.is_inbox_member() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  -- Formato E.164 sem o "+", como a Meta envia (ex.: 5511999998888).
  phone text check (phone is null or phone ~ '^[0-9]{8,15}$'),
  company text,
  instagram text,
  category text not null default 'lead' check (category in ('lead', 'cliente', 'parceiro', 'outro')),
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evita contatos duplicados pelo mesmo número.
create unique index if not exists contacts_phone_key on public.contacts(phone) where phone is not null;
create index if not exists contacts_assigned_idx on public.contacts(assigned_to);
create index if not exists contacts_name_idx on public.contacts(lower(name));

create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.inbox_set_updated_at();

-- ---------------------------------------------------------------------------
-- conversations: uma por contato
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references public.contacts(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'resolved')),
  assigned_to uuid references public.profiles(id) on delete set null,
  unread_count integer not null default 0 check (unread_count >= 0),
  last_message_at timestamptz,
  last_message_preview text,
  -- Última mensagem recebida do cliente: base da janela de 24h da Meta.
  last_inbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_list_idx on public.conversations(last_message_at desc nulls last);
create index if not exists conversations_status_idx on public.conversations(status);
create index if not exists conversations_assigned_idx on public.conversations(assigned_to);

create trigger conversations_set_updated_at before update on public.conversations
  for each row execute function public.inbox_set_updated_at();

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  type text not null default 'text' check (type in ('text', 'image', 'document', 'audio', 'video', 'sticker', 'template', 'unsupported')),
  body text,
  -- Só caminho no Storage privado; nunca URL pública.
  media_path text,
  media_mime text,
  -- Só a Meta preenche: id da mensagem na Cloud API. A unicidade barra duplicatas do webhook.
  wa_message_id text unique,
  -- Gerado no navegador a cada tentativa de envio: barra duplo clique e reenvio.
  client_token uuid unique,
  status text not null default 'received' check (status in ('received', 'pending', 'sent', 'delivered', 'read', 'failed')),
  error_code text,
  error_message text,
  reply_to_id uuid references public.messages(id) on delete set null,
  sent_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  status_updated_at timestamptz,
  check (direction = 'in' or sent_by is not null or status <> 'pending')
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  color text not null default '#4275FF' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

create unique index if not exists tags_name_key on public.tags(lower(name));

create table if not exists public.contact_tags (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

create index if not exists contact_tags_tag_idx on public.contact_tags(tag_id);

-- ---------------------------------------------------------------------------
-- funil comercial
-- ---------------------------------------------------------------------------

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  position integer not null unique,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  check (not (is_won and is_lost))
);

insert into public.pipeline_stages (slug, name, position, is_won, is_lost) values
  ('novo-lead', 'Novo lead', 1, false, false),
  ('em-conversa', 'Em conversa', 2, false, false),
  ('reuniao-marcada', 'Reunião marcada', 3, false, false),
  ('proposta-enviada', 'Proposta enviada', 4, false, false),
  ('negociacao', 'Negociação', 5, false, false),
  ('fechado', 'Fechado', 6, true, false),
  ('perdido', 'Perdido', 7, false, true)
on conflict (slug) do nothing;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id),
  title text,
  assigned_to uuid references public.profiles(id) on delete set null,
  -- Ordem do cartão dentro da coluna.
  position double precision not null default 0,
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_stage_idx on public.opportunities(stage_id, position);
create index if not exists opportunities_contact_idx on public.opportunities(contact_id);

create trigger opportunities_set_updated_at before update on public.opportunities
  for each row execute function public.inbox_set_updated_at();

-- ---------------------------------------------------------------------------
-- respostas rápidas
-- ---------------------------------------------------------------------------

create table if not exists public.quick_replies (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('primeiro_contato', 'apresentacao', 'servicos', 'google_meet', 'propostas', 'acompanhamento', 'agradecimento')),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 4000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quick_replies_category_idx on public.quick_replies(category);

create trigger quick_replies_set_updated_at before update on public.quick_replies
  for each row execute function public.inbox_set_updated_at();

-- ---------------------------------------------------------------------------
-- lembretes internos
-- ---------------------------------------------------------------------------

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  description text not null check (char_length(description) between 1 and 500),
  due_at timestamptz not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'done', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_pending_idx on public.reminders(due_at) where status = 'pending';
create index if not exists reminders_contact_idx on public.reminders(contact_id);

create trigger reminders_set_updated_at before update on public.reminders
  for each row execute function public.inbox_set_updated_at();

-- ---------------------------------------------------------------------------
-- base de conhecimento (alimenta a IA na Fase 5)
-- ---------------------------------------------------------------------------

create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  section text not null unique check (section in ('apresentacao', 'servicos', 'diferenciais', 'metodologia', 'tom_de_voz', 'faq', 'condicoes_comerciais', 'respostas_aprovadas')),
  title text not null,
  content text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger knowledge_base_set_updated_at before update on public.knowledge_base
  for each row execute function public.inbox_set_updated_at();

-- Só o que foi informado no briefing. Serviços, diferenciais, FAQ e condições
-- comerciais ficam vazios de propósito: valores e condições não podem ser inventados.
insert into public.knowledge_base (section, title, content) values
  ('apresentacao', 'Apresentação da empresa',
   E'Astarita Creative Studio.\nStudio criativo especializado em estratégia, conteúdo, audiovisual, identidade visual e digital.\nToda marca tem um centro. A gente encontra.\nEncontre o centro. Expanda o que importa.'),
  ('servicos', 'Serviços', ''),
  ('diferenciais', 'Diferenciais', ''),
  ('metodologia', 'Metodologia',
   E'Encontrar → Destilar → Expandir → Observar.\nA abordagem comercial prioriza entender o cliente antes de apresentar uma proposta.'),
  ('tom_de_voz', 'Tom de voz',
   'Natural, próximo, profissional, objetivo, brasileiro, humano e conversacional. Mensagens curtas quando uma resolve.'),
  ('faq', 'Perguntas frequentes', ''),
  ('condicoes_comerciais', 'Condições comerciais', ''),
  ('respostas_aprovadas', 'Respostas aprovadas', '')
on conflict (section) do nothing;

-- ---------------------------------------------------------------------------
-- sugestões de IA (histórico para auditoria; nada é enviado sem aprovação humana)
-- ---------------------------------------------------------------------------

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  kind text not null check (kind in ('suggest', 'natural', 'shorter', 'professional', 'warmer', 'summary')),
  content text not null,
  provider text,
  model text,
  created_by uuid references public.profiles(id) on delete set null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_suggestions_conversation_idx on public.ai_suggestions(conversation_id, created_at desc);

-- ---------------------------------------------------------------------------
-- eventos de webhook (somente backend escreve)
-- ---------------------------------------------------------------------------

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'whatsapp',
  -- Identificador do evento para idempotência (ex.: wa_message_id + tipo).
  event_key text,
  signature_valid boolean not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create unique index if not exists webhook_events_key on public.webhook_events(provider, event_key) where event_key is not null;
create index if not exists webhook_events_created_idx on public.webhook_events(created_at desc);

-- ---------------------------------------------------------------------------
-- RLS e permissões
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'contacts', 'conversations', 'messages', 'tags', 'contact_tags',
    'pipeline_stages', 'opportunities', 'quick_replies', 'reminders',
    'knowledge_base', 'ai_suggestions', 'webhook_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- profiles: a equipe se enxerga; cada pessoa edita só o próprio nome/avatar.
-- Criação e mudança de papel/ativação só pelo service role.
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
create policy "team_read_profiles" on public.profiles for select to authenticated
  using (public.is_inbox_member());
create policy "self_update_profile" on public.profiles for update to authenticated
  using (id = auth.uid() and public.is_inbox_member())
  with check (id = auth.uid());

-- Tabelas de trabalho: membros ativos leem e escrevem.
do $$
declare t text;
begin
  foreach t in array array[
    'contacts', 'conversations', 'tags', 'contact_tags', 'opportunities',
    'quick_replies', 'reminders', 'knowledge_base', 'ai_suggestions'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "team_select_%1$s" on public.%1$I for select to authenticated using (public.is_inbox_member())', t);
    execute format('create policy "team_insert_%1$s" on public.%1$I for insert to authenticated with check (public.is_inbox_member())', t);
    execute format('create policy "team_update_%1$s" on public.%1$I for update to authenticated using (public.is_inbox_member()) with check (public.is_inbox_member())', t);
    execute format('create policy "team_delete_%1$s" on public.%1$I for delete to authenticated using (public.is_inbox_member())', t);
  end loop;
end $$;

-- Etapas do funil são fixas: só leitura para a equipe.
grant select on public.pipeline_stages to authenticated;
create policy "team_read_pipeline_stages" on public.pipeline_stages for select to authenticated
  using (public.is_inbox_member());

-- Mensagens: o navegador lê e só registra envios pendentes feitos pela própria pessoa.
-- Mudanças de status (enviado, entregue, falhou) vêm do backend, após confirmação da Meta.
grant select, insert on public.messages to authenticated;
create policy "team_read_messages" on public.messages for select to authenticated
  using (public.is_inbox_member());
create policy "team_queue_outbound_messages" on public.messages for insert to authenticated
  with check (
    public.is_inbox_member()
    and direction = 'out'
    and status = 'pending'
    and sent_by = auth.uid()
    and wa_message_id is null
  );

-- Eventos de webhook: leitura para diagnóstico; escrita só no backend.
grant select on public.webhook_events to authenticated;
create policy "team_read_webhook_events" on public.webhook_events for select to authenticated
  using (public.is_inbox_member());

-- ---------------------------------------------------------------------------
-- Realtime (a lista de conversas atualiza sem recarregar a página)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.conversations; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  end if;
end $$;

-- Fase 2: a lista de conversas mostra dados do contato e as etiquetas,
-- então mudanças nessas tabelas também precisam chegar em tempo real.
-- Só adiciona tabelas à publicação do Realtime. Não altera dados nem estrutura.
-- A RLS continua valendo: o Realtime só entrega linhas que a pessoa pode ler.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.contacts; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.contact_tags; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.tags; exception when duplicate_object then null; end;
  end if;
end $$;

-- A função de trigger não é endpoint de API; somente o mecanismo de triggers a usa.
REVOKE ALL ON FUNCTION public.inbox_set_updated_at() FROM public, anon, authenticated;
COMMIT;
-- Confirmar resultado usando auditoria-inbox-somente-leitura.sql.
-- Não provisiona usuários ou perfis e não envia e-mails/WhatsApp.
-- Histórico de migrations deve ser reconciliado pelo fluxo de aplicação escolhido.
