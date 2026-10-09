-- ============================================================================
-- La segunda mano se retira (primer paso).
--
-- Era un filtro del catálogo pensado para la demostración de la hackathon. Este
-- paso deja de usarla en todo lo que la base guarda y lee; la columna
-- `products.condition` se borra en una migración aparte, cuando el código que
-- la escribía ya no está publicado.
--
-- 1. Las grillas de la portada que mostraban solo segunda mano o
--    reacondicionado se dan de baja: sin el filtro mostrarían todo el catálogo
--    bajo el título "Segunda mano". A las demás se les quita la propiedad.
-- 2. Lo mismo en las portadas que siembra cada plantilla.
-- 3. El tipo de bloque `product_grid` deja de aceptar `condition`.
-- 4. La vista de la IA deja de mostrar la columna.
--
-- Idempotente: lo que ya está limpio no vuelve a cambiar.
-- ============================================================================

-- 1. Las secciones de las tiendas.
update public.store_blocks
   set deleted_at = now(),
       updated_at = now()
 where deleted_at is null
   and block_type_key = 'product_grid'
   and props->>'condition' in ('segunda_mano', 'reacondicionado');

update public.store_blocks
   set props = props - 'condition',
       updated_at = now()
 where block_type_key = 'product_grid'
   and props ? 'condition';

-- 2. Las portadas que siembra cada plantilla.
update public.template_pages
   set blocks = (
     select coalesce(
              jsonb_agg(
                case
                  when bloque->>'block_type_key' = 'product_grid'
                    then jsonb_set(bloque, '{props}', (bloque->'props') - 'condition')
                  else bloque
                end
                order by orden
              ),
              '[]'::jsonb
            )
       from jsonb_array_elements(blocks) with ordinality as e(bloque, orden)
      where not (
        bloque->>'block_type_key' = 'product_grid'
        and bloque->'props'->>'condition' in ('segunda_mano', 'reacondicionado')
      )
   )
 where blocks::text like '%"condition"%';

-- 3. El tipo de bloque.
update public.block_types
   set props_schema = jsonb_set(
         props_schema,
         '{properties}',
         (props_schema->'properties') - 'condition'
       ),
       default_props = default_props - 'condition'
 where key = 'product_grid';

-- 4. La vista de la IA, sin la condición.
drop view if exists public.mis_productos;

create view public.mis_productos as
select p.id,
       p.name,
       p.category,
       p.price_cents,
       p.compare_at_price_cents,
       p.stock,
       p.is_active,
       p.created_at,
       p.low_stock_threshold,
       p.sku,
       p.is_featured
  from public.products p
 where p.store_id = public.my_store_id()
   and p.deleted_at is null;

comment on view public.mis_productos is
  'Catálogo de mi tienda. Montos en centavos.';

grant select on public.mis_productos to authenticated;
