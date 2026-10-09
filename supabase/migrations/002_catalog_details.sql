-- Structured details, public read and explicitly limited editor writes.
alter table public.catalog_items add column if not exists details jsonb not null
  default '{"specs":[],"variants":[],"length":false,"application":"","documents":[]}'::jsonb;
create or replace function public.valid_catalog_details(d jsonb)
returns boolean language plpgsql immutable set search_path = public as $$
declare x jsonb;
begin
  if jsonb_typeof(d) is distinct from 'object' or
     jsonb_typeof(d->'specs') is distinct from 'array' or
     jsonb_typeof(d->'variants') is distinct from 'array' or
     jsonb_typeof(d->'documents') is distinct from 'array' or
     jsonb_typeof(d->'length') is distinct from 'boolean' or
     jsonb_typeof(d->'application') is distinct from 'string' then return false; end if;
  if jsonb_array_length(d->'specs') > 20 or jsonb_array_length(d->'variants') > 30 or
     jsonb_array_length(d->'documents') > 10 or length(d->>'application') > 1000 then return false; end if;
  for x in select value from jsonb_array_elements(d->'specs') loop
    if jsonb_typeof(x->'label') is distinct from 'string' or jsonb_typeof(x->'value') is distinct from 'string' then return false; end if;
    if length(trim(x->>'label')) not between 1 and 100 or length(trim(x->>'value')) not between 1 and 300 then return false; end if;
  end loop;
  for x in select value from jsonb_array_elements(d->'variants') loop
    if jsonb_typeof(x) is distinct from 'string' or length(trim(x #>> '{}')) not between 1 and 100 then return false; end if;
  end loop;
  if (select count(distinct value) from jsonb_array_elements(d->'variants')) <> jsonb_array_length(d->'variants') then return false; end if;
  for x in select value from jsonb_array_elements(d->'documents') loop
    if jsonb_typeof(x->'title') is distinct from 'string' or jsonb_typeof(x->'url') is distinct from 'string' then return false; end if;
    if length(trim(x->>'title')) not between 1 and 160 or (x->>'url') !~ '^/files/[a-zA-Z0-9_/-]+\.pdf$' then return false; end if;
  end loop;
  return true;
end;
$$;
alter table public.catalog_items drop constraint if exists catalog_details_valid;
alter table public.catalog_items add constraint catalog_details_valid check (public.valid_catalog_details(details));
grant usage on schema public to anon, authenticated;
revoke all on public.catalog_items from anon, authenticated;
grant select on public.catalog_items to anon, authenticated;
grant insert (item_type, title, description, details), update (item_type, title, description, details) on public.catalog_items to authenticated;
revoke all on public.site_admins from anon, authenticated;
grant select on public.site_admins to authenticated;
