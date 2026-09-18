-- ============================================================================
-- Venduo — un negocio nuevo nace con el mundo editorial
--
-- Elegir plantilla salió del modelo cuando el canal pasó a ser un solo
-- Marketplace, pero `create_store` sigue sembrando la página del negocio y pide
-- una clave de plantilla activa. Hasta ahora se le pasaba `fashion`, y eso
-- teñía el panel del negocio con una identidad que él nunca eligió.
--
-- `clasica` es la base editorial de Venduo, la misma que ya dibuja las tiendas
-- cuya plantilla se retiró. Se da de alta para poder nombrarla.
-- ============================================================================

insert into public.templates (key, name, sector, description, version, is_active)
values (
  'clasica',
  'Editorial',
  'moda',
  'El diseño de Venduo: papel, tinta y un rojo de señal.',
  1,
  true
)
on conflict (key) do update
  set name = excluded.name,
      description = excluded.description,
      is_active = true;

insert into public.template_pages (template_key, page_key, title, is_home, blocks)
values (
  'clasica',
  'home',
  'Inicio',
  true,
  '[{"block_type_key":"hero","props":{"title":"Lo que hacemos","subtitle":"Escribe acá una línea sobre tu negocio."}},
    {"block_type_key":"product_grid","props":{"title":"Nuestros productos","columns":3,"limit":12,"condition":"todos"}}]'::jsonb
)
on conflict (template_key, page_key) do nothing;
