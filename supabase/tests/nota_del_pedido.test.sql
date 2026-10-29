-- La nota interna del pedido: la escribe y la lee solo su tienda.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

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

create temporary table tienda on commit drop as
select id from public.stores where owner_id = '00000000-0000-0000-0000-00000000000a';
grant select on tienda to anon, authenticated;

insert into public.products (id, store_id, name, price_cents, stock)
select '10000000-0000-0000-0000-000000000001', id, 'Gorra', 8500, 5 from tienda;

create temporary table pedido on commit drop as
select (public.create_order(
  (select id from tienda),
  '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]'
)->>'id')::uuid as id;
grant select on pedido to anon, authenticated;

select is(
  (select nota from public.orders where id = (select id from pedido)),
  null,
  'el pedido de quien compra nace sin nota'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

update public.orders set nota = 'Entrega el sábado, pagó la mitad.'
 where id = (select id from pedido);

select is(
  (select nota from public.orders where id = (select id from pedido)),
  'Entrega el sábado, pagó la mitad.',
  'la tienda escribe su nota'
);

select throws_ok(
  $$ update public.orders set nota = repeat('a', 501) where id = (select id from pedido) $$,
  '23514',
  null,
  'una nota de más de 500 caracteres no entra'
);

select throws_ok(
  $$ update public.orders set nota = '' where id = (select id from pedido) $$,
  '23514',
  null,
  'una nota vacía se guarda como null, no como texto vacío'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

update public.orders set nota = 'De B' where id = (select id from pedido);

select is(
  (select count(*)::int from public.orders where nota is not null),
  0,
  'otra tienda no ve la nota'
);

reset role;

select is(
  (select nota from public.orders where id = (select id from pedido)),
  'Entrega el sábado, pagó la mitad.',
  'ni la cambia'
);

select * from finish();
rollback;
