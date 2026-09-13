-- ============================================================================
-- Venduo — 0013 acentos en el slug del vendedor
--
-- La versión anterior reemplazaba todo lo que no fuera a-z0-9 por un guion, y
-- "Ana María" terminaba como "ana-mar-a". Ese slug es la URL pública del
-- historial laboral del vendedor: es lo que va en un currículum, así que un
-- nombre partido al medio se lee como un error del sistema.
--
-- Se translitera antes de limpiar. Postgres no trae `unaccent` habilitado por
-- defecto en Supabase, así que se hace con `translate`, que alcanza de sobra
-- para nombres en español.
-- ============================================================================

create or replace function public.ensure_seller_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.seller_profiles (user_id, display_name, slug)
  select
    p_user_id,
    coalesce(nullif(btrim(p.full_name), ''), 'Vendedor'),
    trim(
      both '-' from lower(
        regexp_replace(
          translate(
            coalesce(nullif(btrim(p.full_name), ''), 'vendedor'),
            'áéíóúÁÉÍÓÚñÑüÜàèìòùâêîôûäëïöÿçÇ',
            'aeiouAEIOUnNuUaeiouaeiouaeiyccC'
          ),
          '[^a-zA-Z0-9]+', '-', 'g'
        )
      )
    ) || '-' || substr(replace(p_user_id::text, '-', ''), 1, 6)
  from public.profiles p
  where p.id = p_user_id
  on conflict (user_id) do nothing;
end $$;
