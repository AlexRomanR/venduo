import { cache } from "react"

import {
  COMISIONES_PROMOTOR_DEMO,
  COMPRADORES_DEMO,
  COMPRAS_CON_ENLACE_DEMO,
  ENLACES_DEMO,
} from "@/lib/demo-data"
import {
  censurarTelefono,
  gananciaPorUnidad,
  type Comision,
  type CompraConEnlace,
  type Comprador,
  type Enlace,
  type PerfilPromotor,
} from "@/lib/promotor"
import { createClient } from "@/lib/supabase/server"
import { urlDeProducto } from "@/lib/tienda"
import { resolverImagenProducto } from "@/lib/imagenes-producto"

/**
 * Lo que ve el promotor. Cruza negocios por naturaleza: nada se resuelve
 * contra `my_store_id()`, todo contra el usuario.
 *
 * Sin Supabase devuelve los datos de ejemplo, para que el panel se vea lleno.
 */

const sesion = cache(async () => {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? { supabase, user } : null
})

export const getMisEnlaces = cache(async (): Promise<Enlace[]> => {
  const supabase = await createClient()
  if (!supabase) {
    return ENLACES_DEMO.map((e) => ({
      ...e,
      url: urlDeProducto(e.negocioSlug, e.productoId, e.codigo),
    }))
  }

  const actual = await sesion()
  if (!actual) return []

  const { data } = await actual.supabase
    .from("seller_products")
    .select(
      "*, products(name, image_url, price_cents, base_cost_cents, take_bps, stock, is_active, seller_enabled, deleted_at), stores(name, slug), store_sellers(referral_code)"
    )
    .eq("user_id", actual.user.id)
    .is("deleted_at", null)
    .order("taken_at", { ascending: false })

  const filas = data ?? []

  // Lo vendido con cada enlace sale de las líneas de sus pedidos: la comisión
  // es por pedido y no dice qué producto la generó.
  const vinculos = [
    ...new Set(filas.map((f) => f.seller_id).filter((id) => id !== null)),
  ]
  const vendido = new Map<string, { unidades: number; cents: number }>()

  if (vinculos.length > 0) {
    const { data: lineas } = await actual.supabase
      .from("order_items")
      .select(
        "product_id, quantity, unit_price_cents, orders!inner(seller_id, status)"
      )
      .in("orders.seller_id", vinculos)
      .neq("orders.status", "cancelado")

    for (const linea of lineas ?? []) {
      if (!linea.product_id) continue
      const previo = vendido.get(linea.product_id) ?? { unidades: 0, cents: 0 }
      vendido.set(linea.product_id, {
        unidades: previo.unidades + linea.quantity,
        cents: previo.cents + linea.quantity * linea.unit_price_cents,
      })
    }
  }

  return filas.map((fila) => {
    const producto = fila.products
    const codigoPropio = (fila as unknown as { referral_code?: unknown })
      .referral_code
    const codigo =
      typeof codigoPropio === "string"
        ? codigoPropio
        : (fila.store_sellers?.referral_code ?? null)
    const slug = fila.stores?.slug ?? ""
    const venta = vendido.get(fila.product_id)

    return {
      id: fila.id,
      productoId: fila.product_id,
      nombre: producto?.name ?? "Producto retirado",
      imagenUrl:
        producto?.image_url ||
        (producto?.name ? resolverImagenProducto(producto.name, null) : null),
      precioCents: producto?.price_cents ?? 0,
      gananciaCents: producto
        ? gananciaPorUnidad(
            producto.price_cents,
            producto.base_cost_cents,
            producto.take_bps
          )
        : 0,
      negocio: fila.stores?.name ?? "Negocio",
      negocioSlug: slug,
      codigo,
      url: urlDeProducto(slug, fila.product_id, codigo),
      tomadoEn: fila.taken_at,
      unidades: venta?.unidades ?? 0,
      ventasCents: venta?.cents ?? 0,
      stock: producto?.stock ?? 0,
      disponible: Boolean(
        producto &&
        producto.is_active &&
        producto.seller_enabled &&
        !producto.deleted_at &&
        producto.stock > 0
      ),
    }
  })
})

export const getMisComisiones = cache(async (): Promise<Comision[]> => {
  const supabase = await createClient()
  if (!supabase) return COMISIONES_PROMOTOR_DEMO

  const actual = await sesion()
  if (!actual) return []

  const { data } = await actual.supabase
    .from("commissions")
    .select(
      "id, store_name, amount_cents, base_amount_cents, rate_bps, status, kind, created_at"
    )
    .eq("seller_user_id", actual.user.id)
    .order("created_at", { ascending: false })
    .limit(1000)

  return (data ?? []).map((c) => ({
    id: c.id,
    negocio: c.store_name,
    montoCents: c.amount_cents,
    baseCents: c.base_amount_cents,
    tasaBps: c.rate_bps,
    estado: c.status,
    tipo: c.kind,
    fecha: c.created_at,
  }))
})

/**
 * Cada compra hecha con uno de sus enlaces, sin las canceladas.
 *
 * RLS ya le deja leer esos pedidos enteros, pero acá se reducen al nombre de
 * pila y al teléfono censurado antes de salir del servidor: el comprador dio
 * sus datos para la entrega, no para que los tenga un tercero.
 */
export const getMisComprasConEnlace = cache(
  async (): Promise<CompraConEnlace[]> => {
    const supabase = await createClient()
    if (!supabase) return COMPRAS_CON_ENLACE_DEMO

    const actual = await sesion()
    if (!actual) return []

    // Filtrar por sus vínculos y no confiar solo en RLS: si además es dueño de
    // un negocio, la política de su tienda le devolvería pedidos sin enlace.
    const { data: vinculos } = await actual.supabase
      .from("store_sellers")
      .select("id")
      .eq("user_id", actual.user.id)
    const ids = (vinculos ?? []).map((v) => v.id)
    if (ids.length === 0) return []

    const [{ data: pedidos }, { data: comisiones }] = await Promise.all([
      actual.supabase
        .from("orders")
        .select(
          "id, created_at, status, total_cents, buyer_name, buyer_phone, stores(name), order_items(product_name, quantity)"
        )
        .in("seller_id", ids)
        .neq("status", "cancelado")
        .order("created_at", { ascending: false })
        .limit(500),
      actual.supabase
        .from("commissions")
        .select("order_id, amount_cents, status")
        .eq("seller_user_id", actual.user.id)
        .eq("kind", "directa"),
    ])

    const porPedido = new Map(
      (comisiones ?? []).map((c) => [
        c.order_id,
        { montoCents: c.amount_cents, estado: c.status },
      ])
    )
    const claves = new Map<string, string>()

    return (pedidos ?? []).map((p) => {
      const llave = p.buyer_phone.replace(/\D/g, "")
      if (!claves.has(llave)) claves.set(llave, `c${claves.size + 1}`)

      return {
        id: p.id,
        compradorClave: claves.get(llave) ?? p.id,
        comprador: p.buyer_name.trim().split(/\s+/)[0] || "Comprador",
        telefono: censurarTelefono(p.buyer_phone),
        fecha: p.created_at,
        negocio: p.stores?.name ?? "Negocio",
        productos: p.order_items
          .map((i) =>
            i.quantity > 1 ? `${i.product_name} ×${i.quantity}` : i.product_name
          )
          .join(", "),
        totalCents: p.total_cents,
        estado: p.status,
        comision: porPedido.get(p.id) ?? null,
      }
    })
  }
)

/**
 * Los compradores que trajo.
 *
 * Pasa por `mis_compradores()` porque la atribución guarda el teléfono
 * completo y no tiene políticas: la función lo devuelve censurado, salvo que
 * sea de alguien con cuenta en Venduo.
 */
export const getMisCompradores = cache(async (): Promise<Comprador[]> => {
  const supabase = await createClient()
  if (!supabase) return COMPRADORES_DEMO

  const actual = await sesion()
  if (!actual) return []

  const { data } = await actual.supabase.rpc("mis_compradores")

  return (data ?? []).map((c) => ({
    id: c.id,
    comprador: c.comprador,
    registrado: c.registrado,
    desde: c.desde,
    vence: c.vence,
    vigente: c.vigente,
    primeraTienda: c.primera_tienda,
    primeraCompraCents: c.primera_compra_cents ?? 0,
    comprasIndirectas: c.compras_indirectas ?? 0,
    comisionIndirectaCents: c.comision_indirecta_cents ?? 0,
  }))
})

export const getPerfilPromotor = cache(async (): Promise<PerfilPromotor> => {
  const supabase = await createClient()
  if (!supabase) return { nombre: "Ana Mamani", slug: null }

  const actual = await sesion()
  if (!actual) return { nombre: "Promotor", slug: null }

  const [perfil, publico] = await Promise.all([
    actual.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", actual.user.id)
      .maybeSingle(),
    actual.supabase
      .from("seller_profiles")
      .select("slug, display_name")
      .eq("user_id", actual.user.id)
      .is("deleted_at", null)
      .maybeSingle(),
  ])

  return {
    nombre:
      publico.data?.display_name?.trim() ||
      perfil.data?.full_name?.trim() ||
      actual.user.email?.split("@")[0] ||
      "Promotor",
    slug: publico.data?.slug ?? null,
  }
})
