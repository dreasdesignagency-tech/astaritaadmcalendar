-- APLICADA em 09/10/2026 (insert dos metadados da baseline no ledger). Histórico, não reaplicar.
--
-- Pré-condição: o ledger já existir. Ele é criado pelo apply_migration do hardening (passo A). Confira antes:
--   select to_regclass('supabase_migrations.schema_migrations');   -- deve devolver o nome, não null
-- Se o apply_migration não tiver criado o ledger, usar a rede de segurança no fim deste arquivo.
--
-- Este comando só grava METADADOS: não reexecuta o SQL da baseline (ele já está instalado) e não toca nas tabelas do Inbox.
-- Insere só as colunas version, name, statements, que existem em todas as versões do ledger do Supabase.
insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261008000000',
  'inbox_install',
  array['-- Baseline instalada manualmente pelo SQL Editor em 08/10/2026. Conteúdo em inbox-db/supabase/migrations/20261008000000_inbox_install.sql (SHA-256 0fba7362035e3280b7e638fa0fbb60494efcc01c083c313c9dd6b8a32734ff24). Este registro não reexecuta o SQL.']
)
on conflict (version) do nothing;

-- Conferir: select version, name from supabase_migrations.schema_migrations order by version;  -- 2 linhas

-- Reverter (apaga só as linhas de metadados que criamos; <versão_do_hardening> é a que o apply_migration atribuiu):
--   delete from supabase_migrations.schema_migrations where version in ('20261008000000', '<versão_do_hardening>');
--   -- e, só se a tabela tiver ficado vazia e tiver sido criada por nós: drop table supabase_migrations.schema_migrations;

-- Rede de segurança (somente se o ledger NÃO existir depois do passo A):
--   create schema if not exists supabase_migrations;
--   create table if not exists supabase_migrations.schema_migrations (version text not null primary key, statements text[], name text);
