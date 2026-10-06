---
name: pedidos-por-whatsapp
description: >-
  Use this skill when developing or modifying the shopping cart, the order that
  is sent to the store's WhatsApp (create_order, the message and the wa.me
  link), the order states in the panel and how they move stock, or the
  store's mandatory WhatsApp number.
---

# Pedidos por WhatsApp

Es la parte del sistema donde un error no se ve: produce código que compila, parece
andar, y falla en silencio o inventa stock. Las reglas de fondo están en
`.agents/rules/domain-venduo.md`, "El pedido sale por WhatsApp".

---

## Regla número uno: el pedido no se inserta

**`orders` no tiene política de INSERT.** No es un olvido: un comprador anónimo que
pudiera insertar ahí declararía el total que quisiera.

```ts
const { data, error } = await supabase.rpc("create_order", {
  p_store_id: tienda.id, // resuelto en el servidor por el slug, nunca del cliente
  p_items: [{ product_id: id, quantity: 2 }],
})
```

`create_order` recalcula cada precio desde el catálogo, comprueba el stock y que la
tienda tenga WhatsApp, y devuelve `{ id, numero, total_cents, whatsapp, items }`. Llega
como `Json`: **se valida con zod** antes de usarlo (`app/t/[slug]/acciones.ts`).

## Regla número dos: quien compra no deja datos

Ni nombre, ni teléfono, ni correo. Van en el chat. Un campo de formulario en el carrito
contradice la decisión de producto; si una tarea lo pide, se pregunta antes.

## El mensaje y el enlace

- **El mensaje sale de lo que devolvió el servidor**, con `mensajeDePedido` de
  `lib/pedidos.ts`: el número, las líneas y el total. Nunca con los montos del carrito
  del navegador, que pueden estar viejos.
- **El enlace sale de `enlaceDeWhatsApp`**, que pasa por `numeroDeWhatsApp`: un celular
  de 8 cifras necesita el 591 adelante, o `wa.me` abre un chat con nadie. Nunca armar
  `https://wa.me/${numero}` a mano.
- **WhatsApp se abre en una pestaña nueva, abierta en el toque.** La pestaña se abre
  vacía antes de llamar al servidor y recibe el enlace cuando responde: abrirla
  después de esperar no funciona, porque el navegador ya no lo considera un toque y la
  bloquea. Si no se pudo abrir —pasa en navegadores dentro de redes sociales—, se
  navega en la misma con `window.location.href`. Si el pedido falla, se cierra.
- **Antes de abrir el chat** se vacía el carrito y se guarda `{ numero, enlace }` en
  `sessionStorage`: quien vuelve con el botón de atrás ve su pedido y puede volver a
  abrir el chat.

## Los estados y el stock

| Pasa a      | Lo hace el disparador `handle_order_status_change`                     |
| ----------- | ---------------------------------------------------------------------- |
| `pagado`    | Descuenta el stock —o rechaza el cambio si no alcanza— y fecha el pago |
| `cancelado` | Si estaba pagado, devuelve el stock                                    |

Y rechaza lo que no tiene sentido: un cancelado no cambia, un pagado no vuelve a
pendiente. **Nunca tocar `products.stock` desde la aplicación** por un cambio de
estado: el disparador ya lo hace, y duplicarlo inventa stock.

En la pantalla, qué botones ofrecer lo dice `SIGUIENTES` de `lib/pedidos.ts`; los
errores del disparador se traducen en `app/(privado)/panel/pedidos/acciones.ts`.

**Una venta es un pedido pagado.** Todo lo que sume ventas filtra `status = 'pagado'`.

**Un pendiente viejo queda "no concretado", no cancelado.** Pasados `DIAS_PARA_CONCRETAR`
días deja de contar como algo que espera a la tienda, pero se puede seguir marcando
pagado. No hay columna ni tarea programada: todo lo que cuente pendientes que esperan
—la barra, el Resumen, "Por cobrar"— filtra `created_at >= limiteParaConcretar()`, y la
lista usa `noSeConcreto`. Un conteo nuevo de pendientes que se olvide del plazo
vuelve a llenar el panel de rojo con carritos que nunca se mandaron.

## El WhatsApp de la tienda

- Obligatorio en el alta: `crearTiendaSchema` y `create_store(…, p_whatsapp)`.
- Obligatorio en `/cuenta`: `tiendaSchema` no deja guardarlo vacío.
- Se guardan **solo las cifras** (`soloCifras`).
- Una tienda sin número: el carrito no ofrece el botón, `create_order` lo rechaza, y el
  Resumen lo pide primero.

## Verificar

1. Un carrito con dos productos en la tienda pública, a 375 px: se ve el total y el
   botón, y no hay ningún campo de datos.
2. Tocar el botón: abre WhatsApp con el número de la tienda y el pedido escrito.
3. El pedido aparece en `/panel/pedidos` con el mismo número, `pendiente`, y el stock
   no bajó.
4. Marcarlo pagado: el stock baja. Cancelarlo: vuelve.
5. Con una tienda sin WhatsApp: el carrito dice que todavía no recibe pedidos.
6. En modo demo: el botón avisa que la tienda es de ejemplo, sin romper nada.
