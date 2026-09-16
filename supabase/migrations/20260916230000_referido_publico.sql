-- ----------------------------------------------------------------------------
-- Quién trae la visita, para quien no tiene cuenta.
--
-- La tienda pública muestra "te trajo Ana" cuando el enlace trae un código de
-- referido: da confianza y deja claro que ese vendedor cobra por la venta.
--
-- Pero `store_sellers` solo se lee `to authenticated`, y quien compra es
-- anónimo. Sin esto el cartel solo lo veía el dueño de la tienda mientras
-- probaba —justo quien no lo necesita— y nunca el comprador.
--
-- `security definer` y acotada a lo que ya es público: confirma que un código
-- pertenece a un vínculo **activo** de **esa** tienda y devuelve el nombre que
-- el vendedor eligió mostrar en su perfil público. Un código inválido devuelve
-- cero filas, así que no sirve para averiguar códigos por descarte.
-- ----------------------------------------------------------------------------
create or replace function public.referido_publico(
  p_store_id uuid,
  p_codigo   text
)
returns table (codigo text, nombre text)
language sql
security definer
stable
set search_path = public
as $$
  select ss.referral_code,
         coalesce(sp.display_name, 'un vendedor')
    from public.store_sellers ss
    left join public.seller_profiles sp
           on sp.user_id = ss.user_id
          and sp.deleted_at is null
   where ss.store_id = p_store_id
     and ss.referral_code = upper(btrim(p_codigo))
     and ss.status = 'activo'
     and ss.deleted_at is null
     -- Solo si la tienda se sirve al público: en una tienda despublicada no
     -- hay nada que mostrarle a nadie.
     and public.store_is_live(ss.store_id)
   limit 1
$$;

revoke all on function public.referido_publico(uuid, text) from public;
grant execute on function public.referido_publico(uuid, text) to anon, authenticated;

comment on function public.referido_publico is
  'Nombre del vendedor detrás de un código de referido, para la tienda pública.';
