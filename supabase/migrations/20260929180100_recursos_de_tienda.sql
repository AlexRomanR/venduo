-- ============================================================================
-- Venduo — las imágenes de cada tienda: su logo y sus fotos
--
-- Bucket aparte de `product-images`: ahí sube cualquiera a cualquier ruta, y
-- estas imágenes terminan en la cabecera de la tienda. Acá cada tienda escribe
-- solo en su carpeta —`{store_id}/…`— y el propio bucket rechaza lo que no sea
-- JPG, PNG o WebP o pase de 5 MB. SVG no: puede traer código.
--
-- Público para leer, porque lo ve el comprador sin cuenta. Listar la carpeta,
-- en cambio, solo lo hace su dueño: es la biblioteca del editor.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-assets',
  'store-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "recursos de tienda: listar propios" on storage.objects;
create policy "recursos de tienda: listar propios" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'store-assets'
    and (storage.foldername(name))[1] = (select public.my_store_id())::text
  );

drop policy if exists "recursos de tienda: subir" on storage.objects;
create policy "recursos de tienda: subir" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'store-assets'
    and (storage.foldername(name))[1] = (select public.my_store_id())::text
  );

drop policy if exists "recursos de tienda: reemplazar" on storage.objects;
create policy "recursos de tienda: reemplazar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'store-assets'
    and (storage.foldername(name))[1] = (select public.my_store_id())::text
  )
  with check (
    bucket_id = 'store-assets'
    and (storage.foldername(name))[1] = (select public.my_store_id())::text
  );

drop policy if exists "recursos de tienda: borrar" on storage.objects;
create policy "recursos de tienda: borrar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'store-assets'
    and (storage.foldername(name))[1] = (select public.my_store_id())::text
  );
