# La app en el cuaderno

**Pedido**: "hagamos ahora la versión móvil con los cambios de diseño de la web, pasemos
todo eso a la app móvil".
**Para quién**: quien vende y usa la app en el celular.
**Problema**: la web pasó sus pantallas de trabajo al cuaderno quieto (7 y 8 de
noviembre); la app sigue con paneles de borde de tinta, esquina viva y sin sombra.
"El celular es uno solo": tienen que verse iguales.
**Sale bien si**: lado a lado —el emulador y la web a 375 px— Pedidos, Productos,
Catálogos, Estadísticas, Apariencia, Compartir, Publicar y la cuenta se ven iguales.
**Dónde**: app (`F:\venduo-app`, rama `color-y-resumen`, encima de lo que ya estaba sin
commitear) y, para Estadísticas, un parámetro aditivo en `GET /api/v1/estadisticas`.
**No tiene que romper**: el Inicio en escenas, los editores, lo que espera la conexión
(stock y estado de pedido), los textos.
**Fuera de alcance**: el ingreso y el alta (siguen en el diario), cambios de base.

Se prueba contra la base local (Docker) y la web local, nunca contra producción.

## Tareas

- [x] 1. Piezas: `NOTA` en hoja; `Seccion` y los paneles de lista como tarjeta (radio
      20, sombra teñida); `SinDatos` en caja punteada con el título a mano; botones,
      fichas e insignias en píldora; hojas y diálogos en hoja con radio; esqueletos con
      radio. Comprobación: Pedidos y Productos en el emulador se ven en tarjetas.
- [x] 2. `FichasGrandes` y `FichasDeCobro` como notas pegadas, lo urgente encerrado a
      mano, la elegida se endereza con borde en tinta.
- [x] 3. Pedidos: la fila es un ticket con talón y sello; tocar "Por cobrar" cobra (con
      confirmación) y "Pagado" se estampa; solo late el más viejo; "Nueva venta" se
      achica al bajar.
- [x] 4. Productos: fotos con radio, más y menos redondos, el número salta; una sola
      franja de filtros (estado y categoría).
- [ ] 4b. La cabecera del detalle de producto como en la web ("Editar producto." y las
      dos acciones en columnas): sin mirar todavía en la app.
- [x] 5. Estadísticas: el tablero fijo (contra el período anterior, cobro, lo que más
      deja, lo que no se mueve, días fuertes) desde `GET /api/v1/estadisticas?dias=`.
- [x] 6. Apariencia: una pasarela, una plantilla a la vez, con la tienda adentro.
- [x] 7. Catálogos, Compartir, Publicar, Tus datos y Datos de la tienda: con las piezas;
      plantillas para empezar plegadas después de 6.
- [x] 8. Lado a lado con la web a 375 px, `npm run check` de los dos repositorios, y
      `docs/estado-del-proyecto.md` 1.c al día.

## Cómo quedó

- Probado en el emulador contra la base local (cuenta `prueba@local.venduo.bo`): cobrar con
  el sello, la estampa, el tablero fijo a 30 días (7 y 90 sin mirar), una pregunta a la IA y
  agregarla al tablero, la pasarela con flechas y con el dedo, y cambiar de plantilla.
- Tus datos y Datos de la tienda se unieron en una pantalla, como `/cuenta` de la web
  (decidido por el dueño el 9 de noviembre). Guardar un panel, probado.
