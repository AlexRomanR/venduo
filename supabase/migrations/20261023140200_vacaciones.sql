-- ============================================================================
-- La tienda de vacaciones: se sigue viendo, pero no recibe pedidos.
--
-- No es la pausa del administrador (`suspended_at`), que la saca del público.
-- `store_is_live` no cambia: la tienda de vacaciones se sirve igual.
--
-- `vacaciones_desde` en null es que no está de vacaciones. `vacaciones_hasta`
-- es el día que vuelve, en Bolivia: ese día ya recibe pedidos. Nada escribe
-- para reactivarla: se decide al leer, y el día de vuelta la condición deja de
-- cumplirse sola. Sin tarea programada que se olvide de correr.
--
-- Quien la rechaza es un disparador sobre `orders` y no `create_order`, que es
-- la función larga del carrito: reescribirla por una línea arriesgaba el
-- carrito de todas las tiendas. Corta en el insert del pedido, antes de sus
-- líneas, y la transacción entera se deshace. La venta directa
-- (`origen = 'directa'`) sigue: es lo que se vende en persona.
--
-- Fijado en supabase/tests/vacaciones.test.sql.
-- ============================================================================

alter table public.stores
  add column if not exists vacaciones_desde timestamptz,
  add column if not exists vacaciones_hasta date;

alter table public.stores drop constraint if exists stores_vacaciones_check;
alter table public.stores add constraint stores_vacaciones_check
  check (vacaciones_hasta is null or vacaciones_desde is not null);

comment on column public.stores.vacaciones_desde is
  'Desde cuándo está de vacaciones: no recibe pedidos de la tienda. Null: no lo está.';
comment on column public.stores.vacaciones_hasta is
  'El día que vuelve, en Bolivia. Ese día ya recibe pedidos. Null: sin fecha.';

create or replace function public.tienda_de_vacaciones(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.stores s
     where s.id = p_store_id
       and s.vacaciones_desde is not null
       and (s.vacaciones_hasta is null
            or s.vacaciones_hasta > (now() at time zone 'America/La_Paz')::date)
  )
$$;

revoke all on function public.tienda_de_vacaciones(uuid) from public;
grant execute on function public.tienda_de_vacaciones(uuid) to anon, authenticated;

create or replace function public.pedido_de_vacaciones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.origen = 'tienda' and public.tienda_de_vacaciones(new.store_id) then
    raise exception 'La tienda está de vacaciones';
  end if;
  return new;
end $$;

revoke all on function public.pedido_de_vacaciones() from public, anon, authenticated;

drop trigger if exists pedido_de_vacaciones on public.orders;
create trigger pedido_de_vacaciones
  before insert on public.orders
  for each row execute function public.pedido_de_vacaciones();

-- La captura de la portada queda vieja al entrar y al salir de vacaciones: la
-- banda se ve. La vuelta sola, el día de la fecha, la detecta `lib/vista.ts`.
create or replace function public.vista_cambio_tienda()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Escribir la captura no la vuelve vieja: solo lo que se ve en la portada.
  if row(new.name, new.tagline, new.description, new.logo_url, new.theme_overrides,
         new.template_key, new.is_published, new.whatsapp, new.slug,
         new.suspended_at, new.closed_at,
         new.vacaciones_desde, new.vacaciones_hasta)
     is distinct from
     row(old.name, old.tagline, old.description, old.logo_url, old.theme_overrides,
         old.template_key, old.is_published, old.whatsapp, old.slug,
         old.suspended_at, old.closed_at,
         old.vacaciones_desde, old.vacaciones_hasta)
  then
    new.vista_cambio_at := now();
  end if;
  return new;
end $$;
