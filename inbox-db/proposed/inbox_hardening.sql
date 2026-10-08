-- PROPOSTA, NÃO APLICADA. Só rodar com aprovação explícita.
-- Projeto: Astarita Inbox (yappbzpayqejqpkfebho). Origem: alertas do Supabase Advisors (segurança e desempenho).
-- Não apaga nada, não altera dados, não muda a estrutura das tabelas.
--
-- Sem BEGIN/COMMIT de propósito: o apply_migration e o CLI já executam o arquivo numa única transação.
-- Se qualquer comando falhar, nada é aplicado. Todos os comandos são idempotentes (rodar de novo não faz mal).

-- 1) Segurança: public.rls_auto_enable() é função do próprio projeto (usada pelo gatilho `ensure_rls`, que liga a
--    RLS em tabelas novas). Hoje está sem ACL própria, ou seja, executável por PUBLIC (logo, por anon e authenticated)
--    via /rest/v1/rpc. Retira a chamada pela API. O gatilho continua funcionando (testado).
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 2) Desempenho (auth_rls_initplan): auth.uid() avaliada uma vez por consulta, não por linha.
--    Mesma regra de acesso, conferida contra as definições atuais do banco real (pg_policy), só reescrita.
alter policy "self_update_profile" on public.profiles
  using (id = (select auth.uid()) and public.is_inbox_member())
  with check (id = (select auth.uid()));

alter policy "team_queue_outbound_messages" on public.messages
  with check (
    public.is_inbox_member()
    and direction = 'out'
    and status = 'pending'
    and sent_by = (select auth.uid())
    and wa_message_id is null
  );

-- 3) Desempenho (unindexed_foreign_keys): índices nas 8 chaves estrangeiras sem índice. Nenhum dos nomes existe hoje.
create index if not exists ai_suggestions_created_by_idx on public.ai_suggestions (created_by);
create index if not exists knowledge_base_updated_by_idx on public.knowledge_base (updated_by);
create index if not exists messages_reply_to_idx on public.messages (reply_to_id);
create index if not exists messages_sent_by_idx on public.messages (sent_by);
create index if not exists opportunities_assigned_to_idx on public.opportunities (assigned_to);
create index if not exists quick_replies_created_by_idx on public.quick_replies (created_by);
create index if not exists reminders_assigned_to_idx on public.reminders (assigned_to);
create index if not exists reminders_created_by_idx on public.reminders (created_by);
