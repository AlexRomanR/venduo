-- ============================================================================
-- Cinco plantillas nuevas: Ámbar (perfumes árabes y decants), Correa (carteras
-- de color), Taco (zapatos de mujer), Tocador (maquillaje y skincare) y Crayón
-- (ropa de niños y bebés). Son la segunda tanda de siete
-- (docs/briefs/2026-11-11-plantillas-nuevas.md).
--
-- Las bases y los kits viven en código; esta migración las da de alta en el
-- catálogo y les siembra la portada. Una fila activa sin kit en código no se
-- ofrece (`getAparienciaDeMiTienda`), así que el orden entre migración y
-- despliegue no rompe nada.
--
-- Crayón no es de ningún rubro de los que había: abre "Niños", después de
-- Joyas.
--
-- Idempotente: se puede volver a correr sin duplicar nada.
-- ============================================================================

insert into public.sectors (key, name, position, is_active) values
  ('ninos', 'Niños', 18, true)
on conflict (key) do update
  set name = excluded.name,
      position = excluded.position,
      is_active = true;

insert into public.templates (key, name, sector, description, version, is_active) values
  ('ambar', 'Ámbar', 'belleza',
   'Perfumes árabes y decants. Bandas de noche, una regla de estrellas y el precio del decant primero.',
   1, true),
  ('correa', 'Correa', 'moda',
   'Carteras y bolsos de todos los días. Cada pieza sobre un azulejo de color, con sus colores a la vista.',
   1, true),
  ('taco', 'Taco', 'moda',
   'Zapatos de mujer. Cada par de perfil, sobre su repisa, con los números que quedan a la vista.',
   1, true),
  ('tocador', 'Tocador', 'belleza',
   'Maquillaje y skincare. La rutina en pasos numerados, los tonos de cada producto a la vista y ayuda con el tono por WhatsApp.',
   1, true),
  ('crayon', 'Crayón', 'ninos',
   'Ropa de bebés y de niñas y niños. Se busca por edad en un tallímetro, con tarjetas redondas y garabatos de crayón.',
   1, true)
on conflict (key) do update
  set name = excluded.name,
      sector = excluded.sector,
      description = excluded.description,
      is_active = true;

insert into public.template_pages (template_key, page_key, title, is_home, blocks) values
  ('ambar', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Perfumes árabes, del decant al frasco","subtitle":"Prueba en decant y quédate con el frasco que te guste.","ctaLabel":"Ver los perfumes"}},
     {"block_type_key":"categories","props":{"title":"Por familia","limit":8}},
     {"block_type_key":"product_grid","props":{"title":"Los más pedidos","columns":4,"limit":8}},
     {"block_type_key":"faq","props":{"title":"Antes de comprar","items":[{"question":"¿Qué es un decant?","answer":"Es el mismo perfume, pasado de su frasco original a uno más chico. Sirve para usarlo varios días antes de llevar el frasco entero."},{"question":"¿Cómo hago mi pedido?","answer":"Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]}}]'::jsonb),

  ('correa', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Carteras para todos los días","subtitle":"De mano, cruzadas y mochilas, en colores que alegran.","ctaLabel":"Ver las carteras"}},
     {"block_type_key":"categories","props":{"title":"Por tamaño","limit":8}},
     {"block_type_key":"product_grid","props":{"title":"Lo nuevo","columns":3,"limit":6}},
     {"block_type_key":"cta","props":{"title":"¿Buscas un color en especial?","body":"Escríbenos y te ayudamos a elegir.","buttonLabel":"Ver el catálogo"}}]'::jsonb),

  ('taco', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"nuevos pares","subtitle":"Sandalias, tacos y botines elegidos par por par.","ctaLabel":"Ver los modelos"}},
     {"block_type_key":"categories","props":{"title":"por tipo de taco","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"recién llegados","columns":4,"limit":8}},
     {"block_type_key":"faq","props":{"title":"antes de comprar","items":[{"question":"¿Cómo sé mi número?","answer":"Pon el pie sobre una hoja, marca el talón y la punta del dedo más largo, y mide en centímetros. Envíanos la medida y te decimos qué número te queda."},{"question":"¿Cómo hago mi pedido?","answer":"Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]}}]'::jsonb),

  ('tocador', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Tu rutina, paso a paso","subtitle":"Skincare y maquillaje para tu piel y tu tono.","ctaLabel":"Ver los productos"}},
     {"block_type_key":"categories","props":{"title":"Tu rutina","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Los favoritos","columns":4,"limit":8}},
     {"block_type_key":"faq","props":{"title":"Antes de comprar","items":[{"question":"¿Cómo elijo mi tono?","answer":"Envíanos por WhatsApp una foto de tu cara con luz natural y sin filtro, y te recomendamos el tono."},{"question":"¿Cómo hago mi pedido?","answer":"Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]}}]'::jsonb),

  ('crayon', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Ropa para crecer jugando","subtitle":"Para quienes recién llegan y para quienes ya corren.","ctaLabel":"Ver por edad"}},
     {"block_type_key":"categories","props":{"title":"Por edad","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Lo nuevo","columns":4,"limit":8}},
     {"block_type_key":"product_grid","props":{"title":"Para regalar","columns":4,"limit":4,"featured":true}},
     {"block_type_key":"faq","props":{"title":"Antes de comprar","items":[{"question":"¿Qué talla elijo?","answer":"Cada marca talla distinto. Dinos la edad y la estatura de quien la va a usar y te recomendamos la talla."},{"question":"¿Cómo hago mi pedido?","answer":"Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]}}]'::jsonb)
on conflict (template_key, page_key) do update
  set title = excluded.title,
      is_home = excluded.is_home,
      blocks = excluded.blocks;
