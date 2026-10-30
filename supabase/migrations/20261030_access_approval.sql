-- Base Lotufo: aprovação manual de novos usuários
-- Execute no SQL Editor do projeto Supabase antes de ativar a interface.
create table if not exists public.access_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','blocked')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.access_profiles enable row level security;
create or replace function public.access_is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.access_profiles where user_id=auth.uid() and is_admin=true and status='approved'); $$;
revoke all on function public.access_is_admin() from public;
grant execute on function public.access_is_admin() to authenticated;
drop policy if exists "Users read own profile or admin reads all" on public.access_profiles;
create policy "Users read own profile or admin reads all" on public.access_profiles
for select to authenticated using (user_id=auth.uid() or public.access_is_admin());
drop policy if exists "Admin updates approval" on public.access_profiles;
create policy "Admin updates approval" on public.access_profiles
for update to authenticated using (public.access_is_admin())
with check (public.access_is_admin());
create or replace function public.create_access_profile() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.access_profiles(user_id,display_name,status,is_admin)
  values(new.id,coalesce(new.raw_user_meta_data->>'display_name',''),'pending',false)
  on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_access on auth.users;
create trigger on_auth_user_created_access after insert on auth.users
for each row execute function public.create_access_profile();
-- Depois de cadastrar sua própria conta, torne-a administradora no SQL Editor:
-- update public.access_profiles set status='approved',is_admin=true
-- where user_id=(select id from auth.users where email='SEU_EMAIL_AQUI');
-- IMPORTANTE: RLS das tabelas de tutoriais e arquivos deve exigir status approved.
