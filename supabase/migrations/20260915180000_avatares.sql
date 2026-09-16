-- ============================================================================
-- Venduo — 0017 fotos de perfil
--
-- `product-images` ya existe y es público, pero mezclar ahí las fotos de las
-- personas con el catálogo hace imposible razonar sobre cualquiera de los dos:
-- la política de borrado, la caducidad y la cuota son distintas para una foto
-- de perfil que para la foto de un producto.
--
-- Público a propósito: el avatar del vendedor se muestra en su perfil laboral,
-- que tiene que abrir alguien sin cuenta para verificarlo.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatares: leer" on storage.objects;
create policy "avatares: leer" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatares: subir" on storage.objects;
create policy "avatares: subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');

-- Solo el dueño del archivo lo borra o lo reemplaza: sin esto, cualquier
-- persona con sesión podría borrar la foto de otra.
drop policy if exists "avatares: borrar propios" on storage.objects;
create policy "avatares: borrar propios" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and owner = (select auth.uid()));

drop policy if exists "avatares: reemplazar propios" on storage.objects;
create policy "avatares: reemplazar propios" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and owner = (select auth.uid()))
  with check (bucket_id = 'avatars');
