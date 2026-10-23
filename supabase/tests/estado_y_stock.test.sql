-- handle_order_status_change: el stock baja al marcar pagado y vuelve al
-- cancelar un pagado. La aplicación nunca lo toca; lo mueve este disparador.
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.test', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ begin perform public.create_store('Tienda A', null, 'calle', '70000001'); end $$;
reset role;

create temporary table tienda on commit drop as
select id from public.stores where owner_id = '00000000-0000-0000-0000-00000000000a';
grant select on tienda to anon, authenticated;

insert into public.products (id, store_id, name, price_cents, stock)
select '10000000-0000-0000-0000-000000000001'::uuid, id, 'Gorra', 8500, 5 from tienda
union all
select '10000000-0000-0000-0000-000000000006'::uuid, id, 'Buzo', 10000, 0 from tienda;

insert into public.product_costs (product_id, store_id, cost_cents)
select '10000000-0000-0000-0000-000000000001', id, 4000 from tienda;

update public.products
   set opciones = '[{"nombre":"Talla","valores":["L","M"]}]'
 where id = '10000000-0000-0000-0000-000000000006';

insert into public.product_variants (id, product_id, store_id, valores, nombre, stock)
select v.id::uuid, '10000000-0000-0000-0000-000000000006', t.id, v.valores::jsonb, v.nombre, v.stock
  from tienda t,
  (values
    ('20000000-0000-0000-0000-000000000001', '{"Talla":"L"}', 'L', 4),
    ('20000000-0000-0000-0000-000000000002', '{"Talla":"M"}', 'M', 2)
  ) as v(id, valores, nombre, stock);

-- Los pedidos, como los manda quien compra. El número dice cuál es cuál.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$
declare
  v_tienda uuid := (select id from tienda);
  v_gorra  text := '10000000-0000-0000-0000-000000000001';
  v_buzo   text := '10000000-0000-0000-0000-000000000006';
  v_l      text := '20000000-0000-0000-0000-000000000001';
  v_m      text := '20000000-0000-0000-0000-000000000002';
begin
  -- 1: dos gorras.
  perform public.create_order(v_tienda, jsonb_build_array(jsonb_build_object('product_id', v_gorra, 'quantity', 2)));
  -- 2: un buzo L.
  perform public.create_order(v_tienda, jsonb_build_array(jsonb_build_object('product_id', v_buzo, 'variant_id', v_l, 'quantity', 1)));
  -- 3: cuatro gorras.
  perform public.create_order(v_tienda, jsonb_build_array(jsonb_build_object('product_id', v_gorra, 'quantity', 4)));
  -- 4: dos líneas de buzo L.
  perform public.create_order(v_tienda, jsonb_build_array(
    jsonb_build_object('product_id', v_buzo, 'variant_id', v_l, 'quantity', 1),
    jsonb_build_object('product_id', v_buzo, 'variant_id', v_l, 'quantity', 1)));
  -- 5: un buzo M.
  perform public.create_order(v_tienda, jsonb_build_array(jsonb_build_object('product_id', v_buzo, 'variant_id', v_m, 'quantity', 1)));
  -- 6: dos líneas de gorra.
  perform public.create_order(v_tienda, jsonb_build_array(
    jsonb_build_object('product_id', v_gorra, 'quantity', 1),
    jsonb_build_object('product_id', v_gorra, 'quantity', 1)));
end $$;
reset role;

create temporary table pedido on commit drop as
select order_number as numero, id from public.orders where store_id = (select id from tienda);
grant select on pedido to authenticated;

-- Desde acá, la tienda maneja sus pedidos.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

update public.orders set status = 'pagado' where id = (select id from pedido where numero = 1);

reset role;
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000001'), 3,
  'marcar pagado baja el stock');
select isnt((select paid_at from public.orders where id = (select id from pedido where numero = 1)), null,
  'marcar pagado anota cuándo');
select is((select unit_cost_cents from public.order_items where order_id = (select id from pedido where numero = 1)), 4000,
  'marcar pagado copia el costo del producto');
set local role authenticated;

select throws_like(
  $$ update public.orders set status = 'pagado' where id = (select id from pedido where numero = 3) $$,
  'Stock insuficiente de Gorra: quedan 3',
  'no se cobra más de lo que hay'
);

update public.orders set status = 'cancelado' where id = (select id from pedido where numero = 3);
update public.orders set status = 'cancelado' where id = (select id from pedido where numero = 1);

reset role;
select is((select status::text from public.orders where id = (select id from pedido where numero = 3)), 'cancelado',
  'el cobro rechazado no dejó el pedido pagado');
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000001'), 5,
  'cancelar un pagado devuelve el stock; cancelar un pendiente no suma nada');
set local role authenticated;

select throws_like(
  $$ update public.orders set status = 'pagado' where id = (select id from pedido where numero = 1) $$,
  'Un pedido cancelado no cambia de estado',
  'un cancelado no vuelve'
);

update public.orders set status = 'pagado' where id = (select id from pedido where numero = 6);
reset role;
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000001'), 3,
  'dos líneas del mismo producto bajan las dos');
set local role authenticated;
update public.orders set status = 'cancelado' where id = (select id from pedido where numero = 6);
reset role;
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000001'), 5,
  'y al cancelar vuelven las dos');
set local role authenticated;

-- Con variantes.
update public.orders set status = 'pagado' where id = (select id from pedido where numero = 4);
reset role;
select is((select stock from public.product_variants where id = '20000000-0000-0000-0000-000000000001'), 2,
  'marcar pagado baja el stock de la variante');
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000006'), 4,
  'el stock del producto es la suma de sus variantes');
set local role authenticated;

select throws_like(
  $$ update public.orders set status = 'pendiente' where id = (select id from pedido where numero = 4) $$,
  'Un pedido pagado no vuelve a pendiente',
  'un pagado no vuelve a pendiente'
);

update public.orders set status = 'cancelado' where id = (select id from pedido where numero = 4);
reset role;
select is((select stock from public.product_variants where id = '20000000-0000-0000-0000-000000000001'), 4,
  'dos líneas de la misma variante vuelven las dos');
set local role authenticated;

-- La tienda quita la L con un pedido pagado, y la vuelve a crear.
update public.orders set status = 'pagado' where id = (select id from pedido where numero = 2);
select public.guardar_variantes(
  '10000000-0000-0000-0000-000000000006',
  '[{"nombre":"Talla","valores":["M"]}]',
  '[{"valores":{"Talla":"M"},"stock":2}]'
);
select public.guardar_variantes(
  '10000000-0000-0000-0000-000000000006',
  '[{"nombre":"Talla","valores":["L","M"]}]',
  '[{"valores":{"Talla":"L"},"stock":0},{"valores":{"Talla":"M"},"stock":2}]'
);

reset role;
select isnt(
  (select id from public.product_variants
    where product_id = '10000000-0000-0000-0000-000000000006' and valores = '{"Talla":"L"}' and deleted_at is null),
  '20000000-0000-0000-0000-000000000001'::uuid,
  'la L vuelta a crear es otra variante'
);
set local role authenticated;

update public.orders set status = 'cancelado' where id = (select id from pedido where numero = 2);

reset role;
select is(
  (select stock from public.product_variants
    where product_id = '10000000-0000-0000-0000-000000000006' and valores = '{"Talla":"L"}' and deleted_at is null),
  1,
  'cancelar devuelve la unidad a la L nueva'
);
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000006'), 3,
  'y el producto la suma');
set local role authenticated;

-- La tienda quita la M con un pedido pagado, y no la vuelve a crear.
update public.orders set status = 'pagado' where id = (select id from pedido where numero = 5);
select public.guardar_variantes(
  '10000000-0000-0000-0000-000000000006',
  '[{"nombre":"Talla","valores":["L"]}]',
  '[{"valores":{"Talla":"L"},"stock":1}]'
);
update public.orders set status = 'cancelado' where id = (select id from pedido where numero = 5);

reset role;
select is((select status::text from public.orders where id = (select id from pedido where numero = 5)), 'cancelado',
  'el pedido de una opción que ya no existe se cancela igual');
select is(
  (select stock from public.product_variants
    where product_id = '10000000-0000-0000-0000-000000000006' and deleted_at is null),
  1,
  'su unidad no se suma a otra opción'
);
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000006'), 1,
  'ni al producto, que sigue siendo la suma de sus variantes');

select * from finish();
rollback;
