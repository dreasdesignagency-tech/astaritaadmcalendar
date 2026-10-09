-- Simula o schema storage do Supabase (só o que a migration usa), para testes locais.
create schema if not exists storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.objects to authenticated;
grant all on storage.objects, storage.buckets to service_role;
-- Igual ao do Supabase: devolve as pastas do caminho (tudo menos o nome do arquivo).
create or replace function storage.foldername(name text) returns text[] language plpgsql immutable as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end $$;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
