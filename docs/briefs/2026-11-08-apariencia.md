# Apariencia, corta y clara

**Pedido**: de la revisión general, "Apariencia es muy larga". El dueño eligió seguir con
"la que veas mejor" y delegó el cómo.

**Para quién**: quien vende y quiere cambiar cómo se ve su tienda: abrir el editor, ver
su plantilla, probar otra, volver atrás.

**Problema**: `/panel/apariencia` mide unos 5.700 px de alto en el celular y 3.500 en la
compu. "Cambia de plantilla" muestra las siete plantillas desplegadas, cada una con su
miniatura grande, su descripción, tres características y su botón. Lo que se usa todos
los días —abrir el editor— queda arriba, pero lo demás obliga a recorrer páginas de
plantillas que casi nunca se cambian.

**Sale bien si**:

- La pantalla se recorre de un vistazo: abrir el editor, tu plantilla, cambiar de
  plantilla, el historial.
- Las otras plantillas se pueden comparar sin leer siete fichas largas: forma compacta
  (franja que se desliza o grilla de columnas iguales, nunca fichas que bajan de renglón
  a su ancho), y el detalle de una se ve solo si se pide.
- Cambiar de plantilla sigue preguntando antes y guardando la versión anterior.
- Va en el cuaderno quieto (`DESIGN.md`), a 375 y 1280 px.

**Dónde**: web; la app después de aprobar.

**No tiene que romper**: el cambio de plantilla y su confirmación (`cambiar-plantilla.tsx`),
el historial con **Restaurar** (`restaurar-version.tsx`), el apagado del editor por el
administrador (`funciones.editor`), el modo demo.

**Fuera de alcance**: el editor de la tienda (`/editor`), la base, nuevas plantillas.

## Decidido y hecho (8 de noviembre)

Rejilla de columnas iguales (2 en el celular, 3 desde 40rem) con la hoja de detalle y
«Usar X»; «Tu plantilla» con el editor en una tarjeta; historial con las tres últimas y
el resto a pedido. Alto: 1.520 px a 390 y 1.510 a 1280, antes 5.700 y 3.500. La app,
cuando se apruebe la web.
