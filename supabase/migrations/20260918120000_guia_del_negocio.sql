-- ============================================================================
-- Venduo — la guía de primeros pasos del negocio
--
-- La primera vez que un negocio entra al panel ve una guía en pasos: cargar lo
-- que vende, agruparlo, y cómo sigue el circuito sin que tenga que hacer nada.
-- Al terminarla va a su panel con estadísticas, y no la vuelve a ver sola.
--
-- Se guarda cuándo la terminó y no un booleano: además de decir si la vio,
-- dice cuándo, y eso sirve para medir cuánto tarda un negocio en empezar.
-- ============================================================================

alter table public.stores
  add column if not exists onboarded_at timestamptz;

comment on column public.stores.onboarded_at is
  'Cuando el negocio termino la guia de primeros pasos. Nulo: la ve al entrar al panel.';

-- Los negocios que ya tienen catálogo no necesitan la guía: ya empezaron.
update public.stores s
   set onboarded_at = now()
 where s.onboarded_at is null
   and s.deleted_at is null
   and exists (
     select 1 from public.products p
      where p.store_id = s.id and p.deleted_at is null
   );
