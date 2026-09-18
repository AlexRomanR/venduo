-- ============================================================================
-- Venduo — referidos por producto y estados de custodia de PagoFácil
--
-- Esta migración es aditiva: conserva `store_sellers` como vínculo interno
-- para el historial ya existente, pero el código que circula pasa a vivir en
-- `seller_products`, que es la unidad que el promotor realmente comparte.
-- ============================================================================

alter type public.order_status add value if not exists 'en_disputa' before 'cancelado';

alter table public.seller_products
  add column if not exists referral_code text;

alter table public.orders
  add column if not exists payment_reference text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists release_due_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists disputed_at timestamptz,
  add column if not exists dispute_reason text;

alter table public.orders
  drop constraint if exists orders_liberacion_excluyente;

alter table public.orders
  add constraint orders_liberacion_excluyente
  check (released_at is null or refunded_at is null);

create or replace function public.generate_product_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
begin
  loop
    select string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1), '')
      into v_code
      from generate_series(1, 8);

    exit when not exists (
      select 1 from public.seller_products where referral_code = v_code
    ) and not exists (
      select 1 from public.store_sellers where referral_code = v_code
    );
  end loop;

  return v_code;
end
$$;

do $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.seller_products where referral_code is null
  loop
    update public.seller_products
       set referral_code = public.generate_product_referral_code()
     where id = v_id;
  end loop;
end
$$;

alter table public.seller_products
  alter column referral_code set not null;

create unique index if not exists seller_products_referral_code_key
  on public.seller_products (referral_code) where deleted_at is null;

create index if not exists seller_products_referral_lookup_idx
  on public.seller_products (referral_code);

create index if not exists orders_payment_reference_idx
  on public.orders (payment_reference) where payment_reference is not null;

comment on column public.seller_products.referral_code is
  'Código único del enlace de este producto para este promotor.';

comment on column public.orders.payment_reference is
  'Identificador del cobro retenido por PagoFácil.';

revoke all on function public.generate_product_referral_code() from public;

