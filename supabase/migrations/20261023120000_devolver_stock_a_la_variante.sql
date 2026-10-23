-- Cancelar un pedido pagado devuelve el stock a la variante viva con la misma
-- combinación.
--
-- Antes volvía solo a la variante del pedido si seguía viva. Si la tienda la
-- quitaba y la volvía a crear —la talla L—, la nueva nace con otro id y el
-- stock no volvía a ningún lado. Y si el pedido tenía dos líneas de la misma
-- variante o del mismo producto, volvía la cantidad de una sola.
--
-- Fijado en supabase/tests/estado_y_stock.test.sql.

create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item  record;
  v_stock int;
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'cancelado' then
    raise exception 'Un pedido cancelado no cambia de estado';
  end if;

  if old.status = 'pagado' and new.status = 'pendiente' then
    raise exception 'Un pedido pagado no vuelve a pendiente';
  end if;

  if new.status = 'pagado' then
    perform set_config('venduo.por_venta', '1', true);

    for v_item in
      select oi.product_id, oi.product_name, oi.quantity, oi.variant_id, oi.variant_name
        from public.order_items oi
       where oi.order_id = new.id
         and oi.product_id is not null
    loop
      if v_item.variant_id is not null then
        update public.product_variants
           set stock = stock - v_item.quantity,
               updated_at = now()
         where id = v_item.variant_id
           and stock >= v_item.quantity;

        if not found then
          select stock into v_stock
            from public.product_variants
           where id = v_item.variant_id;
          raise exception 'Stock insuficiente de %: quedan %',
            v_item.product_name || ' · ' || coalesce(v_item.variant_name, ''),
            coalesce(v_stock, 0);
        end if;
      else
        update public.products
           set stock = stock - v_item.quantity,
               updated_at = now()
         where id = v_item.product_id
           and stock >= v_item.quantity;

        if not found then
          select stock into v_stock
            from public.products
           where id = v_item.product_id;
          raise exception 'Stock insuficiente de %: quedan %',
            v_item.product_name, coalesce(v_stock, 0);
        end if;
      end if;
    end loop;

    update public.order_items oi
       set unit_cost_cents = pc.cost_cents
      from public.product_costs pc
     where oi.order_id = new.id
       and pc.product_id = oi.product_id
       and oi.unit_cost_cents is null;

    perform set_config('venduo.por_venta', '', true);
    new.paid_at := coalesce(new.paid_at, now());
  end if;

  if new.status = 'cancelado' and old.status = 'pagado' then
    -- Vuelve a la variante viva con la misma combinación: la suya o, si se
    -- borró y se volvió a crear, la nueva. Si ya no hay ninguna, no se suma a
    -- nada: esa opción ya no se vende. Se suma por destino porque un
    -- `update … from` con dos líneas de la misma variante devolvía una sola.
    update public.product_variants v
       set stock = v.stock + devuelto.cantidad,
           updated_at = now()
      from (
        select viva.id, sum(oi.quantity) as cantidad
          from public.order_items oi
          join public.product_variants original on original.id = oi.variant_id
          join public.product_variants viva
            on viva.product_id = original.product_id
           and viva.valores = original.valores
           and viva.deleted_at is null
         where oi.order_id = new.id
         group by viva.id
      ) devuelto
     where v.id = devuelto.id;

    -- Un producto sin variantes vivas lleva su propio stock: ahí vuelve todo.
    update public.products p
       set stock = p.stock + devuelto.cantidad,
           updated_at = now()
      from (
        select oi.product_id, sum(oi.quantity) as cantidad
          from public.order_items oi
         where oi.order_id = new.id
           and oi.product_id is not null
         group by oi.product_id
      ) devuelto
     where p.id = devuelto.product_id
       and not exists (
         select 1 from public.product_variants v
          where v.product_id = p.id and v.deleted_at is null
       );
  end if;

  return new;
end $$;
