import { getCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { getPedidos } from "@/lib/data/pedidos"
import { inicioDelDia } from "@/lib/format"
import {
  limitesDe,
  type PedidoParaPlanilla,
  type Periodo,
  type ProductoParaPlanilla,
} from "@/lib/exportar"
import { createClient } from "@/lib/supabase/server"
import { urlDeProducto } from "@/lib/tienda"

/**
 * Lo que se descarga en planilla. Pagina de a mil: es el tope de filas que
 * devuelve la API de Supabase, y sin paginar una tienda con más pedidos se
 * llevaría una planilla cortada sin saberlo.
 */

const PAGINA = 1000

async function todas<T>(
  pagina: (
    desde: number,
    hasta: number
  ) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const filas: T[] = []
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await pagina(desde, desde + PAGINA - 1)
    if (error) throw new Error("No pudimos leer los datos para la planilla")
    filas.push(...(data ?? []))
    if (!data || data.length < PAGINA) return filas
  }
}

export interface ParaPlanilla<T> {
  filas: T[]
  /** El slug de la tienda, para el nombre del archivo. */
  tienda: string
  esDemo: boolean
}

export async function pedidosParaPlanilla(
  periodo: Periodo,
  ahora: Date = new Date()
): Promise<ParaPlanilla<PedidoParaPlanilla> | null> {
  const { desde, hasta } = limitesDe(periodo, ahora)
  const supabase = await createClient()
  const tienda = supabase ? await getMiTienda() : null

  if (!supabase || !tienda) {
    if (supabase) return null
    // El modo demo descarga los pedidos de ejemplo.
    const { pedidos } = await getPedidos()
    return {
      filas: pedidos.filter(
        (p) =>
          (!desde || p.creado >= inicioDelDia(desde)) &&
          (!hasta || p.creado < inicioDelDia(hasta))
      ),
      tienda: "tienda-de-ejemplo",
      esDemo: true,
    }
  }

  const filas = await todas((inicio, fin) => {
    let consulta = supabase
      .from("orders")
      .select(
        `order_number, status, total_cents, created_at, paid_at, origen, nota,
         order_items ( product_name, variant_name, quantity, unit_price_cents )`
      )
      .eq("store_id", tienda.id)
    if (desde) consulta = consulta.gte("created_at", inicioDelDia(desde))
    if (hasta) consulta = consulta.lt("created_at", inicioDelDia(hasta))
    return consulta
      .order("created_at", { ascending: false })
      .order("id")
      .range(inicio, fin)
  })

  return {
    filas: filas.map((fila) => ({
      numero: fila.order_number,
      creado: fila.created_at,
      pagado: fila.paid_at,
      estado: fila.status,
      directa: fila.origen === "directa",
      totalCents: fila.total_cents,
      nota: fila.nota,
      items: (fila.order_items ?? []).map((item) => ({
        nombre: item.product_name,
        variante: item.variant_name,
        cantidad: item.quantity,
        precioCents: item.unit_price_cents,
      })),
    })),
    tienda: tienda.slug,
    esDemo: false,
  }
}

export async function productosParaPlanilla(): Promise<ParaPlanilla<ProductoParaPlanilla> | null> {
  const supabase = await createClient()
  const tienda = supabase ? await getMiTienda() : null

  if (!supabase || !tienda) {
    if (supabase) return null
    const { productos } = await getCatalogo()
    return {
      filas: productos.map((p) => ({
        nombre: p.name,
        categoria: p.category,
        precioCents: p.price_cents,
        ofertaCents: p.compare_at_price_cents,
        costoCents: null,
        stock: p.stock,
        visible: p.is_active,
        destacado: p.is_featured,
        descripcion: p.description,
        codigo: p.sku,
        enlace: urlDeProducto("tienda-de-ejemplo", p.id),
        variantes: [],
      })),
      tienda: "tienda-de-ejemplo",
      esDemo: true,
    }
  }

  const [productos, variantes, costos] = await Promise.all([
    todas((inicio, fin) =>
      supabase
        .from("products")
        .select(
          "id, name, category, price_cents, compare_at_price_cents, stock, is_active, is_featured, description, sku"
        )
        .eq("store_id", tienda.id)
        .is("deleted_at", null)
        .order("name")
        .order("id")
        .range(inicio, fin)
    ),
    todas((inicio, fin) =>
      supabase
        .from("product_variants")
        .select("id, product_id, nombre, price_cents, stock, sku, position")
        .eq("store_id", tienda.id)
        .is("deleted_at", null)
        .order("position")
        .order("id")
        .range(inicio, fin)
    ),
    todas((inicio, fin) =>
      supabase
        .from("product_costs")
        .select("product_id, cost_cents")
        .eq("store_id", tienda.id)
        .order("product_id")
        .range(inicio, fin)
    ),
  ])

  const costoDe = new Map(costos.map((c) => [c.product_id, c.cost_cents]))

  return {
    filas: productos.map((p) => ({
      nombre: p.name,
      categoria: p.category,
      precioCents: p.price_cents,
      ofertaCents: p.compare_at_price_cents,
      costoCents: costoDe.get(p.id) ?? null,
      stock: p.stock,
      visible: p.is_active,
      destacado: p.is_featured,
      descripcion: p.description,
      codigo: p.sku,
      enlace: urlDeProducto(tienda.slug, p.id),
      variantes: variantes
        .filter((v) => v.product_id === p.id)
        .map((v) => ({
          nombre: v.nombre,
          precioCents: v.price_cents,
          stock: v.stock,
          codigo: v.sku,
        })),
    })),
    tienda: tienda.slug,
    esDemo: false,
  }
}
