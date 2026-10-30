"use server"

import { revalidatePath } from "next/cache"

import { aCentavos } from "@/lib/format"
import { createClient, getUsuario } from "@/lib/supabase/server"
import {
  categoriaSchema,
  productoSchema,
  type CategoriaInput,
  type ProductoInput,
} from "@/lib/validation/producto"
import { actualizarVistaDespues } from "@/lib/vista"

export interface Resultado {
  ok: boolean
  error?: string
  id?: string
}

const RUTA = "/panel/productos"

/**
 * Resuelve la tienda de quien está pidiendo.
 *
 * Toda escritura pasa por acá: el `store_id` lo pone el servidor y nunca llega
 * del formulario. Si viniera del cliente, cambiarlo en el navegador escribiría
 * en el catálogo de otro comercio —RLS lo rechazaría, pero el código no debe
 * depender de que la última línea de defensa sea la única.
 */
async function miTienda() {
  const supabase = await createClient()
  if (!supabase) return { supabase: null, tiendaId: null }

  const user = await getUsuario()
  if (!user) return { supabase, tiendaId: null }

  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  return { supabase, tiendaId: data?.id ?? null }
}

/* -------------------------------------------------------------------------
 * Productos
 * ---------------------------------------------------------------------- */

export async function guardarProducto(
  entrada: ProductoInput,
  id?: string
): Promise<Resultado> {
  const validado = productoSchema.safeParse(entrada)
  if (!validado.success) {
    return { ok: false, error: validado.error.issues[0]?.message }
  }

  const { supabase, tiendaId } = await miTienda()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }
  if (!tiendaId) return { ok: false, error: "Todavía no tienes una tienda." }

  const v = validado.data
  const conVariantes = v.opciones.length > 0

  // Sin opciones, las variantes que tuviera se dan de baja primero: recién
  // entonces el producto vuelve a llevar su propio stock y se puede escribir.
  if (id && !conVariantes) {
    const { error } = await supabase.rpc("guardar_variantes", {
      p_producto: id,
      p_opciones: [],
      p_variantes: [],
    })
    if (error) return { ok: false, error: mensajeDeVariantes(error.message) }
  }

  // `image_url` y `category` no se escriben: los deriva el disparador de la
  // base desde `images` y `category_id`, que son la fuente.
  const fila = {
    store_id: tiendaId,
    name: v.nombre,
    description: v.descripcion || null,
    price_cents: aCentavos(v.precio),
    compare_at_price_cents:
      v.precioAnterior === null ? null : aCentavos(v.precioAnterior),
    // Con variantes, el stock es la suma que lleva la base: no se escribe.
    ...(id && conVariantes ? {} : { stock: v.stock }),
    low_stock_threshold: v.avisoStock,
    category_id: v.categoriaId,
    sku: v.sku || null,
    images: v.fotos,
    is_active: v.activo,
    is_featured: v.destacado,
  }

  const respuesta = id
    ? await supabase
        .from("products")
        .update(fila)
        .eq("id", id)
        .eq("store_id", tiendaId)
        .select("id")
        .maybeSingle()
    : await supabase.from("products").insert(fila).select("id").maybeSingle()

  if (respuesta.error) {
    return { ok: false, error: mensajeDeError(respuesta.error.message) }
  }
  if (!respuesta.data) {
    return { ok: false, error: "No encontramos ese producto en tu catálogo." }
  }

  // El costo va en su propia tabla, que solo lee la tienda: en `products` lo
  // vería quien compra. Sin costo queda en null, no se borra la fila.
  if (v.costo !== null || id) {
    const { error } = await supabase.from("product_costs").upsert({
      product_id: respuesta.data.id,
      store_id: tiendaId,
      cost_cents: v.costo === null ? null : aCentavos(v.costo),
    })
    if (error) {
      console.error("[productos] no se pudo guardar el costo:", error)
      return {
        ok: false,
        id: respuesta.data.id,
        error: "Guardamos el producto, pero no su costo. Inténtalo de nuevo.",
      }
    }
  }

  if (conVariantes) {
    const { error } = await supabase.rpc("guardar_variantes", {
      p_producto: respuesta.data.id,
      p_opciones: v.opciones,
      p_variantes: v.variantes.map((variante) => ({
        valores: variante.valores,
        stock: variante.stock,
        price_cents:
          variante.precio === null ? null : aCentavos(variante.precio),
        image_url: variante.imagen,
      })),
    })
    if (error) {
      console.error("[productos] no se guardaron las variantes:", error)
      return {
        ok: false,
        id: respuesta.data.id,
        error: mensajeDeVariantes(error.message),
      }
    }
  }

  revalidatePath(RUTA)
  await actualizarVistaDespues()
  revalidatePath("/panel")
  return { ok: true, id: respuesta.data.id }
}

/** Borrado lógico, como todo en el sistema. */
export async function borrarProducto(id: string): Promise<Resultado> {
  const { supabase, tiendaId } = await miTienda()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }
  if (!tiendaId) return { ok: false, error: "Todavía no tienes una tienda." }

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id)
    .eq("store_id", tiendaId)

  if (error) return { ok: false, error: "No pudimos borrar el producto." }

  revalidatePath(RUTA)
  await actualizarVistaDespues()
  return { ok: true }
}

/** Ajuste rápido de stock desde la lista, sin abrir el formulario. */
export async function ajustarStock(
  id: string,
  stock: number
): Promise<Resultado> {
  if (!Number.isInteger(stock) || stock < 0 || stock > 999_999) {
    return { ok: false, error: "El stock va en unidades enteras." }
  }

  const { supabase, tiendaId } = await miTienda()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }
  if (!tiendaId) return { ok: false, error: "Todavía no tienes una tienda." }

  const { error } = await supabase
    .from("products")
    .update({ stock })
    .eq("id", id)
    .eq("store_id", tiendaId)

  if (error) {
    return {
      ok: false,
      error: /cada variante/i.test(error.message)
        ? "Este producto tiene opciones: cambia el stock de cada una en el producto."
        : "No pudimos guardar el stock.",
    }
  }

  revalidatePath(RUTA)
  // También se repone desde el Resumen, en "Se está acabando".
  revalidatePath("/panel")
  await actualizarVistaDespues()
  return { ok: true }
}

/* -------------------------------------------------------------------------
 * Categorías
 * ---------------------------------------------------------------------- */

export async function guardarCategoria(
  entrada: CategoriaInput,
  id?: string
): Promise<Resultado> {
  const validado = categoriaSchema.safeParse(entrada)
  if (!validado.success) {
    return { ok: false, error: validado.error.issues[0]?.message }
  }

  const { supabase, tiendaId } = await miTienda()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }
  if (!tiendaId) return { ok: false, error: "Todavía no tienes una tienda." }

  const fila = {
    store_id: tiendaId,
    name: validado.data.nombre,
    description: validado.data.descripcion || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = id
    ? await supabase
        .from("product_categories")
        .update(fila)
        .eq("id", id)
        .eq("store_id", tiendaId)
    : await supabase.from("product_categories").insert(fila)

  if (error) return { ok: false, error: mensajeDeError(error.message) }

  revalidatePath(RUTA)
  return { ok: true }
}

/**
 * Borrar una categoría no borra sus productos.
 *
 * `category_id` está declarado `on delete set null`, y el borrado es lógico:
 * los productos quedan sin categoría, visibles y a la venta. Perder el catálogo
 * por reordenar las categorías sería una trampa.
 */
export async function borrarCategoria(id: string): Promise<Resultado> {
  const { supabase, tiendaId } = await miTienda()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }
  if (!tiendaId) return { ok: false, error: "Todavía no tienes una tienda." }

  const { error: errorProductos } = await supabase
    .from("products")
    .update({ category_id: null })
    .eq("category_id", id)
    .eq("store_id", tiendaId)

  if (errorProductos) {
    return {
      ok: false,
      error: "No pudimos borrar la categoría. Inténtalo de nuevo.",
    }
  }

  const { error } = await supabase
    .from("product_categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", tiendaId)

  if (error) return { ok: false, error: "No pudimos borrar la categoría." }

  revalidatePath(RUTA)
  return { ok: true }
}

/**
 * Traduce lo que devuelve Postgres a algo que diga qué hacer.
 *
 * Los índices únicos son el único error que la persona puede corregir sola, y
 * el mensaje crudo de Supabase no se le muestra a nadie.
 */
function mensajeDeError(crudo: string) {
  if (crudo.includes("product_categories_nombre_idx")) {
    return "Ya tienes una categoría con ese nombre."
  }
  if (crudo.includes("products_sku_idx")) {
    return "Ya usaste ese código en otro producto."
  }
  if (crudo.includes("compare_at_price_cents")) {
    return "El precio anterior tiene que ser mayor que el actual."
  }
  return "No pudimos guardar. Revisa los datos e inténtalo de nuevo."
}

/** Lo que dijo `guardar_variantes`, en palabras de quien vende. */
function mensajeDeVariantes(crudo: string): string {
  if (/Combinación repetida/i.test(crudo)) {
    return "Hay dos combinaciones iguales. Revisa los valores de cada opción."
  }
  if (/Valores repetidos|mismo nombre/i.test(crudo)) {
    return "Hay un valor o una opción repetidos."
  }
  if (/Demasiadas variantes/i.test(crudo)) {
    return "Son demasiadas combinaciones: hasta 60."
  }
  if (/Faltan las variantes|Opción no válida|Valor no válido/i.test(crudo)) {
    return "Completa las opciones: cada una con su nombre y al menos un valor."
  }
  return "Guardamos el producto, pero no sus opciones. Inténtalo de nuevo."
}
