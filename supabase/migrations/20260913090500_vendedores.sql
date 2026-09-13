-- ============================================================================
-- Venduo — 0005 red de vendedores
--
-- Acá vive la asimetría que define el modelo: un emprendedor tiene una sola
-- tienda, pero un vendedor pertenece a varias. Esta tabla es el único lugar
-- donde una persona cruza tenants.
-- ============================================================================

create table if not exists public.store_sellers (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  referral_code  text not null,
  status         public.seller_status not null default 'activo',
  joined_at      timestamptz not null default now(),
  approved_at    timestamptz,
  approved_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

-- Únicos solo entre filas vivas: un vínculo dado de baja no puede impedir
-- que la persona vuelva a sumarse, ni bloquear el código para siempre.
create unique index if not exists store_sellers_store_user_key
  on public.store_sellers (store_id, user_id) where deleted_at is null;

create unique index if not exists store_sellers_referral_code_key
  on public.store_sellers (referral_code) where deleted_at is null;

-- El panel del vendedor lista sus vínculos activos en todas las tiendas.
create index if not exists store_sellers_user_idx
  on public.store_sellers (user_id, status) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- Genera un código de referido corto y legible.
--
-- Sin caracteres ambiguos (0/O, 1/I/L): el código se dicta por teléfono y se
-- tipea desde un QR mal escaneado.
-- ----------------------------------------------------------------------------
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_intentos int := 0;
begin
  loop
    v_code := '';
    for i in 1..7 loop
      v_code := v_code || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;

    exit when not exists (
      select 1 from public.store_sellers
      where referral_code = v_code and deleted_at is null
    );

    v_intentos := v_intentos + 1;
    if v_intentos > 20 then
      raise exception 'No se pudo generar un código de referido único';
    end if;
  end loop;

  return v_code;
end $$;
