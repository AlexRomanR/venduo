-- Combos que se compran: un combo del catálogo como una línea del pedido.
--
-- El precio sale del catálogo guardado, nunca del carrito. Un combo con un
-- producto que ya no se vende, agotado o de otra tienda no se puede pedir. Al
-- marcar pagado baja el stock de cada producto del combo, y vuelve si se
-- cancela. Brief: docs/briefs/2026-11-20-combos-que-se-compran.md.
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

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

-- Polera 5, Short con tallas (32: 2, 34: 0), Gorra 1, una oculta y una de B.
insert into public.products (id, store_id, name, price_cents, stock, is_active)
select p.id::uuid, case when p.de_b then t.b else t.a end, p.nombre, p.precio, p.stock, p.activo
  from tiendas t,
  (values
    ('10000000-0000-0000-0000-000000000001', false, 'Polera', 12000, 5, true),
    ('10000000-0000-0000-0000-000000000002', false, 'Short',  15000, 0, true),
    ('10000000-0000-0000-0000-000000000003', false, 'Gorra',   6000, 1, true),
    ('10000000-0000-0000-0000-000000000004', false, 'Oculta',  5000, 5, false),
    ('10000000-0000-0000-0000-000000000005', true,  'De B',    5000, 5, true)
  ) as p(id, de_b, nombre, precio, stock, activo);

insert into public.product_variants (id, product_id, store_id, valores, nombre, stock)
select v.id::uuid, '10000000-0000-0000-0000-000000000002', t.a, v.valores::jsonb, v.nombre, v.stock
  from tiendas t,
  (values
    ('20000000-0000-0000-0000-000000000032', '{"Talla":"32"}', '32', 2),
    ('20000000-0000-0000-0000-000000000034', '{"Talla":"34"}', '34', 0)
  ) as v(id, valores, nombre, stock);

insert into public.product_costs (product_id, cost_cents) values
  ('10000000-0000-0000-0000-000000000001', 5000),
  ('10000000-0000-0000-0000-000000000002', 7000),
  ('10000000-0000-0000-0000-000000000003', 2000);

-- Los catálogos. Un combo se ofrece solo si una hoja del catálogo lo muestra.
insert into public.catalogs (store_id, name, template_key, share_token, config, deleted_at)
select c.de, c.nombre, 'minimal', c.token, c.config::jsonb, c.borrado
  from tiendas t,
  lateral (values
    (t.a, 'Verano', 'tokA', null::timestamptz, $j${
      "packs": [
        {"id": "verano", "nombre": "Combo Verano", "productos": ["10000000-0000-0000-0000-000000000001", "10000000-0000-0000-0000-000000000002", "10000000-0000-0000-0000-000000000003"], "precioCents": 25000, "nota": ""},
        {"id": "oculto", "nombre": "Con oculta", "productos": ["10000000-0000-0000-0000-000000000001", "10000000-0000-0000-0000-000000000004"], "precioCents": 10000, "nota": ""},
        {"id": "gratis", "nombre": "Sin precio", "productos": ["10000000-0000-0000-0000-000000000001", "10000000-0000-0000-0000-000000000003"], "precioCents": 0, "nota": ""},
        {"id": "sinhoja", "nombre": "Sin hoja", "productos": ["10000000-0000-0000-0000-000000000001", "10000000-0000-0000-0000-000000000003"], "precioCents": 9000, "nota": ""},
        {"id": "doble", "nombre": "Dos poleras", "productos": ["10000000-0000-0000-0000-000000000001", "10000000-0000-0000-0000-000000000001"], "precioCents": 20000, "nota": ""}
      ],
      "bloques": [
        {"id": "b1", "tipo": "pack", "variante": "tarjeta", "pack": "verano"},
        {"id": "b2", "tipo": "pack", "variante": "tarjeta", "pack": "oculto"},
        {"id": "b3", "tipo": "pack", "variante": "tarjeta", "pack": "gratis"},
        {"id": "b5", "tipo": "pack", "variante": "tarjeta", "pack": "doble"}
      ]
    }$j$),
    (t.a, 'Borrado', 'tokBorrado', now(), $j${
      "packs": [{"id": "verano", "nombre": "Combo Verano", "productos": ["10000000-0000-0000-0000-000000000001", "10000000-0000-0000-0000-000000000003"], "precioCents": 9000, "nota": ""}],
      "bloques": [{"id": "b1", "tipo": "pack", "variante": "tarjeta", "pack": "verano"}]
    }$j$),
    (t.b, 'De B', 'tokB', null, $j${
      "packs": [{"id": "deb", "nombre": "Combo de B", "productos": ["10000000-0000-0000-0000-000000000005", "10000000-0000-0000-0000-000000000005"], "precioCents": 8000, "nota": ""}],
      "bloques": [{"id": "b1", "tipo": "pack", "variante": "tarjeta", "pack": "deb"}]
    }$j$)
  ) as c(de, nombre, token, borrado, config);

-- Lo que manda el carrito por cada combo: el combo y lo elegido de cada producto.
create function pg_temp.verano(p_qty int, p_talla text default '20000000-0000-0000-0000-000000000032')
returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object(
    'combo', jsonb_build_object('catalogo', 'tokA', 'id', 'verano'),
    'quantity', p_qty,
    'price_cents', 1,
    'partes', jsonb_build_array(
      jsonb_build_object('product_id', '10000000-0000-0000-0000-000000000001'),
      jsonb_build_object('product_id', '10000000-0000-0000-0000-000000000002', 'variant_id', p_talla),
      jsonb_build_object('product_id', '10000000-0000-0000-0000-000000000003')
    )
  ))
$$;
create function pg_temp.combo(p_token text, p_id text, p_productos text[])
returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object(
    'combo', jsonb_build_object('catalogo', p_token, 'id', p_id),
    'quantity', 1,
    'partes', (select jsonb_agg(jsonb_build_object('product_id', p)) from unnest(p_productos) p)
  ))
$$;
grant execute on function pg_temp.verano(int, text), pg_temp.combo(text, text, text[]) to anon;

-- Desde acá, quien compra: sin cuenta.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

create temporary table respuesta on commit drop as
select public.create_order((select a from tiendas), pg_temp.verano(1)) as r;

select is((select (r->>'total_cents')::int from respuesta), 25000,
  'el precio del combo sale del catálogo, no del que manda el carrito');
select is((select r->'items'->0->>'combo' from respuesta), 'true',
  'la línea dice que es un combo');
select is((select jsonb_array_length(r->'items'->0->'partes') from respuesta), 3,
  'la línea trae los productos del combo');
select is((select r->'items'->0->'partes'->1->>'variante' from respuesta), '32',
  'cada producto trae la talla elegida');

select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('noexiste', 'verano', array['10000000-0000-0000-0000-000000000001'])) $$,
  'Combo no disponible: verano', 'un catálogo que no existe no vende combos');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('tokBorrado', 'verano', array['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'])) $$,
  'Combo no disponible: verano', 'un catálogo borrado no vende combos');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('tokA', 'otro', array['10000000-0000-0000-0000-000000000001'])) $$,
  'Combo no disponible: otro', 'un combo que no está en el catálogo');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('tokA', 'sinhoja', array['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'])) $$,
  'Combo no disponible: sinhoja', 'un combo que ninguna hoja muestra');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('tokA', 'gratis', array['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'])) $$,
  'Combo no disponible: gratis', 'un combo sin precio');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('tokB', 'deb', array['10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005'])) $$,
  'Combo no disponible: deb', 'un catálogo de otra tienda');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('tokA', 'oculto', array['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004'])) $$,
  'Combo no disponible: oculto', 'un combo con un producto que ya no se vende deja de pedirse');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('tokA', 'verano', array['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'])) $$,
  'Elige una opción de Short', 'un producto con tallas pide la talla');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.verano(1, '20000000-0000-0000-0000-000000000099')) $$,
  'Opción no disponible de Short', 'una talla que no es de ese producto');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.combo('tokA', 'verano', array['10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'])) $$,
  'Combo no disponible: verano', 'lo elegido tiene que coincidir con los productos del combo');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.verano(1, '20000000-0000-0000-0000-000000000034')) $$,
  'Stock insuficiente de Short · 34: quedan 0', 'un producto agotado no deja pedir el combo');
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.verano(2)) $$,
  'Stock insuficiente de Gorra: quedan 1', 'dos combos piden el doble de cada producto');
select throws_like(
  $$ select public.create_order((select a from tiendas), jsonb_build_array(jsonb_build_object(
       'combo', jsonb_build_object('catalogo', 'tokA', 'id', 'doble'), 'quantity', 3,
       'partes', jsonb_build_array(
         jsonb_build_object('product_id', '10000000-0000-0000-0000-000000000001'),
         jsonb_build_object('product_id', '10000000-0000-0000-0000-000000000001'))))) $$,
  'Stock insuficiente de Polera: quedan 5', 'un producto repetido en el combo cuenta las dos veces');
select throws_ok(
  $$ select count(*) from public.order_item_components $$,
  '42501', null, 'quien compra no lee los productos de los combos');

reset role;

select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000001'), 5,
  'pedir un combo no toca el stock');
select is(
  (select count(*)::int from public.order_items oi
     join public.orders o on o.id = oi.order_id
    where o.store_id = (select a from tiendas)
      and oi.product_id is null and oi.combo_id = 'verano'
      and oi.product_name = 'Combo Verano' and oi.unit_price_cents = 25000),
  1, 'el combo es una sola línea del pedido, con su nombre y su precio');
select is(
  (select count(*)::int from public.order_item_components c
     join public.order_items oi on oi.id = c.order_item_id
    where oi.combo_id = 'verano'),
  3, 'y lleva sus tres productos');

-- La tienda cambia el precio del combo: vale para el pedido siguiente.
update public.catalogs
   set config = jsonb_set(config, '{packs,0,precioCents}', '30000')
 where share_token = 'tokA';

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is(
  (public.create_order((select a from tiendas), pg_temp.verano(1))->>'total_cents')::int,
  30000, 'el precio nuevo del catálogo vale para el pedido siguiente');
reset role;
select is(
  (select unit_price_cents from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.store_id = (select a from tiendas) and o.order_number = 1),
  25000, 'y el pedido anterior conserva el suyo');

-- Con la función apagada para la tienda, los combos no se piden.
insert into public.store_feature_states (store_id, feature, state)
values ((select a from tiendas), 'combos', 'desactivada');
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_like(
  $$ select public.create_order((select a from tiendas), pg_temp.verano(1)) $$,
  'Los combos no están disponibles', 'los combos se apagan desde la administración');
reset role;
delete from public.store_feature_states where store_id = (select a from tiendas) and feature = 'combos';

-- Desde acá, la tienda maneja sus pedidos.
create temporary table pedido on commit drop as
select order_number as numero, id from public.orders where store_id = (select a from tiendas);
grant select on pedido to authenticated;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is(
  (select count(*)::int from public.order_item_components),
  6, 'la tienda lee los productos de sus combos');

update public.orders set status = 'pagado' where id = (select id from pedido where numero = 1);

reset role;
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000001'), 4,
  'marcar pagado un combo baja el stock de cada producto');
select is((select stock from public.product_variants where id = '20000000-0000-0000-0000-000000000032'), 1,
  'también el de la talla elegida');
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000003'), 0,
  'y el de la gorra');
select is(
  (select unit_cost_cents from public.order_items where order_id = (select id from pedido where numero = 1)),
  14000, 'el costo del combo es la suma del de sus productos');

set local role authenticated;
select throws_like(
  $$ update public.orders set status = 'pagado' where id = (select id from pedido where numero = 2) $$,
  'Stock insuficiente de Gorra: quedan 0',
  'no se cobra un combo si un producto ya no alcanza'
);

update public.orders set status = 'cancelado' where id = (select id from pedido where numero = 1);

reset role;
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000001'), 5,
  'cancelar un combo pagado devuelve el stock de cada producto');
select is((select stock from public.product_variants where id = '20000000-0000-0000-0000-000000000032'), 2,
  'también a la talla');
select is((select stock from public.products where id = '10000000-0000-0000-0000-000000000003'), 1,
  'y a la gorra');

select * from finish();
rollback;
