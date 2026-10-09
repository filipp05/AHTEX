-- Каталог и закрытый список редакторов сайта «Антех Восток».
-- Выполните миграцию в SQL Editor нового проекта Supabase.

create extension if not exists pgcrypto;

do $$ begin
  create type public.catalog_item_type as enum ('product', 'service');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  item_type public.catalog_item_type not null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null check (char_length(trim(description)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.catalog_items enable row level security;
alter table public.site_admins enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

drop policy if exists "Каталог доступен всем для чтения" on public.catalog_items;
create policy "Каталог доступен всем для чтения"
on public.catalog_items for select
to anon, authenticated
using (true);

drop policy if exists "Редакторы создают позиции" on public.catalog_items;
create policy "Редакторы создают позиции"
on public.catalog_items for insert
to authenticated
with check (public.is_site_admin());

drop policy if exists "Редакторы изменяют позиции" on public.catalog_items;
create policy "Редакторы изменяют позиции"
on public.catalog_items for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

-- Политики DELETE намеренно нет: удаление не входит в первую версию.
drop policy if exists "Редактор видит собственное разрешение" on public.site_admins;
create policy "Редактор видит собственное разрешение"
on public.site_admins for select
to authenticated
using (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalog_items_set_updated_at on public.catalog_items;
create trigger catalog_items_set_updated_at
before update on public.catalog_items
for each row execute function public.set_updated_at();

insert into public.catalog_items (item_type, title, description)
select seed.item_type::public.catalog_item_type, seed.title, seed.description
from (
  values
    ('product', 'Фрикционные трубчатые анкеры', 'Решения для крепления кровли и бортов, усиления горного массива и поддержания горных выработок. Технические характеристики будут опубликованы после подтверждения заказчиком.'),
    ('product', 'Опорные плиты', 'Элемент системы крепления горных выработок. Размеры, варианты исполнения и технические характеристики будут добавлены после получения материалов заказчика.'),
    ('product', 'Армокаркасы', 'Категория продукции «Антех Восток». Назначение, состав и характеристики будут опубликованы только после подтверждения заказчиком.')
) as seed(item_type, title, description)
where not exists (select 1 from public.catalog_items);

comment on table public.catalog_items is 'Публичный каталог продукции и услуг сайта Антех Восток';
comment on table public.site_admins is 'UUID пользователей Supabase Auth, которым разрешено изменять каталог';
