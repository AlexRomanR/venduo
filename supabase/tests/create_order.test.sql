-- create_order: el pedido que arma quien compra, sin cuenta.
--
-- El precio sale siempre del catálogo, nunca del carrito; el stock no se
-- toca hasta que la tienda lo marca pagado.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- Dos tiendas, creadas como las crea la aplicación.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.test', 'authenticated', 'authenticated');

set local role authenticated;
do $$ begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
  perform public.create_store('Tienda A', null, 'calle', '70000001');
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
  perform public.create_store('Tienda B', null, 'calle', '70000002');
end $$;
reset role;

create temporary table tiendas on commit drop as
select
  (select id from public.stores where owner_id = '00000000-0000-0000-0000-00000000000a') as a,
  (select id from public.stores where owner_id = '00000000-0000-0000-0000-00000000000b') as b;
grant select on tiendas to anon;

insert into public.products (id, store_id, name, price_cents, stock, is_active, deleted_at)
select p.id::uuid, case when p.de_b then t.b else t.a end, p.nombre, p.precio, p.stock, p.activo, p.borrado
  from tiendas t,
  (values
    ('10000000-0000-0000-0000-000000000001', false, 'Gorra',     8500, 5, true,  null::timestamptz),
    ('10000000-0000-0000-0000-000000000002', false, 'Oculta',    8500, 5, false, null),
    ('10000000-0000-0000-0000-000000000003', false, 'Borrada',   8500, 5, true,  now()),
    ('10000000-0000-0000-0000-000000000004', true,  'De B',      8500, 5, true,  null),
    ('10000000-0000-0000-0000-000000000005', false, 'Última',    8500, 1, true,  null),
    ('10000000-0000-0000-0000-000000000006', false, 'Buzo',     10000, 0, true,  null)
  ) as p(id, de_b, nombre, precio, stock, activo, borrado);

insert into public.product_variants (id, product_id, store_id, valores, nombre, price_cents, stock)
select '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', a,
       '{"Talla":"L"}', 'L', 12000, 4
  from tiendas;

-- Desde acá, quien compra: sin cuenta.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is(
  (public.create_order(
    (select a from tiendas),
    '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":2,"price_cents":1,"unit_price_cents":1}]'
  )->>'total_cents')::int,
  17000,
  'el total sale del precio del catálogo, no del que manda el carrito'
);

select is(
  (public.create_order(
    (select a from tiendas),
    '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":0}]'
  )->'items'->0->>'cantidad')::int,
  1,
  'una cantidad menor a 1 se vuelve 1'
);

select is(
  (public.create_order(
    (select a from tiendas),
    '[{"product_id":"10000000-0000-0000-0000-000000000006","variant_id":"20000000-0000-0000-0000-000000000001","quantity":1}]'
  )->>'total_cents')::int,
  12000,
  'una variante con precio propio cobra el suyo'
);

select is(
  public.create_order(
    (select a from tiendas),
    '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]'
  )->>'whatsapp',
  '70000001',
  'devuelve el WhatsApp de la tienda para armar el mensaje'
);

select throws_like(
  $$ select public.create_order((select a from tiendas), '[{"product_id":"10000000-0000-0000-0000-000000000002","quantity":1}]') $$,
  'Producto no disponible%',
  'un producto oculto no se pide'
);

select throws_like(
  $$ select public.create_order((select a from tiendas), '[{"product_id":"10000000-0000-0000-0000-000000000003","quantity":1}]') $$,
  'Producto no disponible%',
  'un producto borrado no se pide'
);

select throws_like(
  $$ select public.create_order((select a from tiendas), '[{"product_id":"10000000-0000-0000-0000-000000000004","quantity":1}]') $$,
  'Producto no disponible%',
  'un producto de otra tienda no se pide'
);

select throws_like(
  $$ select public.create_order((select a from tiendas), '[{"product_id":"10000000-0000-0000-0000-000000000005","quantity":2}]') $$,
  'Stock insuficiente de Última: quedan 1',
  'no se pide más de lo que hay'
);

select throws_like(
  $$ select public.create_order((select a from tiendas), '[{"product_id":"10000000-0000-0000-0000-000000000006","quantity":1}]') $$,
  'Elige una opción de Buzo',
  'un producto con variantes exige elegir una'
);

select throws_like(
  $$ select public.create_order((select a from tiendas), '[]') $$,
  'El pedido no tiene productos',
  'un pedido vacío no se crea'
);

select throws_like(
  $$ select public.create_order(
       (select a from tiendas),
       (select jsonb_agg(jsonb_build_object('product_id', '10000000-0000-0000-0000-000000000001', 'quantity', 1))
          from generate_series(1, 31))
     ) $$,
  'Demasiados productos en un solo pedido',
  'más de 30 líneas no se aceptan'
);

select throws_ok(
  $$ insert into public.orders (store_id, order_number, subtotal_cents, total_cents)
     select a, 999, 1, 1 from tiendas $$,
  '42501',
  null,
  'quien compra no puede insertar un pedido directo'
);

reset role;

select is(
  (select stock from public.products where id = '10000000-0000-0000-0000-000000000001'),
  5,
  'crear el pedido no toca el stock'
);

select is(
  (select array_agg(distinct status::text) from public.orders where store_id = (select a from tiendas)),
  array['pendiente'],
  'los pedidos nacen pendientes'
);

select is(
  (select array_agg(order_number order by order_number) from public.orders where store_id = (select a from tiendas)),
  array[1, 2, 3, 4]::bigint[],
  'el número del pedido es correlativo por tienda'
);

update public.stores set is_published = false where id = (select b from tiendas);
update public.products set store_id = (select b from tiendas) where id = '10000000-0000-0000-0000-000000000005';
update public.stores set whatsapp = null where id = (select a from tiendas);

set local role anon;

select throws_like(
  $$ select public.create_order((select b from tiendas), '[{"product_id":"10000000-0000-0000-0000-000000000004","quantity":1}]') $$,
  'La tienda no está disponible',
  'una tienda que no se sirve no recibe pedidos'
);

select throws_like(
  $$ select public.create_order((select a from tiendas), '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') $$,
  'La tienda no tiene WhatsApp',
  'una tienda sin WhatsApp no recibe pedidos'
);

reset role;

select is(
  (select count(*)::int from public.orders where store_id = (select b from tiendas)),
  0,
  'el pedido rechazado no deja nada a medias'
);

select * from finish();
rollback;
