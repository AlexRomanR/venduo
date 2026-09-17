-- ----------------------------------------------------------------------------
-- La compra de quien no tiene cuenta.
--
-- Todo el flujo —catálogo, carrito, pedido, pago— lo hace un comprador
-- anónimo. Y `orders` se lee solo `to authenticated`, así que sin esto nadie
-- puede ver el pedido que acaba de hacer ni adjuntar su comprobante.
--
-- No se abre la tabla con una política: eso expondría los pedidos de todas las
-- tiendas a cualquiera. Se abren dos funciones acotadas, y la llave es el
-- identificador del pedido, que es un uuid y no se adivina.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Cómo se le paga a la tienda
--
-- En Bolivia el pago corriente es una transferencia contra un QR del banco. Lo
-- sube el emprendedor como imagen; la plataforma no procesa el cobro, solo
-- muestra el QR y guarda el comprobante.
-- ----------------------------------------------------------------------------
alter table public.stores
  add column if not exists payment_qr_url text,
  add column if not exists payment_instructions text,
  -- Para coordinar la entrega desde la tienda pública. `orders.buyer_phone`
  -- sigue siendo el canal del comprador; este es el del comercio.
  add column if not exists whatsapp text;

-- ----------------------------------------------------------------------------
-- El pedido, para quien lo hizo
--
-- Devuelve solo lo que el comprador ya sabe —lo que acaba de pedir— más los
-- datos de pago de esa tienda. Nunca la comisión, el vendedor ni el neto del
-- comercio: eso es de la tienda y no del comprador.
-- ----------------------------------------------------------------------------
create or replace function public.pedido_publico(p_order_id uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id',            o.id,
    'numero',        o.order_number,
    'estado',        o.status,
    'total_cents',   o.total_cents,
    'comprador',     o.buyer_name,
    'telefono',      o.buyer_phone,
    'tiene_comprobante', o.payment_proof_url is not null,
    'creado',        o.created_at,
    'tienda', jsonb_build_object(
      'nombre',       s.name,
      'slug',         s.slug,
      'logo_url',     s.logo_url,
      'whatsapp',     s.whatsapp,
      'qr_url',       s.payment_qr_url,
      'instrucciones', s.payment_instructions
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre',      i.product_name,
        'cantidad',    i.quantity,
        'precio_cents', i.unit_price_cents,
        'total_cents', i.quantity * i.unit_price_cents
      ) order by i.product_name)
        from public.order_items i
       where i.order_id = o.id
    ), '[]'::jsonb)
  )
    from public.orders o
    join public.stores s on s.id = o.store_id
   where o.id = p_order_id
$$;

revoke all on function public.pedido_publico(uuid) from public;
grant execute on function public.pedido_publico(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- El comprobante
--
-- Solo mientras el pedido siga pendiente. Después de que el comercio lo marcó
-- pagado, cambiar el comprobante sería reescribir la prueba de una venta ya
-- cerrada.
-- ----------------------------------------------------------------------------
create or replace function public.adjuntar_comprobante(
  p_order_id uuid,
  p_url      text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  update public.orders
     set payment_proof_url = p_url,
         updated_at = now()
   where id = p_order_id
     and status = 'pendiente'
     and payment_proof_url is null;

  get diagnostics v_ok = row_count;
  return v_ok;
end
$$;

revoke all on function public.adjuntar_comprobante(uuid, text) from public;
grant execute on function public.adjuntar_comprobante(uuid, text) to anon, authenticated;

comment on function public.pedido_publico is
  'El pedido y los datos de pago de su tienda, para el comprador sin cuenta.';
comment on function public.adjuntar_comprobante is
  'Adjunta el comprobante de pago mientras el pedido sigue pendiente.';
