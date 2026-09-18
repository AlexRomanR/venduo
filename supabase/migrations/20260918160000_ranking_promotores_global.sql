-- ============================================================================
-- Venduo — Ranking global de promotores (jóvenes líderes de ventas)
--
-- Expone de forma segura y agregada a los promotores con mayor cantidad de
-- ventas confirmadas y volumen en la plataforma.
-- Security definer para permitir la agregación sin exponer órdenes individuales,
-- carritos ni datos privados de clientes ajenos.
-- ============================================================================

create or replace function public.ranking_promotores_global(p_limite int default 50)
returns table (
  user_id        uuid,
  display_name   text,
  slug           text,
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
    sp.user_id,
    sp.display_name,
    sp.slug,
    sp.city,
    sp.bio,
    p.avatar_url,
    count(c.id) filter (where c.status in ('confirmada', 'pagada')) as ventas,
    coalesce(sum(c.base_amount_cents) filter (where c.status in ('confirmada', 'pagada')), 0) as volumen_cents,
    count(distinct c.store_name) filter (where c.status in ('confirmada', 'pagada')) as tiendas,
    min(c.created_at) filter (where c.status in ('confirmada', 'pagada')) as desde
  from public.seller_profiles sp
  left join public.profiles p on p.id = sp.user_id
  left join public.commissions c on c.seller_user_id = sp.user_id
  where sp.deleted_at is null
  group by sp.user_id, sp.display_name, sp.slug, sp.city, sp.bio, p.avatar_url
  order by ventas desc, volumen_cents desc
  limit coalesce(p_limite, 50);
$$;

grant execute on function public.ranking_promotores_global(int) to authenticated, anon;
