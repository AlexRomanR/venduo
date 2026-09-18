"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

import { MAXIMO_POR_PLANILLA } from "@/lib/importar"
import {
  categoriaSchema,
  filaImportadaSchema,
  productoSchema,
  type CategoriaInput,
  type FilaImportada,
  type ProductoInput,
} from "@/lib/validation/producto"
import type { ProductUpdate } from "@/types"

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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, tiendaId: null }

  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  return { supabase, tiendaId: data?.id ?? null }
}

/** Bolivianos a centavos enteros. Nunca punto flotante en la base. */
function aCentavos(monto: number) {
  return Math.round(monto * 100)
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

  // `image_url` y `category` no se escriben: los deriva el disparador de la
  // base desde `images` y `category_id`, que son la fuente.
  const fila = {
    store_id: tiendaId,
    name: v.nombre,
    description: v.descripcion || null,
    // `price_cents` no se escribe: lo deriva el disparador `producto_precio`
    // del costo base, sumando comisión y take-rate del tramo.
    base_cost_cents: aCentavos(v.costoBase),
    compare_at_price_cents:
      v.precioAnterior === null ? null : aCentavos(v.precioAnterior),
    stock: v.stock,
    low_stock_threshold: v.avisoStock,
    category_id: v.categoriaId,
    condition: v.condicion,
    condition_note: v.notaCondicion || null,
    sku: v.sku || null,
    images: v.fotos,
    is_active: v.activo,
    is_featured: v.destacado,
    seller_enabled: v.aceptaVendedores,
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

  revalidatePath(RUTA)
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
  return { ok: true }
}

/**
 * Los interruptores de la lista: publicar, destacar y aceptar vendedores.
 *
 * Van juntos y no en tres acciones porque los tres son lo mismo —un booleano
 * de una fila mía— y separarlos solo multiplica el código que resuelve la
 * tienda.
 */
export async function alternarProducto(
  id: string,
  campo: "is_active" | "is_featured" | "seller_enabled",
  valor: boolean
): Promise<Resultado> {
  const { supabase, tiendaId } = await miTienda()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }
  if (!tiendaId) return { ok: false, error: "Todavía no tienes una tienda." }

  // Escrito y no `{ [campo]: valor }`: con la clave calculada TypeScript pierde
  // de vista qué columna se toca y deja de comprobar que exista.
  const cambio: ProductUpdate =
    campo === "is_active"
      ? { is_active: valor }
      : campo === "is_featured"
        ? { is_featured: valor }
        : { seller_enabled: valor }

  const { error } = await supabase
    .from("products")
    .update(cambio)
    .eq("id", id)
    .eq("store_id", tiendaId)

  if (error) return { ok: false, error: "No pudimos guardar el cambio." }

  revalidatePath(RUTA)
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

  if (error) return { ok: false, error: "No pudimos guardar el stock." }

  revalidatePath(RUTA)
  return { ok: true }
}

/**
 * Cargar varios productos desde una planilla.
 *
 * El navegador ya validó cada fila para mostrarla, pero la planilla viene de
 * afuera: se valida todo de nuevo. Es todo o nada —si una fila no pasa, no se
 * carga ninguna— porque una carga a medias deja al negocio sin saber qué entró
 * y con duplicados el día que la reintenta.
 *
 * Las categorías llegan por nombre. Las que no existen se crean acá, antes de
 * los productos, comparando sin distinguir mayúsculas como lo hace el índice
 * único de la tabla.
 */
export async function importarProductos(
  entrada: FilaImportada[]
): Promise<Resultado & { creados?: number }> {
  const validado = z
    .array(filaImportadaSchema)
    .min(1, "La planilla no tiene productos.")
    .max(
      MAXIMO_POR_PLANILLA,
      `Hasta ${MAXIMO_POR_PLANILLA} productos por planilla.`
    )
    .safeParse(entrada)

  if (!validado.success) {
    return { ok: false, error: validado.error.issues[0]?.message }
  }

  const { supabase, tiendaId } = await miTienda()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }
  if (!tiendaId) return { ok: false, error: "Todavía no tienes una tienda." }

  const filas = validado.data

  const { data: existentes, error: errorCategorias } = await supabase
    .from("product_categories")
    .select("id, name")
    .eq("store_id", tiendaId)
    .is("deleted_at", null)

  if (errorCategorias) {
    return { ok: false, error: "No pudimos leer tus categorías." }
  }

  const porNombre = new Map(
    (existentes ?? []).map((c) => [c.name.toLowerCase(), c.id])
  )

  // Una sola vez cada nombre nuevo, aunque aparezca en veinte filas.
  const nuevas = [
    ...new Map(
      filas
        .map((f) => f.categoria.trim())
        .filter((nombre) => nombre && !porNombre.has(nombre.toLowerCase()))
        .map((nombre) => [nombre.toLowerCase(), nombre])
    ).values(),
  ]

  if (nuevas.length > 0) {
    const { data: creadas, error } = await supabase
      .from("product_categories")
      .insert(nuevas.map((name) => ({ store_id: tiendaId, name })))
      .select("id, name")

    if (error || !creadas) {
      return { ok: false, error: "No pudimos crear las categorías nuevas." }
    }
    for (const c of creadas) porNombre.set(c.name.toLowerCase(), c.id)
  }

  const { error } = await supabase.from("products").insert(
    filas.map((f) => ({
      store_id: tiendaId,
      name: f.nombre,
      description: f.descripcion || null,
      // El precio publicado lo deriva la base desde el costo base.
      base_cost_cents: aCentavos(f.costoBase),
      stock: f.stock,
      category_id: f.categoria
        ? (porNombre.get(f.categoria.toLowerCase()) ?? null)
        : null,
      condition: f.condicion,
      condition_note: f.notaCondicion || null,
      sku: f.sku || null,
    }))
  )

  if (error) return { ok: false, error: mensajeDeError(error.message) }

  revalidatePath(RUTA)
  revalidatePath("/panel")
  return { ok: true, creados: filas.length }
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
      error: "No pudimos soltar los productos de esa categoría.",
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
    return "El precio anterior tiene que ser mayor que el precio publicado."
  }
  return "No pudimos guardar. Revisa los datos e intenta de nuevo."
}
