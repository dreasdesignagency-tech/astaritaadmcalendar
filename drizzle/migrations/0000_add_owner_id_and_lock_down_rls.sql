-- Give every client and post an owner so each account only ever sees its own data.

alter table public.clients add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.contents add column if not exists owner_id uuid references auth.users(id) on delete cascade;

update public.clients set owner_id = auth.uid() where owner_id is null;
update public.contents set owner_id = auth.uid() where owner_id is null;

alter table public.clients alter column owner_id set default auth.uid();
alter table public.clients alter column owner_id set not null;
alter table public.contents alter column owner_id set default auth.uid();
alter table public.contents alter column owner_id set not null;

create index if not exists clients_owner_idx on public.clients(owner_id);
create index if not exists contents_owner_date_idx on public.contents(owner_id, publication_date);

-- Drop the wide-open policies that let anonymous visitors read and write everything.
drop policy if exists clients_all on public.clients;
drop policy if exists contents_all on public.contents;

revoke all on public.clients from anon;
revoke all on public.contents from anon;

grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
grant select, insert, update, delete on public.contents to authenticated;
grant all on public.contents to service_role;

alter table public.clients enable row level security;
alter table public.contents enable row level security;

create policy "owners_read_clients" on public.clients for select to authenticated using (owner_id = auth.uid());
create policy "owners_insert_clients" on public.clients for insert to authenticated with check (owner_id = auth.uid());
create policy "owners_update_clients" on public.clients for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners_delete_clients" on public.clients for delete to authenticated using (owner_id = auth.uid());

create policy "owners_read_contents" on public.contents for select to authenticated using (owner_id = auth.uid());
create policy "owners_insert_contents" on public.contents for insert to authenticated with check (owner_id = auth.uid());
create policy "owners_update_contents" on public.contents for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners_delete_contents" on public.contents for delete to authenticated using (owner_id = auth.uid());