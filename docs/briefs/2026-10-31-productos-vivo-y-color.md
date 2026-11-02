# Productos que responden, y el color del panel

**Pedido**: "El tono vino no encaja con la app. Dame una idea o un plan, tal vez basándonos
en la home page que hicimos, más interactiva; sería bueno seguir la filosofía de la
homepage. Propón un diseño cambiando una parte del dashboard, por ejemplo la sección de
productos o catálogos."

**Para quién**: quien vende por redes y maneja su tienda desde el panel (web) y la app,
casi siempre en un Android de gama media.

**Problema**:

- El vino `#5a1f2b`, elegido para la portada, se siente apagado y fuera de lugar en una
  herramienta de todos los días: los botones, contadores y lo elegido del panel pierden
  energía y se confunden con la tinta.
- El panel es correcto pero quieto: cambiar un precio o el stock no se "siente", y no se
  ve cómo queda en la tienda. La portada nueva demostró que una pantalla que responde
  convence más.

**Decisiones de la entrevista**:

1. **Color**: botones y lo elegido en **tinta**; **un solo acento vivo y funcional** para
   lo que pide acción (contadores, avisos, lo urgente). El acento lo propone la
   investigación, probado contra el papel cálido.
2. **Una sola marca**: el acento elegido pasa también a la portada y al toldo del logo
   (reemplaza al vino en todo Venduo).
3. **Pantalla**: Productos (`/panel/productos`), la lista y la ficha del producto.
4. **Alcance de la filosofía**: que la pantalla **responda y se vea viva** —lo que cambias
   se ve al instante como en la tienda, las cifras y el stock se mueven al cambiar, el
   resaltador marca lo importante—, **sin decoración**: nada de celulares flotando ni
   escenas. Sigue siendo una herramienta.

**Sale bien si**:

- El panel se siente de la misma familia que la portada, pero claramente una herramienta.
- El acento se distingue de la tinta de un vistazo y pasa 4,5:1 contra el papel (o se usa
  solo en fondos con texto que sí lo pase).
- En Productos, al cambiar stock o precio se ve la respuesta en el momento, y se puede ver
  cómo queda el producto en la tienda sin salir de la pantalla.
- Funciona igual a 375 px que a 1280 px, y respeta "Reducir movimiento".

**Dónde**: web primero (panel y su versión en el celular). La app (`venduo-app`) recién
cuando se apruebe la web, como pide "web primero, app después".

**No tiene que romper**:

- Las reglas del panel: "pantalla por filas", paneles con borde de `piezas.tsx`, fichas en
  grilla o franja, la barra lateral y las pestañas.
- El stock baja al marcar pagado (lo mueve un disparador); la pantalla nunca ajusta stock
  por su cuenta fuera de lo que ya hace.
- Las tiendas públicas, que usan el color de su plantilla.
- Lo que el administrador apaga (`exigirFuncion`).

**Fuera de alcance**:

- Las demás pantallas del panel (Pedidos, Catálogos, Resumen): vienen después, con lo que
  se aprenda acá. Solo les llega el cambio de color.
- Celulares de muestra, escenas y movimiento con el scroll en el panel.
- Cambios en la base de datos.

## Aprobado (31/10)

Boceto del diseñador, plan del analista. Decisiones de la pausa:

- **Acento**: se compara antes en el panel de demo (frambuesa `#d0216a`, carmín `#c41e3a`,
  violeta `#6d28d9`) con un selector provisorio; se fija el que elija el dueño.
- **Vista previa a 1280 px**: a la izquierda; el formulario a la derecha.
- **Modo demo**: la lista responde (la cifra cambia y las fichas cuentan) y la línea de
  estado dice «Modo demo: no se guarda».
- **Dos tandas**: primero el color en todo Venduo, después Productos.

## Tareas

Tanda 1, el color:

- [x] Token `accion`/`accion-alta` en `globals.css` y en `cssDeApariencia` y
      `variablesEnLinea`; `BOTON_PRIMARIO` a `accion`. Se comprueba: Rosa y Bella con su
      botón de compra azul y oro; el panel con botones en tinta.
- [x] Selector provisorio de acento en el panel de demo. Se comprueba: cambia todo el
      panel al tocarlo.
- [x] El dueño elige frambuesa `#d0216a`; se fija `--senal`, `--senal-alta`, `--toldo` y se
      quita el selector.
- [x] A mano: lo elegido y los rótulos en tinta, el foco de los campos en tinta, colores
      fijos, portada y `npm run marca`.
- [x] Gráficos: serie en tinta, acento en el punto activo.
- [x] Documentación (DESIGN.md, ui-styling.md, marca.md, CLAUDE/AGENTS, estado).

Tanda 2, Productos:

- [ ] `lib/productos/borrador.ts` con test (dinero).
- [ ] Ruta `/editor/vista-previa/producto` y su pieza; funciona en demo.
- [ ] `VistaDeProducto` en la ficha: hoja en el celular, columna izquierda a 1280 px.
- [ ] La lista responde: `Cantidad` de 44 px, cifra que gira, «Guardado», bandas, fichas
      que cuentan sin esperar, demo que responde.
- [ ] Probado a 375 y 1280 px, con «Reducir movimiento», y `impeccable polish`.

## Cambio de pantalla (31/10)

El dueño pidió que el rediseño de la tanda 2 sea **Catálogos** (`/panel/catalogos`, su lista
y su editor) en vez de Productos. Misma filosofía: que responda y se vea vivo, sin
decoración. Productos queda para después. Las tareas de la tanda 2 se reemplazan por las
del plan de Catálogos.

## Tareas de Catálogos (tanda 2)

- [x] Movimiento del panel en `globals.css` (`texto-recien`, `marca-recien`, `hoja-entra`,
      `cambio-entra`, `numero-entra`, `armando-barrido`) y `Recien`/`useRecien`.
- [x] `VistaPrevia` con `vivo`, `soloVer` y `armando` (apagados para la app).
- [x] "Así va quedando" al elegir productos, con la foto que vuela; en el celular, la hoja
      chica en la barra y su hoja. Probado a 1280 y 390 px.
- [x] El probador de plantillas. Probado a 1280 y 390 px.
- [x] Editor: hoja marcada al cambiar, cifras que cuentan, luz al armar el PDF, «Guardar»
      en tinta, "Enlace" y "Verlo" que guardan solos. Probado a 1280 px en demo.
- [x] Lista: mandar por WhatsApp a la vista, «N agotados», recién editado, error de
      lectura. Probado a 1280 y 390 px en demo.
- [ ] Probado con una tienda real (guardar y "Enlace" guardando solo): falta, el demo no
      guarda.
- [ ] La app, cuando se apruebe la web.
