create table if not exists public.categories (
  id         text primary key,
  name_fr    text not null check (char_length(name_fr) between 1 and 60),
  name_en    text check (char_length(name_en) <= 60),
  image_url  text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  category_id    text not null references public.categories (id) on update cascade on delete restrict,
  group_fr       text check (char_length(group_fr) <= 40),
  group_en       text check (char_length(group_en) <= 40),
  is_extra       boolean not null default false,
  name_fr        text not null check (char_length(name_fr) between 1 and 80),
  name_en        text check (char_length(name_en) <= 80),
  description_fr text check (char_length(description_fr) <= 300),
  description_en text check (char_length(description_en) <= 300),
  price          numeric(7, 2) not null check (price >= 0 and price < 10000),
  image_url      text,
  available      boolean not null default true,
  featured       boolean not null default false,
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists items_category_position on public.items (category_id, position);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email   text,
  added_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

alter table public.categories enable row level security;
alter table public.items      enable row level security;
alter table public.admins     enable row level security;

drop policy if exists "categories: everyone reads"  on public.categories;
drop policy if exists "categories: admins insert"   on public.categories;
drop policy if exists "categories: admins update"   on public.categories;
drop policy if exists "categories: admins delete"   on public.categories;
create policy "categories: everyone reads" on public.categories for select to anon, authenticated using (true);
create policy "categories: admins insert"  on public.categories for insert to authenticated with check (public.is_admin());
create policy "categories: admins update"  on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categories: admins delete"  on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "items: everyone reads" on public.items;
drop policy if exists "items: admins insert"  on public.items;
drop policy if exists "items: admins update"  on public.items;
drop policy if exists "items: admins delete"  on public.items;
create policy "items: everyone reads" on public.items for select to anon, authenticated using (true);
create policy "items: admins insert"  on public.items for insert to authenticated with check (public.is_admin());
create policy "items: admins update"  on public.items for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "items: admins delete"  on public.items for delete to authenticated using (public.is_admin());

drop policy if exists "admins: see own row" on public.admins;
create policy "admins: see own row" on public.admins for select to authenticated using (user_id = (select auth.uid()));

grant select on public.categories, public.items to anon, authenticated;
grant insert, update, delete on public.categories, public.items to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.reorder_categories(ids text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  update public.categories as c
     set position = x.ord
    from unnest(ids) with ordinality as x(id, ord)
   where c.id = x.id;
end;
$$;

revoke execute on function public.reorder_categories(text[]) from public, anon;
grant execute on function public.reorder_categories(text[]) to authenticated;

create or replace function public.reorder_items(ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  update public.items as i
     set position = x.ord
    from unnest(ids) with ordinality as x(id, ord)
   where i.id = x.id;
end;
$$;

revoke execute on function public.reorder_items(uuid[]) from public, anon;
grant execute on function public.reorder_items(uuid[]) to authenticated;

create table if not exists public.settings (
  key        text primary key check (key ~ '^[a-z_]{1,40}$'),
  value      text not null default '' check (char_length(value) <= 300),
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "settings: everyone reads" on public.settings;
drop policy if exists "settings: admins insert"  on public.settings;
drop policy if exists "settings: admins update"  on public.settings;
drop policy if exists "settings: admins delete"  on public.settings;
create policy "settings: everyone reads" on public.settings for select to anon, authenticated using (true);
create policy "settings: admins insert"  on public.settings for insert to authenticated with check (public.is_admin());
create policy "settings: admins update"  on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings: admins delete"  on public.settings for delete to authenticated using (public.is_admin());

grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu', 'menu', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "menu photos: admins list"   on storage.objects;
drop policy if exists "menu photos: admins upload" on storage.objects;
drop policy if exists "menu photos: admins update" on storage.objects;
drop policy if exists "menu photos: admins delete" on storage.objects;
create policy "menu photos: admins list"   on storage.objects for select to authenticated using (bucket_id = 'menu' and public.is_admin());
create policy "menu photos: admins upload" on storage.objects for insert to authenticated with check (bucket_id = 'menu' and public.is_admin());
create policy "menu photos: admins update" on storage.objects for update to authenticated using (bucket_id = 'menu' and public.is_admin());
create policy "menu photos: admins delete" on storage.objects for delete to authenticated using (bucket_id = 'menu' and public.is_admin());
