-- Glow Glossary database schema for Supabase.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: everything is created only if missing (functions/policies are replaced).
--
-- Access model
--   * The storefront and admin talk only to the Express server, which uses the service_role key
--     (it bypasses Row Level Security). The browser never receives a Supabase key.
--   * RLS is still enabled on every table, so the public anon key can only read live products
--     and their images, and can never read orders or promo codes.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text not null check (char_length(name) between 2 and 120),
  tagline          text not null default '',
  description      text not null default '',
  price_paise      integer not null check (price_paise >= 0),
  compare_at_paise integer check (compare_at_paise is null or compare_at_paise >= 0),
  size             text not null default '',
  category         text not null default 'matcha'
                   check (category in ('matcha', 'kits', 'collagen', 'accessories')),
  badges           text[] not null default '{}',
  stock            integer check (stock is null or stock >= 0), -- null = not tracked
  is_active        boolean not null default true,
  is_featured      boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists products_listing_idx on public.products (is_active, sort_order, created_at);

create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  path        text,              -- object path in the storage bucket
  alt         text not null default '',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id, position);

create table if not exists public.promo_codes (
  code         text primary key check (code ~ '^[A-Z0-9_-]{3,30}$'),
  percent_off  integer not null check (percent_off between 1 and 90),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    bigint generated always as identity (start with 1001) unique,
  public_token    uuid not null default gen_random_uuid(), -- lets the customer view their own order
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  customer_name   text not null,
  email           text not null,
  phone           text not null,
  address_line1   text not null,
  address_line2   text not null default '',
  city            text not null,
  state           text not null,
  pincode         text not null,
  notes           text not null default '',
  promo_code      text,
  subtotal_paise  bigint not null check (subtotal_paise >= 0),
  discount_paise  bigint not null default 0 check (discount_paise >= 0),
  shipping_paise  integer not null default 0 check (shipping_paise >= 0),
  cod_fee_paise   integer not null default 0 check (cod_fee_paise >= 0),
  total_paise     bigint not null check (total_paise >= 0),
  payment_method  text not null default 'cod',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
-- added after the first release: safe to run on an existing database
alter table public.orders add column if not exists cod_fee_paise integer not null default 0;

create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  name              text not null,        -- snapshot at the time of purchase
  image_url         text,
  unit_price_paise  integer not null check (unit_price_paise >= 0),
  quantity          integer not null check (quantity between 1 and 20),
  line_total_paise  bigint not null check (line_total_paise >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  email       text not null,
  phone       text not null default '',
  topic       text not null default 'other'
              check (topic in ('order', 'wholesale', 'cafe', 'events', 'press', 'other')),
  message     text not null check (char_length(message) between 10 and 3000),
  status      text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at  timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Checkout: one transaction that prices the cart from the catalogue, checks and
-- decrements stock, applies an active promo code and records the order.
-- p_customer: {name, email, phone, line1, line2, city, state, pincode, notes}
-- p_items:    [{product_id, quantity}, ...]
-- p_cod_fee:  cash-on-delivery handling fee in paise (set by the server)
-- ---------------------------------------------------------------------------
drop function if exists public.create_order(jsonb, jsonb, text); -- older 3-argument version
create or replace function public.create_order(p_customer jsonb, p_items jsonb, p_promo text default null, p_cod_fee integer default 0)
returns public.orders
language plpgsql
set search_path = ''
as $$
declare
  v_order     public.orders;
  v_item      record;
  v_product   public.products;
  v_lines     jsonb := '[]'::jsonb;
  v_subtotal  bigint := 0;
  v_discount  bigint := 0;
  v_code      text;
  v_percent   integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- Merge duplicate lines, then lock each product row while we check and update it.
  for v_item in
    select (e ->> 'product_id')::uuid as product_id, sum((e ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as e
    group by 1
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 20 then
      raise exception 'BAD_QUANTITY';
    end if;

    select * into v_product
    from public.products
    where id = v_item.product_id and is_active
    for update;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;
    if v_product.stock is not null and v_product.stock < v_item.quantity then
      raise exception 'OUT_OF_STOCK:%', v_product.name;
    end if;
    if v_product.stock is not null then
      update public.products set stock = stock - v_item.quantity where id = v_product.id;
    end if;

    v_subtotal := v_subtotal + v_product.price_paise::bigint * v_item.quantity;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'image_url', (select i.url from public.product_images i where i.product_id = v_product.id order by i.position limit 1),
      'unit', v_product.price_paise,
      'quantity', v_item.quantity
    );
  end loop;

  if p_promo is not null and length(trim(p_promo)) > 0 then
    select code, percent_off into v_code, v_percent
    from public.promo_codes
    where code = upper(trim(p_promo)) and active;
    if found then
      -- rounded down to whole rupees
      v_discount := (floor(v_subtotal::numeric * v_percent / 10000) * 100)::bigint;
    end if;
  end if;

  insert into public.orders (
    customer_name, email, phone, address_line1, address_line2, city, state, pincode, notes,
    promo_code, subtotal_paise, discount_paise, shipping_paise, cod_fee_paise, total_paise
  ) values (
    p_customer ->> 'name', p_customer ->> 'email', p_customer ->> 'phone',
    p_customer ->> 'line1', coalesce(p_customer ->> 'line2', ''),
    p_customer ->> 'city', p_customer ->> 'state', p_customer ->> 'pincode',
    coalesce(p_customer ->> 'notes', ''),
    v_code, v_subtotal, v_discount, 0, greatest(coalesce(p_cod_fee, 0), 0),
    v_subtotal - v_discount + greatest(coalesce(p_cod_fee, 0), 0)
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, name, image_url, unit_price_paise, quantity, line_total_paise)
  select v_order.id,
         (l ->> 'product_id')::uuid,
         l ->> 'name',
         l ->> 'image_url',
         (l ->> 'unit')::integer,
         (l ->> 'quantity')::integer,
         (l ->> 'unit')::bigint * (l ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) as l;

  return v_order;
end;
$$;

-- Only the server (service_role) may place orders this way.
revoke all on function public.create_order(jsonb, jsonb, text, integer) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.create_order(jsonb, jsonb, text, integer) from anon, authenticated;
    grant execute on function public.create_order(jsonb, jsonb, text, integer) to service_role;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.promo_codes    enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "Live products are public" on public.products;
create policy "Live products are public" on public.products
  for select using (is_active);

drop policy if exists "Images of live products are public" on public.product_images;
create policy "Images of live products are public" on public.product_images
  for select using (exists (select 1 from public.products p where p.id = product_id and p.is_active));

-- promo_codes, orders, order_items and contact_messages have no policies:
-- only the service role can touch them.

-- ---------------------------------------------------------------------------
-- Storage: a public bucket for product photos (read by anyone, written only by the server)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('product-images', 'product-images', true, 10485760, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
    on conflict (id) do update set public = true;
  end if;
end;
$$;
