import { diaEnBolivia, sumarDias } from "@/lib/format"
import { limiteParaConcretar } from "@/lib/pedidos"
import { createClient } from "@/lib/supabase/server"
import {
  DIAS_DE_SERIE,
  diasVacios,
  type ProductoVendido,
  type Tablero,
} from "@/lib/tablero"
import { getMiTienda } from "@/lib/data/panel"

/** Hasta dónde se mira para lo más vendido. */
const DIAS_DE_RANKING = 30

/**
 * Lo que muestra el Resumen del panel, más allá de los contadores.
 *
 * Todo sale con la sesión del dueño, así que RLS sigue puesta: el tablero no
 * ve nada que no vea el resto del panel. Los tipos y las cuentas de los
 * períodos están en `lib/tablero.ts`, que también lee el gráfico.
 */
export async function getTablero(): Promise<Tablero | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const tienda = await getMiTienda()
  if (!tienda) return null

  const hoy = diaEnBolivia()
  const primerDia = sumarDias(hoy, -(DIAS_DE_SERIE - 1))
  const desdeRanking = sumarDias(hoy, -(DIAS_DE_RANKING - 1))
  // Bolivia no cambia de hora en el año: el día empieza siempre a las −04:00.
  const inicio = (dia: string) => `${dia}T00:00:00-04:00`

  const [ventas, ultimos, lineas, catalogo, cantidad, pendientes] =
    await Promise.all([
      // Una venta es un pedido pagado, igual que en el resto del panel: un
      // pendiente puede ser un carrito que nunca se mandó por WhatsApp.
      supabase
        .from("orders")
        .select("total_cents, created_at")
        .eq("store_id", tienda.id)
        .eq("status", "pagado")
        .gte("created_at", inicio(primerDia)),
      supabase
        .from("orders")
        .select(
          "id, order_number, buyer_name, buyer_phone, total_cents, status, created_at, order_items(quantity)"
        )
        .eq("store_id", tienda.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("order_items")
        .select(
          "product_id, product_name, quantity, unit_price_cents, products(image_url), orders!inner(status, created_at)"
        )
        .eq("store_id", tienda.id)
        .eq("orders.status", "pagado")
        // La fecha es la del pedido, como en la serie de ventas: la de la
        // línea puede ser otra, y entonces el ranking sumaba meses viejos.
        .gte("orders.created_at", inicio(desdeRanking)),
      // Comparar stock con el umbral es comparar dos columnas, cosa que el
      // filtro de PostgREST no sabe hacer: un catálogo de MVP son decenas.
      supabase
        .from("products")
        .select("id, name, image_url, stock, low_stock_threshold")
        .eq("store_id", tienda.id)
        .eq("is_active", true)
        .is("deleted_at", null),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", tienda.id)
        .is("deleted_at", null),
      // Solo los pendientes dentro del plazo: uno que no se concretó en una
      // semana ya no espera nada de la tienda (`noSeConcreto`).
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", tienda.id)
        .eq("status", "pendiente")
        .gte("created_at", limiteParaConcretar()),
    ])

  // La serie: cada pedido cae en su día de Bolivia.
  const serie = diasVacios(hoy)
  const posicion = new Map(serie.map((dia, indice) => [dia.dia, indice]))
  for (const pedido of ventas.data ?? []) {
    const indice = posicion.get(diaEnBolivia(pedido.created_at))
    if (indice === undefined) continue
    serie[indice].ventasCents += pedido.total_cents
    serie[indice].pedidos += 1
  }

  // Lo más vendido: por producto, o por nombre si el producto ya no existe.
  const porProducto = new Map<string, ProductoVendido>()
  for (const linea of lineas.data ?? []) {
    const clave = linea.product_id ?? `nombre:${linea.product_name}`
    const previo = porProducto.get(clave) ?? {
      id: linea.product_id,
      nombre: linea.product_name,
      foto: linea.products?.image_url ?? null,
      unidades: 0,
      montoCents: 0,
    }
    previo.unidades += linea.quantity
    previo.montoCents += linea.quantity * linea.unit_price_cents
    porProducto.set(clave, previo)
  }
  const masVendidos = [...porProducto.values()]
    .sort((a, b) => b.unidades - a.unidades || b.montoCents - a.montoCents)
    .slice(0, 5)

  const porAcabarse = (catalogo.data ?? [])
    .filter((p) => p.stock <= p.low_stock_threshold)
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      nombre: p.name,
      foto: p.image_url,
      stock: p.stock,
    }))

  const ultimosPedidos = (ultimos.data ?? []).map((pedido) => ({
    id: pedido.id,
    numero: pedido.order_number,
    comprador: pedido.buyer_name,
    telefono: pedido.buyer_phone,
    totalCents: pedido.total_cents,
    estado: pedido.status,
    creado: pedido.created_at,
    articulos: (pedido.order_items ?? []).reduce(
      (total, item) => total + item.quantity,
      0
    ),
  }))

  const personalizada =
    typeof tienda.theme_overrides === "object" &&
    tienda.theme_overrides !== null &&
    Object.keys(tienda.theme_overrides).length > 0

  return {
    hoy,
    serie,
    ultimosPedidos,
    porGestionar: { pendientes: pendientes.count ?? 0 },
    masVendidos,
    porAcabarse,
    pasos: {
      producto: (cantidad.count ?? 0) > 0,
      estilo: Boolean(tienda.logo_url) || personalizada,
      primerPedido: ultimosPedidos.length > 0,
    },
    esDemo: false,
  }
}
