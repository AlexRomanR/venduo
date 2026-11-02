-- ----------------------------------------------------------------------------
-- Textos de las plantillas, con la voz de la tienda.
--
-- Las portadas que se siembran en template_pages se copian a cada tienda nueva,
-- y algunas traían texto de relleno ("Cuenta aquí…", "Escribe acá…") que
-- quien compra veía tal cual si nadie lo cambiaba, o hablaban de la tienda en
-- tercera persona ("la tienda te escribe"), como si fuera de otro. Se corrigen
-- las semillas y los bloques de las tiendas que ya los copiaron; un bloque que
-- su dueño editó no coincide con la frase y queda como está.
--
-- Solo reemplaza frases exactas: correrla dos veces no cambia nada.
-- ----------------------------------------------------------------------------

do $$
declare
  t record;
begin
  for t in
    select viejo, nuevo from (values
      ('Cuenta aquí de dónde salen tus piezas y cómo las eliges.',
       'Elegimos cada pieza para que dure y se vea bien en tu casa.'),
      ('Cuenta aquí tu historia y tu forma de trabajar.',
       'Hacemos cada mueble a mano, en madera maciza y a tu medida.'),
      ('Después de confirmar tu pedido, la tienda te escribe por WhatsApp para acordar el lugar y la hora de entrega.',
       'Después de confirmar tu pedido, te escribimos por WhatsApp para acordar el lugar y la hora de entrega.'),
      ('Después de mandar tu pedido, la tienda te escribe por WhatsApp para acordar el pago, el lugar y la hora de entrega.',
       'Después de enviar tu pedido, te escribimos por WhatsApp para acordar el pago, el lugar y la hora de entrega.'),
      ('Arma tu pedido y lo cerramos por WhatsApp.',
       'Arma tu pedido y lo coordinamos por WhatsApp.')
    ) as textos (viejo, nuevo)
  loop
    update public.template_pages
       set blocks = replace(blocks::text, t.viejo, t.nuevo)::jsonb
     where strpos(blocks::text, t.viejo) > 0;

    update public.store_blocks
       set props = replace(props::text, t.viejo, t.nuevo)::jsonb,
           updated_at = now()
     where deleted_at is null
       and strpos(props::text, t.viejo) > 0;
  end loop;
end $$;

-- La portada con la que nace la plantilla clásica decía "Lo que hacemos" y
-- "Escribe acá una línea sobre tu negocio.": una instrucción para el dueño que
-- veía quien compra. Pasa a una bienvenida que sirve para cualquier tienda.
update public.template_pages
   set blocks = (
     select jsonb_agg(
              case
                when bloque->>'block_type_key' = 'hero'
                 and bloque->'props'->>'subtitle' = 'Escribe acá una línea sobre tu negocio.'
                then jsonb_set(bloque, '{props}', bloque->'props' || jsonb_build_object(
                       'title', 'Te damos la bienvenida',
                       'subtitle', 'Revisa nuestro catálogo y haz tu pedido por WhatsApp.'))
                else bloque
              end
              order by orden)
       from jsonb_array_elements(blocks) with ordinality as e(bloque, orden)
   )
 where strpos(blocks::text, 'Escribe acá una línea sobre tu negocio.') > 0;

update public.store_blocks
   set props = props || jsonb_build_object(
         'title', 'Te damos la bienvenida',
         'subtitle', 'Revisa nuestro catálogo y haz tu pedido por WhatsApp.'),
       updated_at = now()
 where deleted_at is null
   and block_type_key = 'hero'
   and props->>'title' = 'Lo que hacemos'
   and props->>'subtitle' = 'Escribe acá una línea sobre tu negocio.';
