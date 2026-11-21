-- Una tienda que no se sirve no se lee desde afuera.
--
-- "tiendas: leer" dejaba leer cualquier tienda publicada. Los productos ya
-- pedían `store_is_live`, así que una tienda pausada por Venduo, con la
-- suscripción bloqueada o dada de baja seguía abriendo: su nombre, su portada
-- y el botón de WhatsApp, sin nada que comprar. La baja promete que la tienda
-- "deja de verse en el acto", y no se cumplía.
--
-- Ahora se lee si es del dueño o si se sirve. `store_is_live` ya incluye
-- `is_published`, y es `security definer`: consultar `stores` desde la política
-- de `stores` no entra en recursión.
--
-- La administración lee con la clave de servicio y no pasa por acá.

drop policy if exists "tiendas: leer" on public.stores;
create policy "tiendas: leer" on public.stores
  for select using (
    deleted_at is null
    and (
      owner_id = (select auth.uid())
      or public.store_is_live(id)
    )
  );
