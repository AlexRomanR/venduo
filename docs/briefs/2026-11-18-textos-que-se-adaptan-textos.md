# Textos neutros (A) y la propuesta de la IA (B): lo que escribió el diseñador

Complementa `2026-11-18-textos-que-se-adaptan.md`.

## Reglas para todas las plantillas

- **Conteos.** "pieza/frasco/par/modelo/prenda/perfume" pasan a "producto/productos".
- **Género.** "Agotada", "Ver todas", "Agrégala" y "Recién llegadas" pasan a masculino o
  neutro.
- **Preguntas de la semilla.** Las que nombran el rubro (talla, número, tono, decant) pasan
  a "¿Me pueden ayudar a elegir?" / "Sí. Escríbenos por WhatsApp qué buscas y te
  recomendamos opciones."
- **Plegables del rubro que hoy se ven siempre.** No se borran: pasan a ser condicionales,
  con su texto igual.
  - Probador y Crayón: solo si el producto tiene la opción Talla.
  - Taco: solo si tiene Número o Talla.
  - Quilate ("Cuidados"): solo si `materialDe` reconoce un material.
  - Ámbar (el decant): ya era condicional y queda igual.
- **`textos.estado`** (`comunes/paginas.tsx:71`) no se usa: se borra.
- **Miniatura.** Se neutraliza lo que se dibuja también con los datos de la tienda. Las
  muestras condicionales que solo salen sin datos (tallas, números, tonos) se quedan.
- Largos máximos: título 120, subtítulo 240, botón 40.

## Pasarela (fashion)

| Dónde                     | Hoy                                                                                             | Nuevo                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| hero.subtitle             | Ropa, calzado y carteras elegidos uno por uno. Pide aquí y coordinamos la entrega por WhatsApp. | Lo nuevo de la temporada, elegido uno por uno. Pide aquí y coordinamos la entrega por WhatsApp. |
| `fashion/paginas.tsx:145` | ¿Dudas con una talla? Escríbenos                                                                | ¿Tienes dudas? Escríbenos                                                                       |
| `fashion/paginas.tsx:218` | Ninguna prenda coincide con lo que elegiste. Prueba con otro filtro o ve todo el catálogo.      | Nada coincide con lo que elegiste. Prueba con otro filtro o ve todo el catálogo.                |
| `fashion/paginas.tsx:370` | ¿Dudas con la talla o el color? Pregúntanos                                                     | ¿Tienes una duda? Pregúntanos                                                                   |
| `fashion/paginas.tsx:391` | Agrégala al carrito y envíanos…                                                                 | Agrégalo al carrito y envíanos tu pedido por WhatsApp. Ahí coordinamos el pago y la entrega.    |

## Esencia (perfume)

| Dónde                     | Hoy                                                                                           | Nuevo                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| hero.title                | Aromas que se quedan contigo                                                                  | Elegidos para quedarse contigo                                                                 |
| hero.subtitle             | Para regalar o para usar todos los días. Si no sabes cuál elegir, escríbenos y te asesoramos. | Para regalar o para ti, todos los días. Si no sabes cuál elegir, escríbenos y te asesoramos.   |
| faq.items[1].answer       | …contándonos qué aromas te gustan…                                                            | Sí. Escríbenos por WhatsApp contándonos qué buscas y te recomendamos opciones de la colección. |
| `perfume/bloques.tsx:183` | pieza / piezas                                                                                | producto / productos                                                                           |
| `perfume/paginas.tsx:309` | Familia                                                                                       | Categoría                                                                                      |
| `perfume/paginas.tsx:312` | Sin familia                                                                                   | Sin categoría                                                                                  |
| `miniatura.tsx:346`       | Aromas que se quedan contigo                                                                  | Elegidos para quedarse contigo                                                                 |

## Calle

| Dónde                     | Hoy                                                                                     | Nuevo                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| hero.subtitle             | Poleras, buzos y gorras en tandas cortas. Arma tu pedido y lo coordinamos por WhatsApp. | Lo nuevo sale por tandas. Arma tu pedido y lo coordinamos por WhatsApp.         |
| cta.title                 | ¿Dudas con la talla?                                                                    | ¿No sabes cuál pedir?                                                           |
| cta.body                  | Escríbenos tu altura y cómo te gusta que te quede: te decimos cuál pedir.               | Escríbenos por WhatsApp y te ayudamos a elegir.                                 |
| `calle/piezas.tsx:242`    | …ahí coordinamos la talla, el pago y la entrega.                                        | Arma tu pedido y envíanoslo por WhatsApp: ahí coordinamos el pago y la entrega. |
| `calle/index.ts` consulta | ¿Dudas con la talla? Pregúntanos                                                        | ¿Tienes dudas? Pregúntanos                                                      |
| `miniatura.tsx:395-397`   | Buzos · Poleras · Gorras                                                                | Lo nuevo · Ofertas · Catálogo                                                   |
| `miniatura.tsx:423-425`   | Drop / nuevo                                                                            | Nueva / tanda                                                                   |

## Atelier

| Dónde                               | Hoy                                                                                                                           | Nuevo                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| hero.title                          | Piezas para todos los días                                                                                                    | La colección de la casa                                                                            |
| hero.subtitle                       | Carteras, bolsos y billeteras elegidos uno por uno. Si quieres verla de cerca, te mandamos más fotos por WhatsApp.            | Cada producto, elegido uno por uno. Si quieres verlo de cerca, te enviamos más fotos por WhatsApp. |
| product_grid (destacados)           | Las elegidas                                                                                                                  | La selección de la casa                                                                            |
| about.title                         | Cómo elegimos cada pieza                                                                                                      | Cómo elegimos lo que vendemos                                                                      |
| about.body                          | Revisamos costuras, herrajes y forro antes de publicarla. Si una pieza es de segunda mano, te contamos su estado tal como es. | Revisamos cada producto antes de publicarlo. Si tiene algún detalle, te lo contamos tal como es.   |
| product_grid (nuevo)                | Recién llegadas                                                                                                               | Recién llegado                                                                                     |
| `atelier/bloques.tsx:149`           | pieza / piezas                                                                                                                | producto / productos                                                                               |
| `atelier/piezas.tsx:70`             | Agotada                                                                                                                       | Agotado                                                                                            |
| `atelier/piezas.tsx:214`            | Elige tus piezas y manda el pedido por WhatsApp. Ahí acordamos el pago y la entrega.                                          | Elige tus favoritos y envíanos el pedido por WhatsApp. Ahí acordamos el pago y la entrega.         |
| `atelier/piezas.tsx:227` y consulta | ¿Quieres más fotos o las medidas? Escríbenos / Pregúntanos                                                                    | ¿Quieres más fotos o detalles? Escríbenos / Pregúntanos                                            |
| `atelier/index.ts` sinResultados    | Ninguna pieza coincide con lo que elegiste. Prueba con otra línea o ve toda la colección.                                     | Nada coincide con lo que elegiste. Prueba con otra línea o ve toda la colección.                   |
| `miniatura.tsx:493-494`             | Carteras · Billeteras                                                                                                         | Lo nuevo · Ofertas                                                                                 |
| `miniatura.tsx:504`                 | Piezas para todos los días                                                                                                    | La colección de la casa                                                                            |

## Pisada

| Dónde                                      | Hoy                                                                                       | Nuevo                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| hero.title                                 | Nuevos pares                                                                              | Nuevos lanzamientos                                                                                      |
| hero.subtitle                              | Urbanas, running y para todos los días. Pregúntanos tu talla por WhatsApp antes de pedir. | Lo último que entró, con su precio a la vista. Si tienes dudas, pregúntanos por WhatsApp antes de pedir. |
| hero.ctaLabel, `pisada/bloques.tsx:37`     | Ver los modelos                                                                           | Ver los lanzamientos                                                                                     |
| faq.items[0]                               | ¿Cómo sé mi talla? / …                                                                    | ¿Me pueden ayudar a elegir? / (respuesta común)                                                          |
| `pisada/bloques.tsx:140`, `piezas.tsx:225` | modelo / modelos                                                                          | producto / productos                                                                                     |
| `pisada/bloques.tsx:165`                   | Modelos                                                                                   | Productos                                                                                                |
| `pisada/piezas.tsx:267` y consulta         | ¿No sabes tu talla? Pregúntanos                                                           | ¿Tienes dudas? Pregúntanos                                                                               |
| `pisada/index.ts` sinProductos             | Los modelos están en camino                                                               | Lo nuevo está en camino                                                                                  |
| `pisada/index.ts` sinResultados            | Ningún modelo coincide…                                                                   | Nada coincide con lo que elegiste. Prueba con otro estilo o ve todo el catálogo.                         |
| `miniatura.tsx:562`                        | Todo · Urbanas · Running · Botas                                                          | Todo · Lo nuevo · Ofertas · Favoritos                                                                    |
| `miniatura.tsx:577-579`                    | Nuevos / pares                                                                            | Nuevos / lanzamientos (si no entra, 6,25cqw)                                                             |
| `miniatura.tsx:582`                        | Ver los modelos                                                                           | Ver los lanzamientos                                                                                     |
| `miniatura.tsx:596`                        | Modelos                                                                                   | Lo nuevo                                                                                                 |

## Fórmula

| Dónde                                       | Hoy                                                                                                                | Nuevo                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| hero.title                                  | Aromas de autor                                                                                                    | Selección de autor                                                                                               |
| hero.subtitle                               | Frascos y decants para probar antes de comprometerte con uno. Si no sabes cuál elegir, te asesoramos por WhatsApp. | Cada uno, elegido con calma. Si no sabes cuál elegir, te asesoramos por WhatsApp.                                |
| hero.ctaLabel, `formula/bloques.tsx:40`     | Ver los frascos                                                                                                    | Ver el catálogo                                                                                                  |
| categories.title, `formula/bloques.tsx:123` | Familias                                                                                                           | Índice                                                                                                           |
| faq.items[0]                                | ¿Qué es un decant? / …                                                                                             | ¿Cómo hago mi pedido? / Arma tu carrito y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega. |
| faq.items[1].answer                         | …qué aromas te gustan y para qué ocasión…                                                                          | Sí. Escríbenos por WhatsApp qué buscas y para qué ocasión, y te recomendamos opciones.                           |
| `formula/bloques.tsx:60`                    | frasco / frascos                                                                                                   | producto / productos                                                                                             |
| `formula/bloques.tsx:165`, `piezas.tsx:217` | Frascos                                                                                                            | Productos                                                                                                        |
| `formula/piezas.tsx:76`                     | Sin familia                                                                                                        | De la casa                                                                                                       |
| `formula/piezas.tsx:221`                    | Familias                                                                                                           | Categorías                                                                                                       |
| `formula/index.ts` sinProductos             | Los frascos están en camino                                                                                        | El catálogo está en camino                                                                                       |
| `formula/index.ts` sinResultados            | Ningún frasco coincide…                                                                                            | Nada coincide con lo que elegiste. Prueba con otra categoría o ve todo el catálogo.                              |
| `miniatura.tsx:652`                         | 12 frascos                                                                                                         | 12 productos                                                                                                     |
| `miniatura.tsx:655`                         | Aromas de autor                                                                                                    | Selección de autor                                                                                               |
| `miniatura.tsx:658`                         | Ver los frascos                                                                                                    | Ver el catálogo                                                                                                  |
| `miniatura.tsx:669`                         | Frascos                                                                                                            | Los más pedidos                                                                                                  |
| `miniatura.tsx:672` (sin datos)             | Amaderado · Cítrico · Floral                                                                                       | Nº 01 · Nº 02 · Nº 03                                                                                            |

## Bazar

| Dónde         | Hoy                                                                                          | Nuevo                                                                   |
| ------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| hero.subtitle | Accesorios, regalos, hogar y tecnología. Si buscas algo que no ves, escríbenos por WhatsApp. | Pasa, mira y elige. Si buscas algo que no ves, escríbenos por WhatsApp. |

## Quilate

| Dónde                                                | Hoy                                                                                                             | Nuevo                                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| hero.title                                           | Piezas que se quedan contigo                                                                                    | Para mirar de cerca                                                                            |
| hero.subtitle                                        | Aretes, collares y anillos elegidos uno por uno. Si quieres verla de cerca, te mandamos más fotos por WhatsApp. | Cada detalle, a la vista. Si quieres verlo mejor, te enviamos más fotos por WhatsApp.          |
| hero.ctaLabel, cta.buttonLabel, `bloques.tsx:40,319` | Ver las piezas                                                                                                  | Ver la colección                                                                               |
| categories.title, `bloques.tsx:191`                  | Por dónde la llevas                                                                                             | Por categoría                                                                                  |
| product_grid.title, `bloques.tsx:230`                | Recién llegadas                                                                                                 | Recién llegado                                                                                 |
| `quilate/bloques.tsx:210`                            | pieza / piezas                                                                                                  | producto / productos                                                                           |
| `quilate/bloques.tsx:232`                            | Ver todas                                                                                                       | Ver todo                                                                                       |
| `quilate/cabecera.tsx:35`                            | Piezas                                                                                                          | Colección                                                                                      |
| `quilate/piezas.tsx:153`                             | Agotada                                                                                                         | Agotado                                                                                        |
| `quilate/piezas.tsx:289`                             | Elige tus piezas y envíanos el pedido…                                                                          | Elige lo que te gusta y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega. |
| `quilate/piezas.tsx:338`                             | Las piezas                                                                                                      | La colección                                                                                   |
| `quilate/index.ts` sinProductos                      | Las piezas están en camino                                                                                      | La colección está en camino                                                                    |
| `quilate/index.ts` consulta                          | ¿Quieres verla de cerca? Pregúntanos                                                                            | ¿Quieres verlo de cerca? Pregúntanos                                                           |
| `quilate/index.ts` sinResultados                     | Ninguna pieza con eso. Prueba con otra categoría o ve todas.                                                    | Nada con eso por ahora. Prueba con otra categoría o ve todo.                                   |
| `miniatura.tsx:802`                                  | Piezas                                                                                                          | Colección                                                                                      |
| `miniatura.tsx:816`                                  | Piezas que se quedan contigo                                                                                    | Para mirar de cerca                                                                            |
| `miniatura.tsx:819`                                  | Ver las piezas                                                                                                  | Ver la colección                                                                               |
| `miniatura.tsx:825`                                  | Recién llegadas                                                                                                 | Recién llegado                                                                                 |

## Probador

| Dónde                                | Hoy                                                                                                     | Nuevo                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| hero.subtitle                        | Prendas elegidas para el día, la oficina y para salir. Si dudas con la talla, te ayudamos por WhatsApp. | Lo último que entró, elegido con cuidado. Si tienes dudas, te ayudamos por WhatsApp.         |
| faq.items[0]                         | ¿Cómo sé mi talla? / …                                                                                  | ¿Me pueden ayudar a elegir? / (respuesta común)                                              |
| faq.items[1]                         | ¿Puedo cambiar una prenda? / …                                                                          | ¿Puedo cambiar un producto? / Sí. Escríbenos por WhatsApp y coordinamos el cambio.           |
| `probador/bloques.tsx:137`           | prenda / prendas                                                                                        | producto / productos                                                                         |
| `probador/piezas.tsx:267`            | Elige tus prendas y tu talla, y envíanos…                                                               | Elige tus favoritos y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega. |
| `probador/piezas.tsx:272` y consulta | ¿Dudas con la talla? (Pregúntanos)                                                                      | ¿Tienes dudas? (Pregúntanos)                                                                 |
| `probador/index.ts` sinResultados    | No hay prendas con eso…                                                                                 | No hay nada con eso. Prueba con otra ocasión o ve toda la colección.                         |

## Ámbar

| Dónde                               | Hoy                                                                  | Nuevo                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| hero.title                          | Perfumes árabes, del decant al frasco                                | Tesoros de la casa                                                                       |
| hero.subtitle                       | Prueba en decant y quédate con el frasco que te guste.               | Mira con calma y quédate con el que te guste.                                            |
| hero.ctaLabel, `bloques.tsx:42,199` | Ver los perfumes                                                     | Ver la colección                                                                         |
| categories.title, `bloques.tsx:111` | Por familia                                                          | Explora la casa                                                                          |
| faq.items[0]                        | ¿Qué es un decant? / …                                               | ¿Me pueden ayudar a elegir? / (respuesta común)                                          |
| `ambar/bloques.tsx:138`             | perfume / perfumes                                                   | producto / productos                                                                     |
| `ambar/piezas.tsx:285`              | Elige tus perfumes, del decant al frasco, y envíanos…                | Elige con calma y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega. |
| `ambar/index.ts` sinProductos       | Los frascos están en camino                                          | La colección está en camino                                                              |
| `ambar/index.ts` sinResultados      | Ningún perfume de esa familia por ahora. Prueba con otra o ve todos. | Nada en esa categoría por ahora. Prueba con otra o ve todo.                              |
| `miniatura.tsx:995`                 | Perfumes árabes, del decant al frasco                                | Tesoros de la casa                                                                       |
| `miniatura.tsx:998`                 | Ver los perfumes                                                     | Ver la colección                                                                         |

## Correa

| Dónde                               | Hoy                                                         | Nuevo                                                                                        |
| ----------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| hero.title                          | Carteras para todos los días                                | Color para todos los días                                                                    |
| hero.subtitle                       | De mano, cruzadas y mochilas, en colores que alegran.       | Elige tus favoritos y alegra tu día.                                                         |
| hero.ctaLabel, `bloques.tsx:40`     | Ver las carteras                                            | Ver la colección                                                                             |
| categories.title, `bloques.tsx:133` | Por tamaño                                                  | Encuentra el tuyo                                                                            |
| cta.title                           | ¿Buscas un color en especial?                               | ¿Buscas algo en especial?                                                                    |
| `correa/piezas.tsx:148`             | Agotada                                                     | Agotado                                                                                      |
| `correa/piezas.tsx:289`             | Elige tus carteras y su color, y envíanos…                  | Elige tus favoritos y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega. |
| `correa/piezas.tsx:305` y consulta  | ¿Quieres saber las medidas? (Escríbenos / Pregúntanos)      | ¿Quieres saber más? (Escríbenos / Pregúntanos)                                               |
| `correa/index.ts` sinProductos      | Las carteras están en camino                                | Lo nuevo está en camino                                                                      |
| `correa/index.ts` sinResultados     | Ninguna cartera con eso. Prueba con otro tamaño o ve todas. | Nada con eso por ahora. Prueba con otra categoría o ve todo.                                 |
| `miniatura.tsx:1104`                | Carteras para todos los días                                | Color para todos los días                                                                    |
| `miniatura.tsx:1107`                | Ver las carteras                                            | Ver la colección                                                                             |

## Taco (en minúsculas, como hoy)

| Dónde                               | Hoy                                                          | Nuevo                                                                                        |
| ----------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| hero.title                          | nuevos pares                                                 | nuevos ingresos                                                                              |
| hero.subtitle                       | Sandalias, tacos y botines elegidos par por par.             | Elegidos uno a uno, sin apuro.                                                               |
| hero.ctaLabel, `bloques.tsx:38,182` | Ver los modelos                                              | Ver lo nuevo                                                                                 |
| categories.title, `bloques.tsx:90`  | por tipo de taco                                             | por categoría                                                                                |
| faq.items[0]                        | ¿Cómo sé mi número? / …                                      | ¿Me pueden ayudar a elegir? / (respuesta común)                                              |
| `taco/piezas.tsx:93`                | sin números por ahora                                        | agotado por ahora                                                                            |
| `taco/piezas.tsx:236`               | Elige tus pares y tu número, y envíanos…                     | Elige tus favoritos y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega. |
| `taco/piezas.tsx:252` y consulta    | ¿Dudas con tu número? (Escríbenos / Pregúntanos)             | ¿Tienes dudas? (Escríbenos / Pregúntanos)                                                    |
| `taco/index.ts` sinProductos        | los pares están en camino                                    | lo nuevo está en camino                                                                      |
| `taco/index.ts` sinResultados       | Ningún par con eso. Prueba con otro tipo de taco o ve todos. | Nada con eso por ahora. Prueba con otra categoría o ve todo.                                 |
| `miniatura.tsx:1200`                | nuevos pares                                                 | nuevos ingresos                                                                              |
| `miniatura.tsx:1203`                | Ver los modelos                                              | Ver lo nuevo                                                                                 |

## Tocador

| Dónde                               | Hoy                                                | Nuevo                                                                           |
| ----------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| hero.title                          | Tu rutina, paso a paso                             | Para consentirte                                                                |
| hero.subtitle                       | Skincare y maquillaje para tu piel y tu tono.      | Te ayudamos a elegir lo que va contigo.                                         |
| categories.title, `bloques.tsx:90`  | Tu rutina                                          | Paso a paso                                                                     |
| faq.items[0]                        | ¿Cómo elijo mi tono? / …                           | ¿Me pueden ayudar a elegir? / (respuesta común)                                 |
| `tocador/piezas.tsx:65` (WhatsApp)  | Hola {tienda}, quisiera ayuda para elegir mi tono. | Hola {tienda}, quisiera ayuda para elegir.                                      |
| `tocador/piezas.tsx:100` (sello)    | TE AYUDAMOS CON TU TONO ·                          | TE AYUDAMOS A ELEGIR ·                                                          |
| `tocador/piezas.tsx:124` aria-label | Te ayudamos con tu tono por WhatsApp               | Te ayudamos a elegir por WhatsApp                                               |
| `tocador/piezas.tsx:308`            | Arma tu rutina, elige tus tonos y envíanos…        | Arma tu pedido y envíanoslo por WhatsApp. Ahí coordinamos el pago y la entrega. |
| `tocador/piezas.tsx:315` sr-only    | Ayuda con el tono                                  | Ayuda para elegir                                                               |
| `tocador/piezas.tsx:324` y consulta | ¿No sabes tu tono? Mándanos una foto               | ¿No sabes cuál elegir? (Escríbenos / Pregúntanos)                               |
| `tocador/index.ts` sinProductos     | Estamos armando el tocador                         | Estamos preparando todo                                                         |
| `miniatura.tsx:1258`                | Tu rutina, paso a paso                             | Para consentirte                                                                |
| `miniatura.tsx:1273-1275`           | TU / TONO                                          | TE / AYUDAMOS                                                                   |
| `miniatura.tsx:1280`                | 1 Limpiar › 2 Tratar › 3 Hidratar                  | 1 Mira › 2 Elige › 3 Pide                                                       |

## Crayón

| Dónde                              | Hoy                                                      | Nuevo                                                                                              |
| ---------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| hero.title                         | Ropa para crecer jugando                                 | Para elegir jugando                                                                                |
| hero.subtitle                      | Para quienes recién llegan y para quienes ya corren.     | Mira lo nuevo, elige tu favorito y pídelo por WhatsApp.                                            |
| hero.ctaLabel, `bloques.tsx:40`    | Ver por edad                                             | Ver todo                                                                                           |
| categories.title, `bloques.tsx:90` | Por edad                                                 | ¿Qué buscas hoy?                                                                                   |
| faq.items[0]                       | ¿Qué talla elijo? / …                                    | ¿Me pueden ayudar a elegir? / (respuesta común)                                                    |
| `crayon/piezas.tsx:307`            | Elige la ropa y la talla, y envíanos…                    | Elige lo que más te guste y envíanos el pedido por WhatsApp. Ahí coordinamos el pago y la entrega. |
| `crayon/piezas.tsx:323` y consulta | ¿No sabes qué talla? Dinos la edad                       | ¿Tienes dudas? (Escríbenos / Pregúntanos)                                                          |
| `crayon/index.ts` sinProductos     | Estamos doblando la ropita                               | ¡Ya casi está todo listo!                                                                          |
| `crayon/index.ts` sinResultados    | Nada para esa edad por ahora. Prueba con otra o ve todo. | Nada por aquí todavía. Prueba con otra categoría o ve todo.                                        |
| `miniatura.tsx:1343`               | Ropa para crecer jugando                                 | Para elegir jugando                                                                                |
| `miniatura.tsx:1359`               | Ver por edad                                             | Ver todo                                                                                           |
| `miniatura.tsx:1372` (tallímetro)  | 0 a 12 meses · 1 a 3 años · 4 a 8 años                   | Lo nuevo · Favoritos · Ofertas                                                                     |
| `miniatura.tsx:1393` (sin datos)   | 0 a 12 meses…                                            | Tallas 1 a 3 · Tallas 4 a 6 · Tallas 8 a 12                                                        |

## Pistas del editor (`lib/plantillas/secciones.ts`)

| Dónde                              | Hoy                                                                     | Nuevo                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| hero.subtitle `ejemplo` (`:98-99`) | Ropa deportiva elegida una por una. Pide aquí y coordinamos la entrega. | Elegimos cada producto uno por uno. Pide aquí y coordinamos la entrega. |

## Tus datos: la frase corta (`components/cuenta/formularios.tsx:251-253`)

Hoy dice: "Es lo que se lee debajo del nombre de tu tienda." Pasa a: "Una línea sobre tu
negocio. Por ahora no se muestra en tu tienda."

## B en el editor, paso Portada

- **La tarjeta.** Va en `PasoPortada`, debajo de `EncabezadoDePaso` y solo en la lista.
  - Ocupa el lugar de "Que la IA escriba tu portada" mientras haya una propuesta.
  - Es una tarjeta del cuaderno, como `Bienvenida`: el titular lleva el resaltador en "a
    lo que vendes" y el ícono `WandSparkles` en la señal.
  - La pestaña Portada lleva un punto en la señal mientras la propuesta espera.
- **Al abrirla.** Muestra campo por campo el antes tachado y el ahora con el resaltador,
  con el rótulo "{sección} · {campo}".
  - La vista previa muestra la propuesta con el contorno de lo que cambia.
  - "Ver cómo estaba" alterna la vista previa.
  - "Usar estos textos" y "Descartar" van en dos columnas iguales.
- **Aplicar va al borrador, no publica**, como el resto de la IA del editor.
  - Solo cambian los campos que en el borrador siguen iguales al "antes"; se dice
    cuántos se saltaron.
  - Un solo paso de deshacer.
  - Aviso: "Listo, ya están en tu borrador." / "Quien te compra los ve cuando
    publiques.", con la acción Deshacer.
  - La versión del historial se guarda al publicar, con el nombre "Textos adaptados a lo
    que vendes".
- **Estados**:
  - **preparando**: "Estamos adaptando tus textos a lo que vendes", con huesos y la regla
    que avanza; a los 15 s, "Está tardando un poco más. Puedes seguir editando mientras
    tanto.";
  - **lista**: "Te proponemos {n} textos para tu portada." y la cita de la descripción;
  - **aplicada**: "Tus textos nuevos están en tu borrador. Publícalos cuando quieras.";
  - **error**: "No pudimos adaptar tus textos. Tu portada sigue como está." con
    "Inténtalo de nuevo"; la segunda vez, "La IA no responde por ahora.";
  - **sin "Qué vendes"**: "Para escribirlos, cuéntanos qué vendes en la descripción de tu
    tienda." con "Ir a Datos de la tienda";
  - **nada que proponer**: no se dibuja nada.
- **Una propuesta a la vez.** Mientras la tarjeta está abierta, la barra de la IA dice
  "Primero decide sobre tus textos nuevos". Con "Recuperar" pendiente, la tarjeta espera.
- **Movimiento**, solo al tocar: las filas entran de a una y el resaltador se pinta.
  Todo queda quieto con Reducir movimiento.
- **La IA de B** sigue las reglas de A: ningún tipo de producto que no esté en "Qué
  vendes", nada inventado y la voz de la plantilla.
