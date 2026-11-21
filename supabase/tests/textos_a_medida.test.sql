-- "IA: textos a medida" empieza oculta, se activa por tienda, la apaga el
-- interruptor general de la IA, y una tienda tiene a lo sumo una propuesta de
-- textos pendiente.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@prueba.test', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';
select public.create_store('Tienda Textos', 'Ropa de mujer, blusas y vestidos.', 'correa', '70000010');
reset role;

create temporary table tienda on commit drop as
select id from public.stores where owner_id = '00000000-0000-0000-0000-0000000000d1';

select is(
  public.funcion_de_tienda((select id from tienda), 'ia_textos'),
  'oculta',
  'de fábrica, la función está oculta'
);

insert into public.store_feature_states (store_id, feature, state)
select id, 'ia_textos', 'activa' from tienda;
select is(
  public.funcion_de_tienda((select id from tienda), 'ia_textos'),
  'activa',
  'activada para la tienda, manda sobre la general'
);

insert into public.platform_settings (key, value) values ('ia_apagada', 'true')
on conflict (key) do update set value = excluded.value;
select is(
  public.funcion_de_tienda((select id from tienda), 'ia_textos'),
  'oculta',
  'con toda la IA apagada, queda oculta'
);

-- Las propuestas, como la dueña.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';

select lives_ok(
  $$ insert into public.block_edit_proposals (store_id, page_id, prompt, operations, snapshot_before, origen)
     select s.id, (select p.id from public.store_pages p where p.store_id = s.id order by p.created_at limit 1), 'Ropa de mujer', '[]', '[]', 'textos'
       from public.stores s where s.owner_id = '00000000-0000-0000-0000-0000000000d1' $$,
  'la dueña guarda una propuesta de textos'
);

select throws_ok(
  $$ insert into public.block_edit_proposals (store_id, page_id, prompt, operations, snapshot_before, origen)
     select s.id, (select p.id from public.store_pages p where p.store_id = s.id order by p.created_at limit 1), 'Ropa de mujer', '[]', '[]', 'textos'
       from public.stores s where s.owner_id = '00000000-0000-0000-0000-0000000000d1' $$,
  '23505',
  null,
  'no hay dos propuestas de textos pendientes en la misma tienda'
);

select lives_ok(
  $$ update public.stores set textos_a_medida = '{"hero": {"title": "Ropa para todos los días"}}'
     where owner_id = '00000000-0000-0000-0000-0000000000d1' $$,
  'la dueña guarda sus textos aceptados'
);

select * from finish();
rollback;
