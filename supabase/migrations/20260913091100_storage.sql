-- ============================================================================
-- Venduo — 0011 Storage: buckets y sus políticas
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Privado: un comprobante de pago tiene datos bancarios de una persona.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "imagenes de producto: leer" on storage.objects;
create policy "imagenes de producto: leer" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "imagenes de producto: subir" on storage.objects;
create policy "imagenes de producto: subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "imagenes de producto: borrar" on storage.objects;
create policy "imagenes de producto: borrar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and owner = (select auth.uid()));

-- El comprador sube su comprobante sin tener cuenta.
drop policy if exists "comprobantes: subir" on storage.objects;
create policy "comprobantes: subir" on storage.objects
  for insert with check (bucket_id = 'payment-proofs');

drop policy if exists "comprobantes: leer propios" on storage.objects;
create policy "comprobantes: leer propios" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and owner = (select auth.uid()));
