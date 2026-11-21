-- Quien compra solo lee una tienda que se sirve: publicada, sin pausar, con la
-- suscripción vigente y sin dar de baja. Su dueño la sigue leyendo igual.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000c1', 'c1@prueba.test', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select public.create_store('Tienda Pausable', null, 'calle', '70000009');
reset role;

create temporary table tienda on commit drop as
select id from public.stores where owner_id = '00000000-0000-0000-0000-0000000000c1';
grant select on tienda to anon, authenticated;

-- Cuántas filas de esa tienda ve quien compra.
create function pg_temp.las_ve_quien_compra() returns int
language plpgsql as $$
declare n int;
begin
  -- Sin la identidad de la dueña, que quedó puesta más arriba: si no, la
  -- política la reconocería y el test no probaría nada.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*)::int into n from public.stores where id = (select id from tienda);
  reset role;
  return n;
end $$;

select is(pg_temp.las_ve_quien_compra(), 1, 'publicada y al día: quien compra la ve');

update public.stores set suspended_at = now() where id = (select id from tienda);
select is(pg_temp.las_ve_quien_compra(), 0, 'pausada por Venduo: quien compra no la ve');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select is(
  (select count(*)::int from public.stores where id = (select id from tienda)),
  1,
  'pausada: su dueño la sigue viendo en su panel'
);
reset role;

update public.stores set suspended_at = null where id = (select id from tienda);
update public.subscriptions set status = 'bloqueada' where store_id = (select id from tienda);
select is(pg_temp.las_ve_quien_compra(), 0, 'con la suscripción bloqueada: no se ve');

update public.subscriptions set status = 'prueba' where store_id = (select id from tienda);
update public.stores set closed_at = now() where id = (select id from tienda);
select is(pg_temp.las_ve_quien_compra(), 0, 'dada de baja: no se ve');

update public.stores set closed_at = null, is_published = false where id = (select id from tienda);
select is(pg_temp.las_ve_quien_compra(), 0, 'en borrador: no se ve');

update public.stores set is_published = true where id = (select id from tienda);
select is(pg_temp.las_ve_quien_compra(), 1, 'publicada otra vez: se ve');

select * from finish();
rollback;
