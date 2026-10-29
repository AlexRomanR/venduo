-- Lo que marca el administrador —la pausa de la tienda, la baja, el producto
-- oculto por Venduo— no lo desmarca el dueño desde la API.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.test', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ begin perform public.create_store('Tienda A', null, 'calle', '70000001'); end $$;
reset role;

-- Venduo la pausa y le oculta un producto, como lo hace /admin.
update public.stores set suspended_at = now()
 where owner_id = '00000000-0000-0000-0000-00000000000a';
insert into public.products (id, store_id, name, price_cents, moderated_at)
select '10000000-0000-0000-0000-000000000001', id, 'Gorra', 8500, now()
  from public.stores where owner_id = '00000000-0000-0000-0000-00000000000a';

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_like(
  $$ update public.stores set suspended_at = null
      where owner_id = '00000000-0000-0000-0000-00000000000a' $$,
  'Eso solo lo cambia Venduo',
  'el dueño no se quita la pausa de Venduo'
);

select throws_like(
  $$ update public.stores set closed_at = now()
      where owner_id = '00000000-0000-0000-0000-00000000000a' $$,
  'Eso solo lo cambia Venduo',
  'ni se da de baja escribiendo la columna'
);

select throws_like(
  $$ update public.products set moderated_at = null
      where id = '10000000-0000-0000-0000-000000000001' $$,
  'Eso solo lo cambia Venduo',
  'ni muestra un producto que Venduo ocultó'
);

select lives_ok(
  $$ update public.stores set name = 'Tienda A nueva'
      where owner_id = '00000000-0000-0000-0000-00000000000a' $$,
  'el resto de su tienda lo cambia igual'
);

select lives_ok(
  $$ update public.products set price_cents = 9000
      where id = '10000000-0000-0000-0000-000000000001' $$,
  'y el resto de su producto'
);

reset role;

select lives_ok(
  $$ update public.stores set suspended_at = null
      where owner_id = '00000000-0000-0000-0000-00000000000a' $$,
  'Venduo sí la reactiva'
);

select * from finish();
rollback;
