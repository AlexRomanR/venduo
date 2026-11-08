import { diaEnBolivia, sumarDias } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import {
  cuantosSeCobran,
  limiteParaJuzgar,
  loQueMasDeja,
  loQueNoSeMueve,
  porDiaDeLaSemana,
  type Estadisticas,
  type LineaVendida,
} from "@/lib/estadisticas"
import { armarSerie, cortarPeriodo, totales, type Periodo } from "@/lib/tablero"
import { getMiTienda } from "@/lib/data/panel"

/** Bolivia no cambia de hora en el año: el día empieza siempre a las −04:00. */
const inicio = (dia: string) => `${dia}T00:00:00-04:00`

/**
 * El tablero fijo de Estadísticas para un período: lo que va más a fondo que
 * el Resumen.
 *
 * Todo con la sesión del dueño, así que RLS sigue puesta, y en una sola tanda
 * en paralelo. Una venta es lo mismo que en el Resumen —un pedido pagado,
 * fechado cuando llegó— porque la serie sale de la misma `armarSerie`. Las
 * cuentas están en `lib/estadisticas.ts`.
 *
 * `null` sin Supabase: la página usa entonces la demostración.
 */
export async function getEstadisticas(
  dias: Periodo
): Promise<Estadisticas | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const tienda = await getMiTienda()
  if (!tienda) return null

  const hoy = diaEnBolivia()
  // El período y el anterior, del mismo largo.
  const primerDia = sumarDias(hoy, -(dias * 2 - 1))
  const desde = sumarDias(hoy, -(dias - 1))

  const [ventas, lineas, llegaron, productos, costos, alguna, cuantos] =
    await Promise.all([
      supabase
        .from("orders")
        .select("total_cents, created_at")
        .eq("store_id", tienda.id)
        .eq("status", "pagado")
        .gte("created_at", inicio(primerDia)),
      supabase
        .from("order_items")
        .select(
          "product_id, product_name, quantity, unit_price_cents, unit_cost_cents, products(image_url), orders!inner(status, created_at)"
        )
        .eq("store_id", tienda.id)
        .eq("orders.status", "pagado")
        .gte("orders.created_at", inicio(primerDia)),
      // Todos los que llegaron en el período, de cualquier estado.
      supabase
        .from("orders")
        .select("status, created_at")
        .eq("store_id", tienda.id)
        .gte("created_at", inicio(desde)),
      supabase
        .from("products")
        .select("id, name, image_url, stock, price_cents, created_at")
        .eq("store_id", tienda.id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .is("moderated_at", null),
      supabase
        .from("product_costs")
        .select("product_id, cost_cents")
        .eq("store_id", tienda.id),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", tienda.id)
        .eq("status", "pagado"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", tienda.id)
        .is("deleted_at", null),
    ])

  const vendidas: LineaVendida[] = (lineas.data ?? []).map((linea) => ({
    productoId: linea.product_id,
    nombre: linea.product_name,
    foto: linea.products?.image_url ?? null,
    cantidad: linea.quantity,
    precioCents: linea.unit_price_cents,
    costoCents: linea.unit_cost_cents,
    creado: linea.orders.created_at,
  }))

  const serie = armarSerie(
    hoy,
    ventas.data ?? [],
    vendidas.map((linea) => ({
      quantity: linea.cantidad,
      unit_price_cents: linea.precioCents,
      unit_cost_cents: linea.costoCents,
      creado: linea.creado,
    })),
    dias * 2
  )
  const { actual, anterior } = cortarPeriodo(serie, dias)

  const costoDe = new Map(
    (costos.data ?? []).map((costo) => [costo.product_id, costo.cost_cents])
  )
  const vendidosEnElPeriodo = new Set(
    vendidas
      .filter((linea) => diaEnBolivia(linea.creado) >= desde)
      .flatMap((linea) => (linea.productoId ? [linea.productoId] : []))
  )

  return {
    hoy,
    periodo: {
      dias,
      desde,
      hasta: hoy,
      actual: totales(actual),
      anterior: totales(anterior),
      cobros: cuantosSeCobran(
        (llegaron.data ?? []).map((pedido) => ({
          estado: pedido.status,
          creado: pedido.created_at,
        }))
      ),
      masDeja: loQueMasDeja(vendidas, desde),
      quietos: loQueNoSeMueve(
        (productos.data ?? []).map((producto) => ({
          id: producto.id,
          nombre: producto.name,
          foto: producto.image_url,
          stock: producto.stock,
          precioCents: producto.price_cents,
          costoCents: costoDe.get(producto.id) ?? null,
          creado: producto.created_at,
        })),
        vendidosEnElPeriodo,
        limiteParaJuzgar(hoy, dias)
      ),
      semana: porDiaDeLaSemana(actual),
    },
    vendioAlgunaVez: (alguna.count ?? 0) > 0,
    tieneProductos: (cuantos.count ?? 0) > 0,
    esDemo: false,
  }
}
