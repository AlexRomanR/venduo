-- El stock de un producto con variantes es la suma de las suyas: lo mantiene
-- la base, y a mano solo se cambia el de cada variante.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

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

insert into public.products (id, store_id, name, price_cents, stock)
select '10000000-0000-0000-0000-000000000006'::uuid, id, 'Buzo', 10000, 7
  from public.stores where owner_id = '00000000-0000-0000-0000-00000000000a'
union all
select '10000000-0000-0000-0000-000000000004'::uuid, id, 'De B', 10000, 0
  from public.stores where owner_id = '00000000-0000-0000-0000-00000000000b';

insert into public.product_variants (id, product_id, store_id, valores, nombre, stock)
select '20000000-0000-0000-0000-000000000009'::uuid, '10000000-0000-0000-0000-000000000004', id, '{"Talla":"L"}', 'L', 1
  from public.stores where owner_id = '00000000-0000-0000-0000-00000000000b';

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select lives_ok(
  $$ select public.guardar_variantes(
       '10000000-0000-0000-0000-000000000006',
       '[{"nombre":"Talla","valores":["S","M"]}]',
       '[{"valores":{"Talla":"S"},"stock":3},{"valores":{"Talla":"M"},"stock":2}]'
     ) $$,
  'la tienda guarda sus tallas'
);

select is(
  (select stock from public.products where id = '10000000-0000-0000-0000-000000000006'),
  5,
  'el stock del producto pasa a ser la suma de sus variantes'
);

select throws_like(
  $$ update public.products set stock = 50 where id = '10000000-0000-0000-0000-000000000006' $$,
  'El stock de Buzo se cambia en cada variante',
  'el stock de un producto con variantes no se cambia a mano'
);

select is(
  public.ajustar_stock_de_variante(
    (select id from public.product_variants where product_id = '10000000-0000-0000-0000-000000000006' and valores = '{"Talla":"S"}'),
    10
  ),
  10,
  'se corrige el stock de una variante'
);

select is(
  (select stock from public.products where id = '10000000-0000-0000-0000-000000000006'),
  12,
  'y el producto vuelve a sumar'
);

select throws_like(
  $$ select public.ajustar_stock_de_variante('20000000-0000-0000-0000-000000000009', 99) $$,
  'Variante no encontrada',
  'no se corrige el stock de una variante de otra tienda'
);

select throws_like(
  $$ select public.guardar_variantes(
       '10000000-0000-0000-0000-000000000006',
       '[{"nombre":"Talla","valores":["S","M"]}]',
       '[{"valores":{"Talla":"XL"},"stock":1}]'
     ) $$,
  'Combinación no válida',
  'una variante que no sale de las opciones no se guarda'
);

select throws_like(
  $$ select public.guardar_variantes(
       '10000000-0000-0000-0000-000000000006',
       '[{"nombre":"Talla","valores":["S","M"]}]',
       '[{"valores":{"Talla":"S"},"stock":1},{"valores":{"Talla":"S"},"stock":2}]'
     ) $$,
  'Combinación repetida: S',
  'dos variantes iguales no se guardan'
);

select lives_ok(
  $$ select public.guardar_variantes('10000000-0000-0000-0000-000000000006', '[]', '[]') $$,
  'la tienda quita todas las tallas'
);

reset role;

select is(
  (select stock from public.products where id = '10000000-0000-0000-0000-000000000006'),
  12,
  'sin variantes, el producto se queda con el stock que sumaban'
);

select * from finish();
rollback;
