-- Una tienda no ve ni toca lo de otra. Cada política es una comparación con
-- my_store_id(), y una cuenta dada de baja ya no tiene tienda.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

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
grant select on tiendas to anon, authenticated;

insert into public.products (id, store_id, name, price_cents, stock, is_active)
select p.id::uuid, case when p.de_b then t.b else t.a end, p.nombre, 8500, 5, p.activo
  from tiendas t,
  (values
    ('10000000-0000-0000-0000-000000000001', false, 'Gorra de A', true),
    ('10000000-0000-0000-0000-000000000004', true,  'Gorra de B', true),
    ('10000000-0000-0000-0000-000000000005', true,  'Oculta de B', false)
  ) as p(id, de_b, nombre, activo);

insert into public.product_costs (product_id, store_id, cost_cents)
select '10000000-0000-0000-0000-000000000004', b, 4000 from tiendas;

select public.create_order(a, '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') from tiendas;
select public.create_order(b, '[{"product_id":"10000000-0000-0000-0000-000000000004","quantity":1}]') from tiendas;

-- Una talla de un producto publicado y otra de uno oculto, las dos de B.
insert into public.product_variants (product_id, store_id, valores, nombre, stock)
select v.producto::uuid, b, '{"Talla":"L"}', 'L', 3
  from tiendas, (values
    ('10000000-0000-0000-0000-000000000004'),
    ('10000000-0000-0000-0000-000000000005')
  ) as v(producto);

-- Desde acá, la dueña de la tienda A.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is((select count(*)::int from public.orders), 1, 've solo sus pedidos');
select is((select count(*)::int from public.orders where store_id = (select b from tiendas)), 0, 'no ve los pedidos de B');
select is((select count(*)::int from public.order_items where store_id = (select b from tiendas)), 0, 'ni sus líneas');
select is((select count(*)::int from public.product_costs), 0, 'no ve lo que le cuestan los productos a B');

select is(
  (select array_agg(name order by name) from public.products where store_id = (select b from tiendas)),
  array['Gorra de B'],
  'de B ve lo que B publica, como cualquiera, y no lo que oculta'
);

update public.orders set status = 'cancelado' where store_id = (select b from tiendas);
update public.products set price_cents = 1 where id = '10000000-0000-0000-0000-000000000004';

select throws_ok(
  $$ insert into public.products (store_id, name, price_cents) select b, 'Intruso', 1 from tiendas $$,
  '42501',
  null,
  'no crea productos en la tienda de B'
);

select throws_ok(
  $$ insert into public.product_costs (product_id, store_id, cost_cents)
     select '10000000-0000-0000-0000-000000000004', b, 1 from tiendas $$,
  '42501',
  null,
  'no carga costos en la tienda de B'
);

reset role;

select is(
  (select status::text from public.orders where store_id = (select b from tiendas)),
  'pendiente',
  'no cambia el estado de un pedido de B'
);
select is(
  (select price_cents from public.products where id = '10000000-0000-0000-0000-000000000004'),
  8500,
  'no cambia el precio de un producto de B'
);

-- Quien compra, sin cuenta.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is((select count(*)::int from public.orders), 0, 'quien compra no ve ningún pedido');
select is(
  (select count(*)::int from public.products where id = '10000000-0000-0000-0000-000000000005'),
  0,
  'ni un producto oculto'
);
select is(
  (select count(*)::int from public.product_variants where product_id = '10000000-0000-0000-0000-000000000005'),
  0,
  'ni las tallas de un producto oculto'
);
select is(
  (select count(*)::int from public.product_variants where product_id = '10000000-0000-0000-0000-000000000004'),
  1,
  'pero sí las de uno publicado'
);

reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is(
  (select count(*)::int from public.product_variants where product_id = '10000000-0000-0000-0000-000000000005'),
  1,
  'la dueña sí ve las tallas de su producto oculto'
);
reset role;

-- La cuenta A se da de baja.
update public.stores set closed_at = now() where id = (select a from tiendas);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is(public.my_store_id(), null, 'una cuenta dada de baja ya no tiene tienda');
select is((select count(*)::int from public.orders), 0, 'ni ve sus pedidos');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_like(
  $$ select public.create_order(a, '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') from tiendas $$,
  'La tienda no está disponible',
  'ni recibe pedidos'
);

reset role;

select * from finish();
rollback;
