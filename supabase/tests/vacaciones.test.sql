-- La tienda de vacaciones se sigue viendo, no recibe pedidos de la tienda y
-- vuelve sola el día de su fecha, en hora de Bolivia.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

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
select '10000000-0000-0000-0000-000000000001', id, 'Gorra', 8500, 20 from tienda;

create temporary table hoy on commit drop as
select (now() at time zone 'America/La_Paz')::date as dia;
grant select on hoy to anon, authenticated;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select lives_ok(
  $$ select public.create_order((select id from tienda), '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') $$,
  'sin vacaciones, recibe pedidos'
);

-- La dueña se va de vacaciones, sin fecha. Lo escribe con su sesión.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
update public.stores set vacaciones_desde = now() where id = (select id from tienda);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_like(
  $$ select public.create_order((select id from tienda), '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') $$,
  'La tienda está de vacaciones',
  'de vacaciones sin fecha, no recibe pedidos'
);

select ok(public.store_is_live((select id from tienda)), 'pero la tienda se sigue sirviendo');

select ok(public.tienda_de_vacaciones((select id from tienda)), 'y quien compra puede saber que está de vacaciones');

reset role;
update public.stores set vacaciones_hasta = (select dia from hoy) + 1 where id = (select id from tienda);
set local role anon;

select throws_like(
  $$ select public.create_order((select id from tienda), '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') $$,
  'La tienda está de vacaciones',
  'si vuelve mañana, hoy todavía no recibe'
);

reset role;
update public.stores set vacaciones_hasta = (select dia from hoy) where id = (select id from tienda);
set local role anon;

select lives_ok(
  $$ select public.create_order((select id from tienda), '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') $$,
  'el día de su vuelta, recibe pedidos sola'
);

reset role;
update public.stores set vacaciones_hasta = null where id = (select id from tienda);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select lives_ok(
  $$ select public.registrar_venta('[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]') $$,
  'de vacaciones, la venta en persona se registra igual'
);

reset role;

select throws_ok(
  $$ update public.stores set vacaciones_desde = null, vacaciones_hasta = current_date + 3
      where id = (select id from tienda) $$,
  '23514',
  null,
  'no hay fecha de vuelta sin vacaciones'
);

select cmp_ok(
  (select vista_cambio_at from public.stores where id = (select id from tienda)),
  '>=',
  (select vacaciones_desde from public.stores where id = (select id from tienda)),
  'entrar de vacaciones vuelve vieja la captura de la portada'
);

select * from finish();
rollback;
