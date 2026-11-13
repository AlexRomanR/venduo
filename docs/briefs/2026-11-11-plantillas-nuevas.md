# Siete plantillas nuevas

**Pedido**: "necesito que me crees más plantillas enfocadas en ropa, perfumes, carteras,
zapatos, etc. Necesito que haya más opciones."
**Para quién**: quien abre su tienda y elige plantilla en el alta (`/crear/plantilla`), o
la cambia desde "Editar tu tienda". Vende por TikTok, Instagram y WhatsApp, desde el
celular.
**Problema**: hay siete plantillas y casi una sola por rubro —Pasarela y Calle (ropa),
Atelier (carteras), Pisada (zapatillas), Esencia y Fórmula (perfumes), Bazar—. Quien no se
ve en la de su rubro no tiene otra, y hay rubros que venden mucho por redes sin plantilla
propia.
**Sale bien si**:

- Hay **siete plantillas nuevas, cada una con diseño propio** —su cabecera, su portada, su
  tarjeta de producto, su letra y sus colores, como hoy Calle o Atelier—, no variantes de
  color de las que existen:
  1. Ropa (otra, distinta de Pasarela y de Calle)
  2. Perfumes (otra, distinta de Esencia y de Fórmula)
  3. Carteras (otra, distinta de Atelier)
  4. Zapatos (otra, distinta de Pisada)
  5. Joyería y accesorios (rubro nuevo)
  6. Maquillaje y skincare (rubro nuevo en Belleza)
  7. Ropa de niños y bebés (rubro nuevo)
- En la pasarela se distinguen de un vistazo entre sí y de las siete de hoy.
- Cada una pasa los contrastes del sistema y se ve bien con y sin fotos, a 375 y 1280 px.
- Aparecen en el alta, en "Editar tu tienda", en el editor, en los catálogos en PDF (su
  letra) y en la app (su miniatura).

**Dónde**: web. La app las recibe por la API: necesita su miniatura y su captura de
celular, no código nuevo.
**No tiene que romper**: las siete plantillas de hoy ni las tiendas que las usan; el
editor; cambiar de plantilla; el catálogo en PDF con la letra de la tienda; el modo demo.
**Fuera de alcance**: variantes de color de las existentes; tipos de bloque nuevos;
rubros fuera de moda y belleza (tecnología, hogar, comida).

## Decisiones del dueño (11 de noviembre)

1. Cuántas: una más por rubro —ropa, perfumes, carteras, zapatos—.
2. Además: joyería y accesorios, maquillaje y skincare, ropa de niños y bebés.
3. Qué tan nuevas: diseño propio cada una.
4. El alta se subió antes al PR #44; las plantillas van en su rama y su PR.

Los estilos se le muestran dibujados antes de construir: no elige bien solo con texto.

## Aprobado (12 de noviembre)

El dueño aprobó las siete direcciones dibujadas (artifact "Siete plantillas nuevas"):
Probador, Ámbar, Correa, Taco, Quilate, Tocador y Crayón, con los tokens y las piezas del
diseñador. Por defecto, lo que quedó abierto: rubros nuevos `joyeria` ("Joyas") y `ninos`
("Niños"); Tocador numera las categorías como rutina; primera tanda Quilate y Probador.
Rama `siete-plantillas`.

## Tareas — tanda 1 (Quilate y Probador)

- [x] 1. Fuentes Marcellus y Gloock: woff2 en `lib/fuentes`, `FUENTES`, TTF del PDF y sus
      métricas. Comprobación: `npm run check`; la letra se ve en el editor.
- [x] 2. Piezas compartidas: `OpcionesDeVitrina` (tallas en la tarjeta) y `Plegable` en
      `paginasDeKit`. Comprobación: las plantillas de hoy no cambian.
- [x] 3. `lib/plantillas/quilate.ts` y `probador.ts`, registradas.
- [x] 4. Los dos kits. Comprobación: modo demo a 375 y 1280, portada, catálogo, ficha, carrito.
- [x] 5. Miniaturas, ejemplos con fotos verificadas, demo, catálogo PDF, portada de Venduo.
- [x] 6. Fichas del alta con `GRILLA_DE_FICHAS`.
- [x] 7. Migración (rubros y plantillas) probada en local con `test:db` y `create_store`.
- [x] 8. Capturas de galería y de celular.

## Cómo quedó la tanda 1 (12 de noviembre)

- Dos tiendas de prueba en la base local (`quilate@local.venduo.bo`,
  `probador@local.venduo.bo`) con categorías, dos fotos por producto y tallas con una
  agotada: portada, catálogo, ficha con el plegable y carrito a 375 y 1280 px, sin
  desborde. La tienda de Calle, igual que antes.
- Alta con una cuenta nueva a 375 px: rubro "Joyas", "Crear mi tienda con Quilate", la
  tienda nace con Quilate y sus 4 bloques.
- Miniaturas con y sin datos en Apariencia; capturas de galería y de celular en
  `public/plantillas`.
- `test:db` (99) sobre la base local con la migración, `tsc`, `eslint` y `vitest` (109).
- Fotos de ejemplo de Unsplash, miradas una por una. Probador no trae segunda foto en los
  ejemplos: no había una de la misma prenda.
- Sin probar: la migración en producción (espera el visto bueno de los textos), el PDF
  con Marcellus y Gloock, y la app.

## Tanda 2 (13 de noviembre): Ámbar, Correa, Taco, Tocador y Crayón

- [x] 1. Letras Reem Kufi 600, Syne 700, Fraunces 600 SOFT y Fredoka 600 (estáticas, con
      todas las tildes); Taco reusa Jost 500.
- [x] 2. `OpcionesDeVitrina` con puntos de foto o color, "N tonos" y el rango "Tallas 2 a
      6"; `respaldo`; el plegable con condición; `preguntasPlegadas`.
- [x] 3. Las cinco bases y sus kits.
- [x] 4. Miniaturas con y sin datos, ejemplos con fotos miradas, demo, PDF, portada.
- [x] 5. Migración (rubro `ninos` y las cinco) probada en local: `test:db` (99) y
      `create_store` con Crayón desde el alta.
- [x] 6. Capturas de galería y de celular.

Cómo quedó: cinco tiendas de prueba en la base local (`ambar@`, `correa@`, `taco@`,
`tocador@` y `crayon@local.venduo.bo`) con variantes y un valor agotado; portada,
catálogo, ficha con su plegable y carrito a 375 y 1280 px, sin desborde. Cambios sobre el
boceto: los dos botones de los cierres de Correa y Crayón se apilan en el celular (lado a
lado no entraban); Tocador no trae plegable en la ficha. Las fotos de los perfumes de
Fórmula tenían marcas a la vista: Ámbar usa frascos árabes y viales de aceite.
