---
name: sales-and-commissions
description: >-
  Use this skill when developing or modifying the checkout flow, QR payment,
  referral code tracking, commission calculations and freezing, WhatsApp
  delivery message generation, and the verified seller profile.
---

# Ventas, referidos y comisiones

Es la parte del sistema donde un error no se ve: produce código que compila, parece
andar, y falla en silencio o corrompe el historial de alguien.

---

## Regla número uno: el pedido no se inserta

**`orders` no tiene política de INSERT.** No es un olvido: un comprador anónimo que
pudiera insertar ahí declararía el total que quisiera.

```ts
// MAL — falla en silencio bajo RLS
await supabase.from("orders").insert({ store_id, total_cents, ... })

// MAL — las comisiones las crea un disparador
await supabase.from("commissions").insert({ order_id, amount_cents, ... })
```

El checkout llama a la función del servidor:

```ts
const { data: orderId, error } = await supabase.rpc("create_order", {
  p_store_id: storeId,
  p_buyer_name: nombre,
  p_buyer_phone: telefono, // obligatorio: es el canal de entrega
  p_buyer_email: email || null,
  p_referral_code: codigo || null,
  p_items: items.map((i) => ({ product_id: i.id, quantity: i.cantidad })),
})

if (error) {
  // Los mensajes vienen en español y son mostrables:
  // "Stock insuficiente de Café 250g: quedan 2"
  toast.error(error.message)
  return
}
```

La función, del lado del servidor:

1. Comprueba que la tienda esté viva (`store_is_live`).
2. **Recalcula cada precio desde el catálogo.** El cliente manda qué y cuánto, nunca a cuánto.
3. Valida stock y lo descuenta.
4. Resuelve el código de referido comprobando que sea de **esa** tienda y esté `activo`.
5. Congela `commission_bps` y `commission_cents` en el pedido.

Lo mismo aplica a las otras dos funciones: `join_store(p_store_slug)` para sumarse como
vendedor, y `apply_template(p_store_id, p_template_key)` para sembrar la tienda.

---

## Atribución

El código de referido viaja en la URL del vendedor y se guarda hasta el checkout:

| Situación                           | `orders.seller_id` | Resultado          |
| ----------------------------------- | ------------------ | ------------------ |
| Compra directa desde la tienda      | `null`             | Sin comisión       |
| Compra por el enlace de un vendedor | Su vínculo         | Comisión congelada |

Un solo flujo de compra, dos modelos de negocio. No escribir dos caminos de checkout.

Si el código no corresponde a esa tienda o el vínculo no está activo, la función lo ignora
y la venta queda como directa. No hay error: alguien pudo pegar un código viejo.

`orders.referral_code` guarda el código **copiado como texto**, para que la atribución
sobreviva aunque el vínculo se dé de baja.

---

## Comisiones: el congelamiento

La tasa se lee de `stores.commission_bps` **en el momento de la venta** y se copia. Nunca
se recalcula después.

```ts
// MAL — reescribe la historia cuando la tienda cambia su porcentaje
const comision = (pedido.subtotal_cents * tienda.commission_bps) / 10000

// BIEN — la tasa que valía ese día ya está en el pedido
const comision = pedido.commission_cents
```

Quien vendió con 15% cobra 15%, aunque hoy la tienda pague 10%.

La comisión la crea un **disparador** cuando el pedido pasa a `pagado`. Está protegida por
un índice único sobre `order_id`: un pedido que va y vuelve entre estados no genera
duplicados.

Cancelar un pedido **anula** la comisión y devuelve el stock. Nunca la borra.

Ciclo: `pendiente` → `confirmada` → `pagada`, más `anulada`.

---

## El historial del vendedor

`commissions` guarda `store_name` copiado y su `store_id` es **anulable, no cascada**.
Cuando se purga una tienda, la comisión sobrevive y el historial del vendedor queda
intacto.

Al construir el perfil público en `/v/{slug}`, leer de `commissions` y no de `stores`:
una comisión puede no tener tienda viva detrás, y su vendedor igual merece que se le
cuente esa venta.

Contar solo las `confirmada` y `pagada`. Una `anulada` no es trabajo hecho.

---

## Pago por QR

`lib/qr.ts` expone `toDataURL`, `toSVG`, `toPNGBuffer` y `buildQRTarget`. Ese último arma
el destino según el tipo:

```ts
import { buildQRTarget, toDataURL } from "@/lib/qr"

const url = buildQRTarget("vendedor", getSiteUrl(), codigoDeReferido)
const png = await toDataURL(url)
```

En el MVP la pasarela es **simulada**: el comprador sube el comprobante al bucket
`payment-proofs`, que es privado, y el emprendedor confirma a mano pasando el pedido a
`pagado`. Ese cambio de estado es el que dispara la comisión.

---

## Entrega por WhatsApp

La gestión de envíos está fuera de alcance. La plataforma **arma el mensaje** y abre la
conversación; la coordinación es entre las dos personas.

El teléfono sale de `orders.buyer_phone`, que por eso es obligatorio. **`stores` no tiene
columna de teléfono.**

```ts
const texto = [
  `Hola ${pedido.buyer_name}, soy de ${tienda.name}.`,
  `Tu pedido #${pedido.order_number} por ${formatMoney(pedido.total_cents)}:`,
  ...items.map((i) => `• ${i.quantity}x ${i.product_name}`),
  "¿Cuándo te queda cómodo recibirlo?",
].join("\n")

const enlace = `https://wa.me/${soloDigitos(pedido.buyer_phone)}?text=${encodeURIComponent(texto)}`
```

Montos siempre por `formatMoney`; nunca dividir por 100 a mano.

---

## Verificación

- [ ] El pedido se crea con `create_order`, no con un insert.
- [ ] La comisión sale del pedido, no se recalcula.
- [ ] Un pedido cancelado anula la comisión y devuelve el stock.
- [ ] El código de un vendedor de **otra** tienda no genera comisión.
- [ ] Un pedido sin código queda como venta directa, sin errores.
- [ ] El perfil del vendedor suma comisiones de varias tiendas.
- [ ] Los montos se muestran con `formatMoney`.
