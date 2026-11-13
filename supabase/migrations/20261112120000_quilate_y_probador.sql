-- ============================================================================
-- Dos plantillas nuevas: Quilate (joyas y accesorios) y Probador (ropa de
-- mujer, boutique). Son la primera tanda de siete (docs/briefs/
-- 2026-11-11-plantillas-nuevas.md).
--
-- Las bases y los kits viven en código (`lib/plantillas`, `components/plantillas`);
-- esta migración las da de alta en el catálogo y les siembra la portada. Una
-- fila activa sin kit en código no se ofrece (`getAparienciaDeMiTienda`), así
-- que el orden entre migración y despliegue no rompe nada.
--
-- Quilate no es de ningún rubro de los que había: abre "Joyas", después de
-- Moda.
--
-- Idempotente: se puede volver a correr sin duplicar nada.
-- ============================================================================

insert into public.sectors (key, name, position, is_active) values
  ('joyeria', 'Joyas', 15, true)
on conflict (key) do update
  set name = excluded.name,
      position = excluded.position,
      is_active = true;

insert into public.templates (key, name, sector, description, version, is_active) values
  ('quilate', 'Quilate', 'joyeria',
   'Joyas y accesorios. La pieza de cerca, cómo se ve puesta en un círculo, y el material en un sello.',
   1, true),
  ('probador', 'Probador', 'moda',
   'Ropa de mujer con aire de boutique. Fotos de cuerpo entero y las tallas a la vista antes de entrar al producto.',
   1, true)
on conflict (key) do update
  set name = excluded.name,
      sector = excluded.sector,
      description = excluded.description,
      is_active = true;

insert into public.template_pages (template_key, page_key, title, is_home, blocks) values
  ('quilate', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Piezas que se quedan contigo","subtitle":"Aretes, collares y anillos elegidos uno por uno. Si quieres verla de cerca, te mandamos más fotos por WhatsApp.","ctaLabel":"Ver las piezas"}},
     {"block_type_key":"categories","props":{"title":"Por dónde la llevas","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Recién llegadas","columns":4,"limit":8}},
     {"block_type_key":"cta","props":{"title":"¿Es para regalar?","body":"Escríbenos y te ayudamos a elegir.","buttonLabel":"Ver las piezas"}}]'::jsonb),

  ('probador', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Recién llegado","subtitle":"Prendas elegidas para el día, la oficina y para salir. Si dudas con la talla, te ayudamos por WhatsApp.","ctaLabel":"Ver lo nuevo"}},
     {"block_type_key":"categories","props":{"title":"Para cada ocasión","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Nuevo ingreso","columns":4,"limit":8}},
     {"block_type_key":"faq","props":{"title":"Antes de comprar","items":[{"question":"¿Cómo sé mi talla?","answer":"Envíanos tu busto, cintura y cadera en centímetros, o la talla que usas en otra marca, y te decimos cuál pedir."},{"question":"¿Puedo cambiar una prenda?","answer":"Sí. Escríbenos por WhatsApp y coordinamos el cambio de talla o de modelo."},{"question":"¿Cómo recibo mi pedido?","answer":"Después de enviar tu pedido, te escribimos por WhatsApp para acordar el pago, el lugar y la hora de entrega."}]}}]'::jsonb)
on conflict (template_key, page_key) do update
  set title = excluded.title,
      is_home = excluded.is_home,
      blocks = excluded.blocks;
