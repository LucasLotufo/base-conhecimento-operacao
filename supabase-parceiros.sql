-- Base de conhecimento - Operação: parceiros e contatos de escalonamento
-- Execute este arquivo no SQL Editor do projeto Supabase antes de usar a aba Parceiros.

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  contacts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_contacts_is_array check (jsonb_typeof(contacts) = 'array')
);

alter table public.partners enable row level security;

grant select on public.partners to anon, authenticated;
grant insert, update, delete on public.partners to authenticated;

drop policy if exists "Partners are readable by everyone" on public.partners;
create policy "Partners are readable by everyone"
  on public.partners for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can insert partners" on public.partners;
create policy "Authenticated users can insert partners"
  on public.partners for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update partners" on public.partners;
create policy "Authenticated users can update partners"
  on public.partners for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete partners" on public.partners;
create policy "Authenticated users can delete partners"
  on public.partners for delete
  to authenticated
  using (auth.uid() is not null);

create index if not exists partners_created_at_idx
  on public.partners (created_at desc);
