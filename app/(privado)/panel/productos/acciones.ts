"use server"

import { revalidatePath } from "next/cache"

import { createClient, getUsuario } from "@/lib/supabase/server"
import {
  categoriaSchema,
  productoSchema,
  type CategoriaInput,
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
    price_cents: aCentavos(v.precio),
    compare_at_price_cents:
      v.precioAnterior === null ? null : aCentavos(v.precioAnterior),
    stock: v.stock,
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
 * Los interruptores de la lista: publicar y destacar.
 *
 * Van juntos y no en dos acciones porque los dos son lo mismo —un booleano
 * de una fila mía— y separarlos solo multiplica el código que resuelve la
 * tienda.
 */
export async function alternarProducto(
  id: string,
  campo: "is_active" | "is_featured",
  valor: boolean
): Promise<Resultado> {
  const { supabase, tiendaId } = await miTienda()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }
  if (!tiendaId) return { ok: false, error: "Todavía no tienes una tienda." }

  // Escrito y no `{ [campo]: valor }`: con la clave calculada TypeScript pierde
  // de vista qué columna se toca y deja de comprobar que exista.
  const cambio: ProductUpdate =
    campo === "is_active" ? { is_active: valor } : { is_featured: valor }

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
    return "El precio anterior tiene que ser mayor que el actual."
  }
  return "No pudimos guardar. Revisa los datos e intenta de nuevo."
}
