-- PROPOSTA, NÃO APLICADA. Só rodar com aprovação explícita.
-- Projeto: Astarita Inbox (yappbzpayqejqpkfebho). Origem: alertas do Supabase Advisors (segurança e desempenho).
-- Não apaga nada, não altera dados, não muda a estrutura das tabelas. Reversível (ver fim do arquivo).
begin;

-- 1) Alerta de segurança: public.rls_auto_enable() é uma função do próprio projeto (usada pelo gatilho `ensure_rls`,
--    que liga a RLS em tabelas novas) e hoje pode ser chamada por anon/authenticated via /rest/v1/rpc.
--    O gatilho continua funcionando sem esse privilégio (testado localmente). Só retira a chamada pela API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 2) Alerta de desempenho (auth_rls_initplan): auth.uid() deve ser avaliada uma vez por consulta, não por linha.
--    Mesma lógica de acesso, só reescrita com (select auth.uid()).
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

-- 3) Alerta de desempenho (unindexed_foreign_keys): índices nas 8 chaves estrangeiras sem índice.
create index if not exists ai_suggestions_created_by_idx on public.ai_suggestions (created_by);
create index if not exists knowledge_base_updated_by_idx on public.knowledge_base (updated_by);
create index if not exists messages_reply_to_idx on public.messages (reply_to_id);
create index if not exists messages_sent_by_idx on public.messages (sent_by);
create index if not exists opportunities_assigned_to_idx on public.opportunities (assigned_to);
create index if not exists quick_replies_created_by_idx on public.quick_replies (created_by);
create index if not exists reminders_assigned_to_idx on public.reminders (assigned_to);
create index if not exists reminders_created_by_idx on public.reminders (created_by);

commit;

-- Reverter (se necessário):
--   grant execute on function public.rls_auto_enable() to public, anon, authenticated;
--   alter policy "self_update_profile" on public.profiles using (id = auth.uid() and public.is_inbox_member()) with check (id = auth.uid());
--   alter policy "team_queue_outbound_messages" on public.messages with check (public.is_inbox_member() and direction = 'out' and status = 'pending' and sent_by = auth.uid() and wa_message_id is null);
--   drop index if exists public.ai_suggestions_created_by_idx, public.knowledge_base_updated_by_idx, public.messages_reply_to_idx, public.messages_sent_by_idx, public.opportunities_assigned_to_idx, public.quick_replies_created_by_idx, public.reminders_assigned_to_idx, public.reminders_created_by_idx;
