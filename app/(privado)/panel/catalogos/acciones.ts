"use server"

import { revalidatePath } from "next/cache"

import type { PropuestaDeCatalogo } from "@/lib/ai/schemas"
import { mensajeDeErrorDeIa } from "@/lib/ai/mensajes"
import { proponerCatalogo } from "@/lib/ai/tasks"
import { CONDICIONES } from "@/lib/catalogos/datos"
import { problemasDeEstilo } from "@/lib/catalogos/estilo"
import { catalogoSchema } from "@/lib/catalogos/modelo"
import { enlaceDeCatalogo, getMaterialDelCatalogo } from "@/lib/data/catalogos"
import { getMiTienda } from "@/lib/data/panel"
import { formatMoney } from "@/lib/format"
import { createClient, getUsuario } from "@/lib/supabase/server"

export type ResultadoDeGuardar =
  { ok: true; id: string; enlace: string } | { ok: false; error: string }

/**
 * Guarda un catálogo, nuevo o existente.
 *
 * Se valida entero con el mismo esquema que el PDF, y se exige el mismo
 * contraste: un catálogo guardado se comparte por enlace, y ese enlace no
 * puede abrir algo que no se lee.
 */
export async function guardarCatalogo(
  id: string | null,
  entrada: unknown
): Promise<ResultadoDeGuardar> {
  const catalogo = catalogoSchema.safeParse(entrada)
  if (!catalogo.success) {
    return {
      ok: false,
      error:
        "Hay algo en el catálogo que no se puede guardar. Revisa los textos.",
    }
  }
  const [problema] = problemasDeEstilo(catalogo.data.estilo)
  if (problema) return { ok: false, error: problema }

  const supabase = await createClient()
  const tienda = supabase ? await getMiTienda() : null
  if (!supabase || !tienda) {
    return {
      ok: false,
      error:
        "Estás en modo demo: el catálogo no se guarda, pero el PDF sí se descarga.",
    }
  }

  const fila = {
    name: catalogo.data.nombre,
    template_key: catalogo.data.plantilla,
    config: catalogo.data,
  }

  const { data, error } = id
    ? await supabase
        .from("catalogs")
        .update({ ...fila, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("store_id", tienda.id)
        .is("deleted_at", null)
        .select("id, share_token")
        .maybeSingle()
    : await supabase
        .from("catalogs")
        .insert({ ...fila, store_id: tienda.id })
        .select("id, share_token")
        .single()

  if (error || !data) {
    return {
      ok: false,
      error: "No pudimos guardar el catálogo. Inténtalo de nuevo.",
    }
  }

  revalidatePath("/panel/catalogos")
  return { ok: true, id: data.id, enlace: enlaceDeCatalogo(data.share_token) }
}

/** Da de baja un catálogo. El enlace que se haya compartido deja de abrir. */
export async function borrarCatalogo(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const tienda = supabase ? await getMiTienda() : null
  if (!supabase || !tienda) {
    return { ok: false, error: "Estás en modo demo: no hay nada que borrar." }
  }

  const { error } = await supabase
    .from("catalogs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", tienda.id)
    .is("deleted_at", null)

  if (error) return { ok: false, error: "No pudimos borrar el catálogo." }

  revalidatePath("/panel/catalogos")
  return { ok: true }
}

export type ResultadoDeLaIa =
  { ok: true; propuesta: PropuestaDeCatalogo } | { ok: false; error: string }

/**
 * Un catálogo desde una frase, o un orden nuevo para el que está abierto.
 *
 * La IA propone y el sistema valida: el esquema descarta lo mal formado y acá
 * se descartan los ids que no son de esta tienda —o que no están en el
 * catálogo abierto, si se pidió un orden—. Lo que vuelve es solo una
 * propuesta: el editor la muestra y la persona decide si la usa.
 */
export async function pedirCatalogoALaIa(
  frase: string,
  actuales: string[] | null
): Promise<ResultadoDeLaIa> {
  const pedido = frase.trim()
  if (pedido.length < 3) {
    return { ok: false, error: "Cuéntale a la IA qué catálogo quieres armar." }
  }
  if (pedido.length > 300) {
    return { ok: false, error: "Es un poco largo: dilo en una o dos frases." }
  }

  const { datos, esDemo } = await getMaterialDelCatalogo()
  const productos = Object.values(datos.productos)
  if (productos.length === 0) {
    return {
      ok: false,
      error: "Tu tienda todavía no tiene productos: carga alguno y vuelve.",
    }
  }

  let resultado: Awaited<ReturnType<typeof proponerCatalogo>>
  try {
    resultado = await proponerCatalogo({
      frase: pedido,
      tienda: datos.tienda.nombre,
      productos: productos.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio: formatMoney(producto.precioCents),
        rebaja:
          producto.precioAnteriorCents &&
          producto.precioAnteriorCents > producto.precioCents
            ? Math.round(
                (1 - producto.precioCents / producto.precioAnteriorCents) * 100
              )
            : null,
        condicion: CONDICIONES[producto.condicion],
        stock: producto.stock,
        destacado: producto.destacado,
      })),
      actuales,
    })
  } catch (error) {
    // Se registra en el servidor: sin esto, un fallo del proveedor no se
    // distingue de un pedido mal entendido.
    console.error("[catalogos] el proveedor de IA falló:", error)
    return { ok: false, error: mensajeDeErrorDeIa(error) }
  }

  const permitidos = new Set(actuales ?? productos.map((p) => p.id))
  const elegidos = [...new Set(resultado.propuesta.productos)].filter(
    (productoId) => permitidos.has(productoId) && datos.productos[productoId]
  )
  if (elegidos.length === 0) {
    return {
      ok: false,
      error:
        "La IA no encontró productos de tu tienda para eso. Prueba con otra frase.",
    }
  }

  const propuesta = { ...resultado.propuesta, productos: elegidos }

  if (!esDemo) {
    const [user, tienda, supabase] = await Promise.all([
      getUsuario(),
      getMiTienda(),
      createClient(),
    ])
    if (user && tienda && supabase) {
      await supabase.from("ai_generations").insert({
        user_id: user.id,
        store_id: tienda.id,
        kind: "marketing",
        provider: resultado.provider,
        model: resultado.model,
        prompt: pedido,
        output: propuesta,
      })
    }
  }

  return { ok: true, propuesta }
}
