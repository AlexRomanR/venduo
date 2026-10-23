-- registrar_venta: la venta que la tienda anota a mano, fuera de la tienda.
--
-- Acepta el precio que se cobró de verdad, nace pagada y el stock lo baja el
-- disparador de siempre: si no alcanza, no queda nada de la venta.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'c@prueba.test', 'authenticated', 'authenticated');

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

insert into public.products (id, store_id, name, price_cents, stock, is_active)
select p.id::uuid, case when p.de_b then t.b else t.a end, p.nombre, p.precio, p.stock, p.activo
  from tiendas t,
  (values
    ('10000000-0000-0000-0000-000000000001', false, 'Gorra',  8500, 5, true),
    ('10000000-0000-0000-0000-000000000002', false, 'Oculta', 3000, 5, false),
    ('10000000-0000-0000-0000-000000000004', true,  'De B',   8500, 5, true),
    ('10000000-0000-0000-0000-000000000006', false, 'Buzo',  10000, 0, true)
  ) as p(id, de_b, nombre, precio, stock, activo);

insert into public.product_variants (product_id, store_id, valores, nombre, stock)
select '10000000-0000-0000-0000-000000000006', a, '{"Talla":"L"}', 'L', 4 from tiendas;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is(
  (public.registrar_venta(
    '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":2,"precio_cents":7000}]'
  )->>'total_cents')::int,
  14000,
  'cobra el precio que se escribió, con la rebaja'
);

select is(
  (public.registrar_venta(
    '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]'
  )->>'total_cents')::int,
  8500,
  'sin precio escrito, el de lista'
);

select lives_ok(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000002","quantity":1}]') $$,
  'un producto oculto en la tienda también se vende en persona'
);

select throws_like(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":10}]') $$,
  'Stock insuficiente de Gorra: quedan 2',
  'no se vende más de lo que hay'
);

select throws_like(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1,"precio_cents":-1}]') $$,
  'Precio no válido',
  'un precio negativo no se acepta'
);

select throws_like(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":0}]') $$,
  'Cantidad no válida',
  'una cantidad de cero no se acepta'
);

select throws_like(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000004","quantity":1}]') $$,
  'Producto no disponible%',
  'no se vende un producto de otra tienda'
);

select throws_like(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000006","quantity":1}]') $$,
  'Elige una opción de Buzo',
  'un producto con variantes exige elegir una'
);

reset role;

select is(
  (select stock from public.products where id = '10000000-0000-0000-0000-000000000001'),
  2,
  'la venta baja el stock en el momento'
);

select is(
  (select array_agg(distinct status::text || ' ' || origen::text) from public.orders where store_id = (select a from tiendas)),
  array['pagado directa'],
  'nace pagada y marcada como directa'
);

select is(
  (select count(*)::int from public.orders where store_id = (select a from tiendas)),
  3,
  'una venta rechazada no deja un pedido a medias'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select throws_like(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') $$,
  'No tienes una tienda',
  'sin tienda no se registra nada'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') $$,
  '42501',
  null,
  'quien no inició sesión no puede llamarla'
);

reset role;

select is(
  (select stock from public.products where id = '10000000-0000-0000-0000-000000000001'),
  2,
  'los intentos rechazados no tocaron el stock'
);

select * from finish();
rollback;
