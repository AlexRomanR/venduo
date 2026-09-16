-- ============================================================================
-- Venduo — 0018 el historial laboral, leído desde afuera
--
-- El perfil del vendedor es público y estable: es lo que adjunta a una
-- postulación y lo que abre quien recibe su currículum, sin cuenta.
--
-- Pero las comisiones no se pueden abrir a cualquiera: la política dice
-- `seller_user_id = auth.uid() or store_id = my_store_id()`, y está bien que
-- así sea — son montos de una persona y de un comercio. Un visitante anónimo
-- no debe poder listarlas.
--
-- La salida no es aflojar la política sino exponer **solo el agregado**, que
-- es lo que el historial necesita: cuánto vendió, para cuántas tiendas, desde
-- cuándo. Sin montos por pedido ni quién compró.
-- ============================================================================

create or replace function public.seller_public_stats(p_slug text)
returns table (
  display_name   text,
  city           text,
  bio            text,
  avatar_url     text,
  ventas         bigint,
  volumen_cents  bigint,
  tiendas        bigint,
  desde          timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sp.display_name,
    sp.city,
    sp.bio,
    p.avatar_url,
    -- Solo lo confirmado cuenta como antecedente: una comisión pendiente
    -- todavía puede anularse, y una anulada nunca fue una venta.
    count(c.id) filter (where c.status in ('confirmada', 'pagada')),
    coalesce(sum(c.base_amount_cents) filter (where c.status in ('confirmada', 'pagada')), 0),
    count(distinct c.store_name) filter (where c.status in ('confirmada', 'pagada')),
    min(c.created_at) filter (where c.status in ('confirmada', 'pagada'))
  from public.seller_profiles sp
  left join public.profiles p on p.id = sp.user_id
  left join public.commissions c on c.seller_user_id = sp.user_id
  where sp.slug = p_slug
    and sp.deleted_at is null
  group by sp.display_name, sp.city, sp.bio, p.avatar_url
$$;

-- ----------------------------------------------------------------------------
-- Las tiendas donde trabajó, por nombre.
--
-- Sale de `commissions.store_name`, que es una copia y no un join: por eso el
-- historial sobrevive a la purga de la tienda. Esa copia es justamente lo que
-- permite que esta consulta siga devolviendo algo cuando el comercio ya no
-- existe en la plataforma.
-- ----------------------------------------------------------------------------
create or replace function public.seller_public_stores(p_slug text)
returns table (store_name text, ventas bigint, desde timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.store_name, count(*), min(c.created_at)
  from public.seller_profiles sp
  join public.commissions c on c.seller_user_id = sp.user_id
  where sp.slug = p_slug
    and sp.deleted_at is null
    and c.status in ('confirmada', 'pagada')
  group by c.store_name
  order by count(*) desc
  limit 24
$$;

-- Públicas a propósito: el historial se verifica sin cuenta.
grant execute on function public.seller_public_stats(text) to anon, authenticated;
grant execute on function public.seller_public_stores(text) to anon, authenticated;
