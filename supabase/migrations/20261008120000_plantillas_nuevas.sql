-- ============================================================================
-- Cinco plantillas nuevas: Calle, Atelier, Pisada, Fórmula y Bazar.
--
-- Las bases y los kits viven en código (`lib/plantillas`, `components/plantillas`);
-- esta migración las da de alta en el catálogo y les siembra la portada. Una
-- fila activa sin kit en código no se ofrece (`getAparienciaDeMiTienda`), así
-- que el orden entre migración y despliegue no rompe nada: hasta que llega el
-- código, las cinco no aparecen.
--
-- Bazar no es de ningún rubro de los que había: abre "Variedades".
--
-- Idempotente: se puede volver a correr sin duplicar nada.
-- ============================================================================

insert into public.sectors (key, name, position, is_active) values
  ('variedades', 'Variedades', 70, true)
on conflict (key) do update
  set name = excluded.name,
      position = excluded.position,
      is_active = true;

insert into public.templates (key, name, sector, description, version, is_active) values
  ('calle', 'Calle', 'moda',
   'Ropa urbana y de tanda. Letra de afiche, prendas enmarcadas como un fanzine y una cinta que corre con lo nuevo.',
   1, true),
  ('atelier', 'Atelier', 'moda',
   'Carteras, bolsos y accesorios. Cada pieza sobre su paño, títulos de revista de moda y una ficha que la muestra entera.',
   1, true),
  ('pisada', 'Pisada', 'moda',
   'Zapatillas y calzado. Cada par de perfil sobre su placa, titulares en cursiva que van hacia adelante y precios a la vista.',
   1, true),
  ('formula', 'Fórmula', 'belleza',
   'Perfumería de autor, decants y aceites. Una botica moderna: cada frasco con su etiqueta numerada y su ficha sin adornos.',
   1, true),
  ('bazar', 'Bazar', 'variedades',
   'Tiendas de todo un poco: regalos, accesorios, hogar y tecnología. Muchas cosas a la vista, categorías grandes y precios que se ven.',
   1, true)
on conflict (key) do update
  set name = excluded.name,
      sector = excluded.sector,
      description = excluded.description,
      is_active = true;

insert into public.template_pages (template_key, page_key, title, is_home, blocks) values
  ('calle', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Nueva tanda","subtitle":"Poleras, buzos y gorras en tandas cortas. Arma tu pedido y lo cerramos por WhatsApp.","ctaLabel":"Ver lo nuevo"}},
     {"block_type_key":"product_grid","props":{"title":"Lo nuevo","columns":3,"limit":6,"condition":"nuevo"}},
     {"block_type_key":"categories","props":{"title":"Por sección","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Lo más pedido","columns":3,"limit":3,"condition":"todos","featured":true}},
     {"block_type_key":"cta","props":{"title":"¿Dudas con la talla?","body":"Escríbenos tu altura y cómo te gusta que te quede: te decimos cuál pedir.","buttonLabel":"Ver el catálogo"}},
     {"block_type_key":"product_grid","props":{"title":"Segunda mano","columns":3,"limit":3,"condition":"segunda_mano"}}]'::jsonb),

  ('atelier', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Piezas para todos los días","subtitle":"Carteras, bolsos y billeteras elegidos uno por uno. Si quieres verla de cerca, te mandamos más fotos por WhatsApp.","ctaLabel":"Ver la colección"}},
     {"block_type_key":"categories","props":{"title":"Las líneas de la casa","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Las elegidas","columns":3,"limit":6,"condition":"todos","featured":true}},
     {"block_type_key":"about","props":{"title":"Cómo elegimos cada pieza","body":"Revisamos costuras, herrajes y forro antes de publicarla. Si una pieza es de segunda mano, te contamos su estado tal como es."}},
     {"block_type_key":"product_grid","props":{"title":"Recién llegadas","columns":3,"limit":6,"condition":"nuevo"}}]'::jsonb),

  ('pisada', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Nuevos pares","subtitle":"Urbanas, running y para todos los días. Pregúntanos tu talla por WhatsApp antes de pedir.","ctaLabel":"Ver los modelos"}},
     {"block_type_key":"categories","props":{"title":"Elige tu estilo","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Lo nuevo","columns":4,"limit":8,"condition":"nuevo"}},
     {"block_type_key":"product_grid","props":{"title":"Los más buscados","columns":4,"limit":4,"condition":"todos","featured":true}},
     {"block_type_key":"product_grid","props":{"title":"Segunda mano","columns":4,"limit":4,"condition":"segunda_mano"}},
     {"block_type_key":"faq","props":{"title":"Antes de comprar","items":[{"question":"¿Cómo sé mi talla?","answer":"Escríbenos el largo de tu pie en centímetros o la talla que usas en otra marca, y te decimos cuál pedir."},{"question":"¿Cómo recibo mi pedido?","answer":"Después de mandar tu pedido, la tienda te escribe por WhatsApp para acordar el pago, el lugar y la hora de entrega."}]}}]'::jsonb),

  ('formula', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Aromas de autor","subtitle":"Frascos y decants para probar antes de comprometerte con uno. Si no sabes cuál elegir, te asesoramos por WhatsApp.","ctaLabel":"Ver los frascos"}},
     {"block_type_key":"categories","props":{"title":"Familias","limit":8}},
     {"block_type_key":"product_grid","props":{"title":"Los más pedidos","columns":3,"limit":6,"condition":"todos","featured":true}},
     {"block_type_key":"product_grid","props":{"title":"Recién llegados","columns":3,"limit":6,"condition":"nuevo"}},
     {"block_type_key":"faq","props":{"title":"Antes de comprar","items":[{"question":"¿Qué es un decant?","answer":"Una porción del perfume original pasada a un frasco chico. Sirve para probarlo varios días antes de comprar el frasco entero."},{"question":"¿Me pueden ayudar a elegir?","answer":"Sí. Escríbenos por WhatsApp qué aromas te gustan y para qué ocasión, y te recomendamos opciones."}]}}]'::jsonb),

  ('bazar', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"De todo un poco","subtitle":"Accesorios, regalos, hogar y tecnología. Si buscas algo que no ves, escríbenos por WhatsApp.","ctaLabel":"Ver todo lo que hay"}},
     {"block_type_key":"categories","props":{"title":"¿Qué estás buscando?","limit":7}},
     {"block_type_key":"product_grid","props":{"title":"Lo más vendido","columns":4,"limit":8,"condition":"todos","featured":true}},
     {"block_type_key":"product_grid","props":{"title":"Recién llegado","columns":4,"limit":8,"condition":"nuevo"}},
     {"block_type_key":"product_grid","props":{"title":"Segunda mano","columns":4,"limit":4,"condition":"segunda_mano"}}]'::jsonb)
on conflict (template_key, page_key) do update
  set title = excluded.title,
      is_home = excluded.is_home,
      blocks = excluded.blocks;
