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
