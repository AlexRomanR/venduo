# Estadísticas que abren con algo

**Pedido**: "Sobre las estadísticas, de preferencia sí, velo cómo mejorar esa vista". Que
abra mostrando algo útil en vez de un campo vacío. "Un tablero fijo puede ser, pero creo
que también el chat con la IA para que genere el gráfico debería ser constante en un
lado, ya sea a la derecha o izquierda, y que ya luego se agregue el gráfico o algo.
También ten en cuenta que cuando abren su tienda por primera vez no tendrán ninguna
estadística ni ningún dato, así que sería bueno poner algo para que no quede vacío."

**Para quién**: quien vende por redes y WhatsApp, mirando cómo le va desde el celular o
la compu.

**Problema**: hoy `/panel/estadisticas` no muestra ni una cifra al entrar: un campo para
preguntarle a la IA, seis sugerencias, una bajada técnica y "Tu tablero" vacío. La
pantalla que se llama Estadísticas no tiene estadísticas hasta que uno pregunta.

**Sale bien si**:

- Al entrar se ve un **tablero fijo** que va **más a fondo que el Resumen** (que queda
  como el vistazo rápido): por ejemplo comparación con el período anterior, lo que se
  gasta en promedio por pedido, ventas por día de la semana, visitas contra pedidos, lo
  más vendido y lo que no se vende. Sin configurar nada.
- **El chat con la IA está siempre a mano, fijo a un lado** (izquierda o derecha en la
  pantalla ancha); lo que arma se agrega al tablero como un gráfico más.
- **Una tienda recién abierta, sin datos, no ve una pantalla vacía**: algo que le
  muestre cómo se va a ver y qué hacer para que se llene.
- Funciona en el celular (375 px), donde "a un lado" no entra: se resuelve en el diseño.
- Va en el cuaderno quieto (`DESIGN.md`).

**Dónde**: web primero; la app después de que se apruebe la web.

**No tiene que romper**: la seguridad de la consulta de la IA (`run_insight_sql`, solo
lectura, vistas `mis_*`, RLS); los gráficos guardados y su PDF
(`/panel/estadisticas/pdf`); el apagado por función (`estadisticas`,
`ia_estadisticas`) del administrador; el modo demo.

**Fuera de alcance**: cambiar el Resumen; datos nuevos que la base no guarda (salvo que el
plan diga que hace falta y se apruebe); la app en esta etapa.

## Decidido (8 de noviembre)

Boceto A del diseñador: tablero fijo con cinco tarjetas —«Contra los N días anteriores»,
«Cuántos pedidos se cobran», «Lo que más te deja», «Lo que no se mueve», «Tus días
fuertes»— más «Tu tablero» con lo guardado; la IA en una columna fija a la derecha desde
1280 px y, por debajo, una bandeja que abre la conversación en una hoja. Sin datos:
«Para que esto se llene» y tarjetas de ejemplo sin cifras con sello «Ejemplo». La línea
de visitas sale (repite el Resumen). Sin migración.

## Tareas

- [x] Lógica pura en `lib/estadisticas.ts` con tests: días fuertes, lo que más deja, lo
      que no se mueve, cuántos se cobran. `npm test` pasa.
- [x] La serie de ventas sale de una sola función usada por el Resumen y Estadísticas.
      Las cifras del Resumen no cambian (test y comparación en demo).
- [x] `getEstadisticas()` en `lib/data/estadisticas.ts`, consultas en paralelo; datos
      de demo en `lib/demo-data.ts`. La página muestra cifras en modo demo.
- [x] Acciones de `estadisticas/acciones.ts` con `exigirFuncion` y `guardar` validado
      con zod. Tipos y lint pasan.
- [x] El tablero fijo y sus estados (con datos, período sin ventas, sin datos con
      ejemplos). Visto a 375 y 1280.
- [x] La IA: columna fija desde 1280, bandeja y hoja por debajo; la conversación no se
      borra al cerrar la hoja; «Agregar a tu tablero». Visto a 375 y 1280.
- [x] IA oculta y desactivada por el administrador. Visto.
- [x] Esqueleto con la forma nueva; documentación al día.

Pendiente fuera de estas tareas: la IA de punta a punta con una tienda real (en modo demo
responde "Todavía no tienes una tienda"), y la app.
