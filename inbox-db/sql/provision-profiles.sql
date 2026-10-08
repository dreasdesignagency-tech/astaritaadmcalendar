-- Astarita Inbox: cria os PERFIS de Andreas e Juline a partir de usuários que JÁ EXISTEM em Authentication.
--
-- ESTE SCRIPT ESCREVE em public.profiles (duas linhas). Não cria usuários, não envia convites ou e-mails,
-- não toca em auth.users. Rode só depois de criar os dois usuários em Authentication > Users do projeto Astarita Inbox.
--
-- Antes de rodar: troque os dois e-mails abaixo. Se algum não existir em Authentication, o script aborta sem gravar nada.
-- Reaproveita perfil existente (atualiza nome e papel e reativa). Pode ser rodado de novo sem duplicar.
begin;

create temp table _wanted (email text, full_name text, role text) on commit drop;
insert into _wanted values
  ('COLOQUE_O_EMAIL_DO_ANDREAS', 'Andreas', 'director'),
  ('COLOQUE_O_EMAIL_DA_JULINE',  'Juline',  'ceo');

do $$
declare r record;
begin
  for r in select * from _wanted loop
    if r.email like 'COLOQUE_%' then
      raise exception 'Preencha o e-mail de % antes de rodar.', r.full_name;
    end if;
    if not exists (select 1 from auth.users u where lower(u.email) = lower(trim(r.email))) then
      raise exception 'O usuário % não existe em Authentication > Users. Crie antes; este script não cria usuários.', r.email;
    end if;
  end loop;
end $$;

insert into public.profiles (id, full_name, role, active)
select u.id, w.full_name, w.role, true
from _wanted w
join auth.users u on lower(u.email) = lower(trim(w.email))
on conflict (id) do update
  set full_name = excluded.full_name, role = excluded.role, active = true;

-- Conferência: deve listar exatamente Andreas e Juline, ativos.
select p.full_name, p.role, p.active, u.email
from public.profiles p join auth.users u on u.id = p.id
order by p.full_name;

commit;
