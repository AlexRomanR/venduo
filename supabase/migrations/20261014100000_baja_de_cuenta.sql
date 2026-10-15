-- ============================================================================
-- Dar de baja una cuenta, como exigen Google y Apple para publicar la app.
--
-- Dos tiempos:
--
-- 1. **En el acto** (`dar_de_baja_mi_cuenta`): la tienda deja de servirse y de
--    recibir pedidos, la persona deja de ver sus datos —`my_store_id()` ya no
--    devuelve su tienda— y sus celulares dejan de recibir avisos. El ingreso lo
--    bloquea la aplicación con la clave de servicio, que es la única que puede
--    tocar Auth: ver `lib/cuenta.ts`.
-- 2. **A los 90 días** (`aplicar_bajas_de_cuenta`, una vez al día): el borrado
--    lógico de siempre sobre la tienda y su contenido, y se vacían el nombre,
--    la foto y el WhatsApp. Las filas quedan, con `deleted_at`, como en todo
--    el sistema; los pedidos no se tocan —no tienen borrado lógico— y quedan
--    colgados de una tienda dada de baja.
--
-- La baja no se deshace desde la aplicación.
-- ============================================================================

alter table public.stores
  add column if not exists closed_at timestamptz;

alter table public.profiles
  add column if not exists closed_at timestamptz;

-- Una fila por cuenta dada de baja: cuándo se pidió y cuándo se borra. Sin
-- políticas, como las tablas de la administración: la escriben las funciones
-- de abajo y la lee la clave de servicio.
create table if not exists public.account_closures (
  user_id      uuid primary key references auth.users (id),
  store_id     uuid references public.stores (id),
  requested_at timestamptz not null default now(),
  delete_at    timestamptz not null default now() + interval '90 days',
  -- Cuándo corrió el borrado lógico. Nulo mientras esperan los 90 días.
  deleted_at   timestamptz
);

alter table public.account_closures enable row level security;

create index if not exists account_closures_pendientes_idx
  on public.account_closures (delete_at) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- La tienda de una cuenta dada de baja no es de nadie ni se sirve
-- ----------------------------------------------------------------------------

create or replace function public.my_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.stores
  where owner_id = (select auth.uid())
    and deleted_at is null
    and closed_at is null
  limit 1
$$;

create or replace function public.store_is_live(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores s
    left join public.subscriptions sub on sub.store_id = s.id
    where s.id = p_store_id
      and s.is_published
      and s.deleted_at is null
      and s.closed_at is null
      and s.suspended_at is null
      and (sub.id is null or sub.status in ('prueba', 'activa'))
  )
$$;

-- ----------------------------------------------------------------------------
-- 1. En el acto
-- ----------------------------------------------------------------------------

create or replace function public.dar_de_baja_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := (select auth.uid());
  v_store uuid;
begin
  if v_user is null then
    raise exception 'Necesitas iniciar sesión';
  end if;

  select id into v_store
    from public.stores
   where owner_id = v_user
     and deleted_at is null
   limit 1;

  -- Pedirla dos veces no corre la fecha del borrado.
  insert into public.account_closures (user_id, store_id)
  values (v_user, v_store)
  on conflict (user_id) do nothing;

  update public.stores
     set closed_at = coalesce(closed_at, now())
   where id = v_store;

  update public.profiles
     set closed_at = coalesce(closed_at, now())
   where id = v_user;

  update public.push_tokens
     set deleted_at = now(), updated_at = now()
   where user_id = v_user
     and deleted_at is null;
end $$;

revoke all on function public.dar_de_baja_mi_cuenta() from public, anon;
grant execute on function public.dar_de_baja_mi_cuenta() to authenticated;

-- ----------------------------------------------------------------------------
-- 2. A los 90 días
-- ----------------------------------------------------------------------------

create or replace function public.aplicar_bajas_de_cuenta()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_baja  record;
  v_hecho integer := 0;
begin
  for v_baja in
    select user_id, store_id
      from public.account_closures
     where deleted_at is null
       and delete_at <= now()
     for update skip locked
  loop
    if v_baja.store_id is not null then
      update public.store_blocks       set deleted_at = now() where store_id = v_baja.store_id and deleted_at is null;
      update public.store_pages        set deleted_at = now() where store_id = v_baja.store_id and deleted_at is null;
      update public.catalogs           set deleted_at = now() where store_id = v_baja.store_id and deleted_at is null;
      update public.products           set deleted_at = now() where store_id = v_baja.store_id and deleted_at is null;
      update public.product_categories set deleted_at = now() where store_id = v_baja.store_id and deleted_at is null;

      update public.stores
         set deleted_at = coalesce(deleted_at, now()),
             whatsapp   = null
       where id = v_baja.store_id;
    end if;

    update public.profiles
       set deleted_at = coalesce(deleted_at, now()),
           full_name  = null,
           avatar_url = null
     where id = v_baja.user_id;

    update public.account_closures
       set deleted_at = now()
     where user_id = v_baja.user_id;

    v_hecho := v_hecho + 1;
  end loop;

  return v_hecho;
end $$;

revoke all on function public.aplicar_bajas_de_cuenta() from public, anon, authenticated;

-- Todos los días a las 4 de la mañana en Bolivia: las 8:00 UTC.
do $$
begin
  perform cron.unschedule('venduo-bajas-de-cuenta');
exception when others then
  null;
end $$;

select cron.schedule(
  'venduo-bajas-de-cuenta',
  '0 8 * * *',
  $$select public.aplicar_bajas_de_cuenta()$$
);
