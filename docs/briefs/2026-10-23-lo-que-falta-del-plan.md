# Lo que falta del plan

**Pedido**: "hagamos lo que falta" del plan de la competencia (16 de octubre): nota interna
en el pedido, exportar pedidos y productos a planilla, tienda en pausa por vacaciones y
cargar productos más rápido. Para la carga: "una opción para analizar también el csv,
excel, la planilla o un cuaderno (fotos) donde estén los productos anotados… como no
sabemos cómo tiene la información guardada el usuario, es mejor usar la IA para analizar
y transportar esa información correctamente… si ves que podemos mejorar algo más para que
sea más accesible y fácil cargar productos, me avisas".

**Para quién**: quien vende, en el panel de la web y después en la app.

**Problema**:

- Lo que se acuerda en el chat ("entrega el sábado", "pagó la mitad") no queda en ningún
  lado del pedido.
- Sus pedidos y productos no se pueden sacar a una planilla.
- Para irse de vacaciones hay que despublicar la tienda, o seguir recibiendo pedidos que
  no se pueden atender.
- Cargar 40 productos uno por uno es donde muchos abandonan, y cada quien tiene su lista
  guardada distinto: fotos sueltas, una planilla con sus propias columnas, un cuaderno.

**Sale bien si**:

1. **Nota interna**: se escribe en el detalle de cualquier pedido y como fila opcional en
   Nueva venta; se ve en una línea en la lista de pedidos. Solo la ve la tienda: nunca
   quien compra ni el mensaje de WhatsApp.
2. **Exportar**: pedidos y productos a una planilla que abre Excel y Google Sheets, con
   los montos en bolivianos legibles.
3. **Pausa por vacaciones**: la tienda se sigue viendo, con un aviso ("Estamos de
   vacaciones, volvemos el 5 de enero") y sin poder mandar pedidos —también lo rechaza la
   base—. Fecha de vuelta opcional: ese día se reactiva sola. No es la suspensión que
   aplica el administrador.
4. **Carga rápida con IA**: se sube lo que se tenga —fotos de productos, una planilla
   (CSV o Excel) con cualquier orden de columnas, o la foto de un cuaderno con la lista—
   y la IA lo convierte en borradores de productos; la persona los revisa, corrige y
   confirma, y recién entonces se crean. La IA propone, el sistema valida.

**Dónde**: las cuatro en la web primero, una por una; con el visto bueno, en la app.

**No tiene que romper**: `create_order` y el carrito de las tiendas que no están en
pausa; el stock; la suspensión del administrador; el límite de uso de la IA
(`permisoDeIa`) y las funciones que se apagan (`exigirFuncion`).

**Fuera de alcance**: datos de quien compra (la nota es libre, de la tienda); importar
pedidos; editar productos en masa desde la planilla (solo se crean); cobro de la
suscripción.

## Decisiones de la pausa

- **Nota**: un texto de hasta 500 caracteres, sin historial. Fila "Nota" en el detalle
  (con el texto completo debajo), fila opcional en Nueva venta, una línea en la lista.
  Nueva venta guarda la nota con un `update` después de `registrar_venta`.
- **Descargar**: Excel `.xlsx`, sin dependencias nuevas si se puede. Pedidos en dos hojas
  ("Pedidos", una fila por pedido; "Detalle", una por producto vendido) con período en
  una hoja (Este mes / Mes pasado / Todo); productos directo. Rutas fuera de
  `/panel/pedidos` y `/panel/productos` (los captura la app). Andan con la tienda
  bloqueada. Paginar: PostgREST corta en 1000.
- **Vacaciones** (no "pausa": "Pausada" es la suspensión del administrador): panel
  propio en `/cuenta` con `Palanca` y fecha de vuelta opcional; franja en el Resumen
  con "Reactivar"; banda en la tienda (común a las plantillas), la ficha y el carrito
  sin pedir; la base lo rechaza con un disparador sobre `orders` (solo origen tienda:
  la venta directa sigue). Se reactiva sola, calculado al leer en hora de Bolivia.
- **Carga rápida**: `/panel/productos/cargar`; tres puertas (fotos, planilla, lista
  escrita o pegada); la planilla solo pide a la IA el mapeo de columnas y funciona sin
  IA; borradores sin precio esperan; categorías nuevas se crean al confirmar; stock 1
  por defecto en fotos; planilla modelo. La capa de IA aprende a recibir imágenes.
  Función `ia_productos`. Para otra vuelta: "Foto y precio" en serie, duplicar producto.
- **Suspensión**: la base rechaza que el dueño cambie `suspended_at`, `closed_at` o
  `moderated_at`.

## Tareas

- [x] Migración de la suspensión, con pgTAP.
- [x] Nota: migración y pgTAP; datos, acción, detalle, Nueva venta y lista.
- [x] Descargar: escritor de xlsx con test; rutas de pedidos y productos; enlaces y hoja.
- [x] Vacaciones: migración y pgTAP; lógica con test; tienda, carrito y error; panel.
- [x] IA con imágenes en los adaptadores; esquemas, tareas y mock.
- [x] Lector de planillas y mapeo con tests; crear productos en lote.
- [x] Pantalla de carga: puertas, procesar, revisión, crear; Productos vacío.
- [x] Documentos, privacidad, estado; `npm run check` y `test:db` en verde. El build, en el CI.
- [x] `db push` de las cuatro migraciones (23/10), tipos iguales a los de producción.
- [x] Probar con una tienda real: guardar la nota, la ficha y el carrito de vacaciones, `/cuenta` y la franja del Resumen.
