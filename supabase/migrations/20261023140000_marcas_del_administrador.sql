-- ============================================================================
-- Lo que marca el administrador no lo desmarca el dueño.
--
-- Las políticas "tienda propia: actualizar" y "productos propios: administrar"
-- dejan escribir cualquier columna de la fila propia. Con eso un dueño podía
-- borrar por la API su propio `stores.suspended_at` —la pausa que puso
-- Venduo—, su `closed_at` o el `products.moderated_at` de un producto que
-- Venduo ocultó. Este disparador lo rechaza.
--
-- No es `security definer` a propósito: necesita ver quién llama. Desde la API
-- con sesión, `current_user` es `authenticated`; la clave de servicio, que es
-- la que usa el administrador, y las funciones `security definer` —como
-- `dar_de_baja_mi_cuenta`— corren con otro rol y pasan.
--
-- Fijado en supabase/tests/marcas_del_administrador.test.sql.
-- ============================================================================

create or replace function public.proteger_marcas_del_administrador()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_platform_admin() then
    return new;
  end if;

  -- Anidados y no con `and`: plpgsql resuelve las columnas de las dos
  -- condiciones, y `products` no tiene `suspended_at`.
  if tg_table_name = 'stores' then
    if new.suspended_at is distinct from old.suspended_at
       or new.closed_at is distinct from old.closed_at then
      raise exception 'Eso solo lo cambia Venduo';
    end if;
  elsif tg_table_name = 'products' then
    if new.moderated_at is distinct from old.moderated_at then
      raise exception 'Eso solo lo cambia Venduo';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists proteger_marcas_del_administrador on public.stores;
create trigger proteger_marcas_del_administrador
  before update on public.stores
  for each row execute function public.proteger_marcas_del_administrador();

drop trigger if exists proteger_marcas_del_administrador on public.products;
create trigger proteger_marcas_del_administrador
  before update on public.products
  for each row execute function public.proteger_marcas_del_administrador();
