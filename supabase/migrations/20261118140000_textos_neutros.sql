-- ============================================================================
-- Textos neutros: las plantillas dejan de nombrar un producto.
--
-- Brief: docs/briefs/2026-11-18-textos-que-se-adaptan.md (los textos, en
-- 2026-11-18-textos-que-se-adaptan-textos.md).
--
-- Una tienda de ropa con Correa decía "Carteras para todos los días". Las
-- semillas de las catorce plantillas pasan a textos que sirven para cualquier
-- producto, con la voz de cada una.
--
-- 1. Las semillas (`template_pages`): lo que reciben las tiendas nuevas.
-- 2. Las tiendas que ya existen, pero solo en los textos que siguen idénticos a
--    la semilla vieja: campo por campo y con igualdad exacta. Lo que la persona
--    escribió no se toca, ni una palabra. Las tiendas de demostración
--    (`@demo.venduo.bo`) quedan como están. Antes de cambiar, cada tienda
--    tocada guarda una versión: se puede restaurar desde Editar tu tienda.
--
-- Idempotente: ningún texto nuevo es igual a uno viejo, así que la segunda vez
-- no encuentra nada que cambiar.
-- ============================================================================

create temporary table textos_neutros (
  plantilla text not null,
  tipo      text not null,
  campo     text not null,
  viejo     text not null,
  nuevo     text not null
);

insert into textos_neutros (plantilla, tipo, campo, viejo, nuevo) values
  ('fashion', 'hero', 'subtitle',
   'Ropa, calzado y carteras elegidos uno por uno. Pide aquí y coordinamos la entrega por WhatsApp.',
   'Lo nuevo de la temporada, elegido uno por uno. Pide aquí y coordinamos la entrega por WhatsApp.'),

  ('perfume', 'hero', 'title', 'Aromas que se quedan contigo', 'Elegidos para quedarse contigo'),
  ('perfume', 'hero', 'subtitle',
   'Para regalar o para usar todos los días. Si no sabes cuál elegir, escríbenos y te asesoramos.',
   'Para regalar o para ti, todos los días. Si no sabes cuál elegir, escríbenos y te asesoramos.'),

  ('calle', 'hero', 'subtitle',
   'Poleras, buzos y gorras en tandas cortas. Arma tu pedido y lo coordinamos por WhatsApp.',
   'Lo nuevo sale por tandas. Arma tu pedido y lo coordinamos por WhatsApp.'),
  ('calle', 'cta', 'title', '¿Dudas con la talla?', '¿No sabes cuál pedir?'),
  ('calle', 'cta', 'body',
   'Escríbenos tu altura y cómo te gusta que te quede: te decimos cuál pedir.',
   'Escríbenos por WhatsApp y te ayudamos a elegir.'),

  ('atelier', 'hero', 'title', 'Piezas para todos los días', 'La colección de la casa'),
  ('atelier', 'hero', 'subtitle',
   'Carteras, bolsos y billeteras elegidos uno por uno. Si quieres verla de cerca, te mandamos más fotos por WhatsApp.',
   'Cada producto, elegido uno por uno. Si quieres verlo de cerca, te enviamos más fotos por WhatsApp.'),
  ('atelier', 'product_grid', 'title', 'Las elegidas', 'La selección de la casa'),
  ('atelier', 'about', 'title', 'Cómo elegimos cada pieza', 'Cómo elegimos lo que vendemos'),
  ('atelier', 'about', 'body',
   'Revisamos costuras, herrajes y forro antes de publicarla. Si una pieza es de segunda mano, te contamos su estado tal como es.',
   'Revisamos cada producto antes de publicarlo. Si tiene algún detalle, te lo contamos tal como es.'),
  ('atelier', 'product_grid', 'title', 'Recién llegadas', 'Recién llegado'),

  ('pisada', 'hero', 'title', 'Nuevos pares', 'Nuevos lanzamientos'),
  ('pisada', 'hero', 'subtitle',
   'Urbanas, running y para todos los días. Pregúntanos tu talla por WhatsApp antes de pedir.',
   'Lo último que entró, con su precio a la vista. Si tienes dudas, pregúntanos por WhatsApp antes de pedir.'),
  ('pisada', 'hero', 'ctaLabel', 'Ver los modelos', 'Ver los lanzamientos'),

  ('formula', 'hero', 'title', 'Aromas de autor', 'Selección de autor'),
  ('formula', 'hero', 'subtitle',
   'Frascos y decants para probar antes de comprometerte con uno. Si no sabes cuál elegir, te asesoramos por WhatsApp.',
   'Cada uno, elegido con calma. Si no sabes cuál elegir, te asesoramos por WhatsApp.'),
  ('formula', 'hero', 'ctaLabel', 'Ver los frascos', 'Ver el catálogo'),
  ('formula', 'categories', 'title', 'Familias', 'Índice'),

  ('bazar', 'hero', 'subtitle',
   'Accesorios, regalos, hogar y tecnología. Si buscas algo que no ves, escríbenos por WhatsApp.',
   'Pasa, mira y elige. Si buscas algo que no ves, escríbenos por WhatsApp.'),

  ('quilate', 'hero', 'title', 'Piezas que se quedan contigo', 'Para mirar de cerca'),
  ('quilate', 'hero', 'subtitle',
   'Aretes, collares y anillos elegidos uno por uno. Si quieres verla de cerca, te mandamos más fotos por WhatsApp.',
   'Cada detalle, a la vista. Si quieres verlo mejor, te enviamos más fotos por WhatsApp.'),
  ('quilate', 'hero', 'ctaLabel', 'Ver las piezas', 'Ver la colección'),
  ('quilate', 'categories', 'title', 'Por dónde la llevas', 'Por categoría'),
  ('quilate', 'product_grid', 'title', 'Recién llegadas', 'Recién llegado'),
  ('quilate', 'cta', 'buttonLabel', 'Ver las piezas', 'Ver la colección'),

  ('probador', 'hero', 'subtitle',
   'Prendas elegidas para el día, la oficina y para salir. Si dudas con la talla, te ayudamos por WhatsApp.',
   'Lo último que entró, elegido con cuidado. Si tienes dudas, te ayudamos por WhatsApp.'),

  ('ambar', 'hero', 'title', 'Perfumes árabes, del decant al frasco', 'Tesoros de la casa'),
  ('ambar', 'hero', 'subtitle',
   'Prueba en decant y quédate con el frasco que te guste.',
   'Mira con calma y quédate con el que te guste.'),
  ('ambar', 'hero', 'ctaLabel', 'Ver los perfumes', 'Ver la colección'),
  ('ambar', 'categories', 'title', 'Por familia', 'Explora la casa'),

  ('correa', 'hero', 'title', 'Carteras para todos los días', 'Color para todos los días'),
  ('correa', 'hero', 'subtitle',
   'De mano, cruzadas y mochilas, en colores que alegran.',
   'Elige tus favoritos y alegra tu día.'),
  ('correa', 'hero', 'ctaLabel', 'Ver las carteras', 'Ver la colección'),
  ('correa', 'categories', 'title', 'Por tamaño', 'Encuentra el tuyo'),
  ('correa', 'cta', 'title', '¿Buscas un color en especial?', '¿Buscas algo en especial?'),

  ('taco', 'hero', 'title', 'nuevos pares', 'nuevos ingresos'),
  ('taco', 'hero', 'subtitle',
   'Sandalias, tacos y botines elegidos par por par.',
   'Elegidos uno a uno, sin apuro.'),
  ('taco', 'hero', 'ctaLabel', 'Ver los modelos', 'Ver lo nuevo'),
  ('taco', 'categories', 'title', 'por tipo de taco', 'por categoría'),

  ('tocador', 'hero', 'title', 'Tu rutina, paso a paso', 'Para consentirte'),
  ('tocador', 'hero', 'subtitle',
   'Skincare y maquillaje para tu piel y tu tono.',
   'Te ayudamos a elegir lo que va contigo.'),
  ('tocador', 'categories', 'title', 'Tu rutina', 'Paso a paso'),

  ('crayon', 'hero', 'title', 'Ropa para crecer jugando', 'Para elegir jugando'),
  ('crayon', 'hero', 'subtitle',
   'Para quienes recién llegan y para quienes ya corren.',
   'Mira lo nuevo, elige tu favorito y pídelo por WhatsApp.'),
  ('crayon', 'hero', 'ctaLabel', 'Ver por edad', 'Ver todo'),
  ('crayon', 'categories', 'title', 'Por edad', '¿Qué buscas hoy?');

-- Las preguntas frecuentes: el arreglo entero, solo si es idéntico al de la
-- semilla.
create temporary table preguntas_neutras (
  plantilla text not null,
  viejo     jsonb not null,
  nuevo     jsonb not null
);

insert into preguntas_neutras (plantilla, viejo, nuevo) values
  ('perfume',
   '[{"question": "¿Cómo recibo mi pedido?", "answer": "Después de confirmar tu pedido, te escribimos por WhatsApp para acordar el lugar y la hora de entrega."}, {"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp contándonos qué aromas te gustan y te recomendamos opciones de la colección."}]',
   '[{"question": "¿Cómo recibo mi pedido?", "answer": "Después de confirmar tu pedido, te escribimos por WhatsApp para acordar el lugar y la hora de entrega."}, {"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp contándonos qué buscas y te recomendamos opciones de la colección."}]'),
  ('pisada',
   '[{"question": "¿Cómo sé mi talla?", "answer": "Escríbenos el largo de tu pie en centímetros o la talla que usas en otra marca, y te decimos cuál pedir."}, {"question": "¿Cómo recibo mi pedido?", "answer": "Después de enviar tu pedido, te escribimos por WhatsApp para acordar el pago, el lugar y la hora de entrega."}]',
   '[{"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp qué buscas y te recomendamos opciones."}, {"question": "¿Cómo recibo mi pedido?", "answer": "Después de enviar tu pedido, te escribimos por WhatsApp para acordar el pago, el lugar y la hora de entrega."}]'),
  ('formula',
   '[{"question": "¿Qué es un decant?", "answer": "Una porción del perfume original pasada a un frasco chico. Sirve para probarlo varios días antes de comprar el frasco entero."}, {"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp qué aromas te gustan y para qué ocasión, y te recomendamos opciones."}]',
   '[{"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}, {"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp qué buscas y para qué ocasión, y te recomendamos opciones."}]'),
  ('probador',
   '[{"question": "¿Cómo sé mi talla?", "answer": "Envíanos tu busto, cintura y cadera en centímetros, o la talla que usas en otra marca, y te decimos cuál pedir."}, {"question": "¿Puedo cambiar una prenda?", "answer": "Sí. Escríbenos por WhatsApp y coordinamos el cambio de talla o de modelo."}, {"question": "¿Cómo recibo mi pedido?", "answer": "Después de enviar tu pedido, te escribimos por WhatsApp para acordar el pago, el lugar y la hora de entrega."}]',
   '[{"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp qué buscas y te recomendamos opciones."}, {"question": "¿Puedo cambiar un producto?", "answer": "Sí. Escríbenos por WhatsApp y coordinamos el cambio."}, {"question": "¿Cómo recibo mi pedido?", "answer": "Después de enviar tu pedido, te escribimos por WhatsApp para acordar el pago, el lugar y la hora de entrega."}]'),
  ('ambar',
   '[{"question": "¿Qué es un decant?", "answer": "Es el mismo perfume, pasado de su frasco original a uno más chico. Sirve para usarlo varios días antes de llevar el frasco entero."}, {"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]',
   '[{"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp qué buscas y te recomendamos opciones."}, {"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]'),
  ('taco',
   '[{"question": "¿Cómo sé mi número?", "answer": "Pon el pie sobre una hoja, marca el talón y la punta del dedo más largo, y mide en centímetros. Envíanos la medida y te decimos qué número te queda."}, {"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]',
   '[{"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp qué buscas y te recomendamos opciones."}, {"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]'),
  ('tocador',
   '[{"question": "¿Cómo elijo mi tono?", "answer": "Envíanos por WhatsApp una foto de tu cara con luz natural y sin filtro, y te recomendamos el tono."}, {"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]',
   '[{"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp qué buscas y te recomendamos opciones."}, {"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]'),
  ('crayon',
   '[{"question": "¿Qué talla elijo?", "answer": "Cada marca talla distinto. Dinos la edad y la estatura de quien la va a usar y te recomendamos la talla."}, {"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]',
   '[{"question": "¿Me pueden ayudar a elegir?", "answer": "Sí. Escríbenos por WhatsApp qué buscas y te recomendamos opciones."}, {"question": "¿Cómo hago mi pedido?", "answer": "Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega."}]');

-- ----------------------------------------------------------------------------
-- 1. Las semillas.
-- ----------------------------------------------------------------------------
do $$
declare
  c record;
begin
  -- Un cambio por vuelta: un mismo bloque puede tener varios (título y
  -- subtítulo), y un `update … from` con varias filas que coinciden aplica
  -- solo una.
  for c in select * from textos_neutros loop
    update public.template_pages tp
       set blocks = (
         select jsonb_agg(
                  case
                    when e->>'block_type_key' = c.tipo
                     and e->'props'->>c.campo = c.viejo
                    then jsonb_set(e, array['props', c.campo], to_jsonb(c.nuevo))
                    else e
                  end
                  order by n)
           from jsonb_array_elements(tp.blocks) with ordinality as x(e, n)
       )
     where tp.template_key = c.plantilla
       and tp.is_home;
  end loop;

  for c in select * from preguntas_neutras loop
    update public.template_pages tp
       set blocks = (
         select jsonb_agg(
                  case
                    when e->>'block_type_key' = 'faq'
                     and e->'props'->'items' = c.viejo
                    then jsonb_set(e, '{props,items}', c.nuevo)
                    else e
                  end
                  order by n)
           from jsonb_array_elements(tp.blocks) with ordinality as x(e, n)
       )
     where tp.template_key = c.plantilla
       and tp.is_home;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Las tiendas que ya existen: solo lo que sigue idéntico a la semilla vieja.
-- ----------------------------------------------------------------------------
create temporary table tiendas_con_textos_viejos as
select distinct sb.store_id as id
  from public.store_blocks sb
  join public.stores s on s.id = sb.store_id
  join auth.users u on u.id = s.owner_id
 where sb.deleted_at is null
   and s.deleted_at is null
   and u.email not ilike '%@demo.venduo.bo'
   and (
     exists (
       select 1 from textos_neutros c
        where c.tipo = sb.block_type_key
          and sb.props->>c.campo = c.viejo
     )
     or exists (
       select 1 from preguntas_neutras c
        where sb.block_type_key = 'faq'
          and sb.props->'items' = c.viejo
     )
   );

do $$
declare
  t record;
  c record;
begin
  -- La versión de antes, una por tienda: si algo no le gusta, la restaura.
  for t in select id from tiendas_con_textos_viejos loop
    perform public.capture_design_version(
      t.id, 'antes_de_publicar', 'Antes de los textos neutros'
    );
  end loop;

  for c in select * from textos_neutros loop
    update public.store_blocks sb
       set props = jsonb_set(sb.props, array[c.campo], to_jsonb(c.nuevo)),
           updated_at = now()
      from public.stores s
     where s.id = sb.store_id
       and sb.store_id in (select id from tiendas_con_textos_viejos)
       and sb.deleted_at is null
       and sb.block_type_key = c.tipo
       and sb.props->>c.campo = c.viejo
       -- "Ver los modelos" era de Pisada y de Taco, con reemplazos distintos:
       -- un texto así se cambia según la plantilla de la tienda. Los demás,
       -- con que coincida alcanza (la tienda pudo cambiar de plantilla y
       -- conservar sus textos).
       and (
         s.template_key = c.plantilla
         or not exists (
           select 1 from textos_neutros otro
            where otro.tipo = c.tipo
              and otro.campo = c.campo
              and otro.viejo = c.viejo
              and otro.nuevo <> c.nuevo
         )
       );
  end loop;

  for c in select * from preguntas_neutras loop
    update public.store_blocks sb
       set props = jsonb_set(sb.props, '{items}', c.nuevo),
           updated_at = now()
     where sb.store_id in (select id from tiendas_con_textos_viejos)
       and sb.deleted_at is null
       and sb.block_type_key = 'faq'
       and sb.props->'items' = c.viejo;
  end loop;
end $$;

drop table if exists textos_neutros, preguntas_neutras, tiendas_con_textos_viejos;
