-- REVERSÃO da proposta inbox_hardening.sql. Também só com aprovação. Devolve o estado verificado em 08/10/2026.
-- Também é executável como uma única transação.

grant execute on function public.rls_auto_enable() to public;

alter policy "self_update_profile" on public.profiles
  using (id = auth.uid() and public.is_inbox_member())
  with check (id = auth.uid());

alter policy "team_queue_outbound_messages" on public.messages
  with check (
    public.is_inbox_member()
    and direction = 'out'
    and status = 'pending'
    and sent_by = auth.uid()
    and wa_message_id is null
  );

drop index if exists public.ai_suggestions_created_by_idx;
drop index if exists public.knowledge_base_updated_by_idx;
drop index if exists public.messages_reply_to_idx;
drop index if exists public.messages_sent_by_idx;
drop index if exists public.opportunities_assigned_to_idx;
drop index if exists public.quick_replies_created_by_idx;
drop index if exists public.reminders_assigned_to_idx;
drop index if exists public.reminders_created_by_idx;
