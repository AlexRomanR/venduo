# Apariencia: la pasarela de plantillas

**Pedido**: "¿Sería bueno que el panel de apariencia sea como una pasarela?". Se acordó
dejar la rejilla y hacer la pasarela dentro de la hoja: pasar de una plantilla a otra sin
cerrarla, y ver cada una con la tienda de la persona adentro.

**Para quién**: quien vende y duda entre plantillas.

**Problema**: la hoja de una plantilla muestra una miniatura genérica —"TU TIENDA" con
cajas grises— y para ver otra hay que cerrarla y tocar otra celda. Decidir con cajas
grises es adivinar.

**Sale bien si**:

- En la hoja se pasa a la plantilla anterior o siguiente con flechas y deslizando, sin
  cerrarla; se sabe en cuál se está ("2 de 6").
- Cada plantilla se ve con lo de la tienda: su nombre, sus productos con sus fotos y
  precios, y su logo si tiene. Que se reconozca "esta es mi tienda en Calle".
- No se vuelve lenta: abrir la hoja y pasar de una a otra responde enseguida.
- "Usar X", la elección de portada y la confirmación siguen igual.
- Cuaderno quieto, 375 y 1280 px; el movimiento al deslizar respeta Reducir movimiento.

**Dónde**: web; la app después de aprobar.

**No tiene que romper**: el cambio de plantilla (`cambiarPlantilla`, guarda la versión
anterior), el apagado por el administrador, el modo demo, el peso de la pantalla (las
definiciones de plantilla no viajan al navegador).

**Fuera de alcance**: cambiar las plantillas mismas; editar desde la hoja (eso es el
editor); la base.

## Decidido (8 de noviembre)

Camino A: el mismo dibujo 4:3 por plantilla, con datos opcionales de la tienda (nombre o
logo, portada, tres productos con foto y precio en etiqueta); sin datos, igual que hoy.
Una sola hoja con la pasarela. Rejilla y «Tu plantilla» también con datos.

## Tareas

- [x] `Miniatura` con `datos` opcionales; sin datos, idéntica (alta y /admin igual).
- [x] Datos de la tienda en `getAparienciaDeMiTienda`, en la misma tanda; demo con
      productos de ejemplo.
- [x] Una sola hoja con la pasarela: flechas, deslizar, ←/→ en la franja, «2 de 6»,
      bloqueo mientras cambia, portada vuelve a «Conservar la mía».
- [x] La página arma las miniaturas con datos. Visto a 375 y 1280; precio legible.
- [x] Documentación.
