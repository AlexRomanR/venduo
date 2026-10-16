"use server"

import { revalidatePath } from "next/cache"

import type { PropuestaDeCatalogo } from "@/lib/ai/schemas"
import { mensajeDeErrorDeIa } from "@/lib/ai/mensajes"
import { proponerCatalogo } from "@/lib/ai/tasks"
import { problemasDeEstilo } from "@/lib/catalogos/estilo"
import { catalogoSchema } from "@/lib/catalogos/modelo"
import {
  enlaceDeCatalogo,
  getMaterialDelCatalogo,
  plantillasDeCatalogoVisibles,
} from "@/lib/data/catalogos"
import type { ProductoDelCatalogo } from "@/lib/catalogos/datos"
import {
  armarDesdePropuesta,
  PLANTILLAS_DE_CATALOGO,
} from "@/lib/catalogos/plantillas"
import { exigirFuncion } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { anotarUsoDeIa, permisoDeIa } from "@/lib/data/uso-ia"
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
  const permiso = await exigirFuncion("catalogos")
  if (!permiso.ok) return permiso

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

  // Por una función y no con un UPDATE: la política de lectura pide
  // `deleted_at is null`, y Postgres rechaza dejar la fila invisible para
  // quien la cambia. La función solo toca un catálogo vivo de esta tienda.
  const { data, error } = await supabase.rpc("dar_de_baja_catalogo", {
    p_catalogo: id,
  })

  if (error) return { ok: false, error: "No pudimos borrar el catálogo." }
  if (!data) return { ok: false, error: "Ese catálogo ya no existe." }

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

  const [{ datos, esDemo }, permiso, plantillas] = await Promise.all([
    getMaterialDelCatalogo(),
    permisoDeIa("catalogos"),
    plantillasDeCatalogoVisibles(),
  ])
  if (!permiso.ok) return permiso
  const productos = Object.values(datos.productos)
  if (productos.length === 0) {
    return {
      ok: false,
      error: "Tu tienda todavía no tiene productos: carga alguno y vuelve.",
    }
  }

  const inicio = Date.now()
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
        stock: producto.stock,
        destacado: producto.destacado,
      })),
      actuales,
    })
    await anotarUsoDeIa("catalogos", inicio)
  } catch (error) {
    await anotarUsoDeIa("catalogos", inicio, error)
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

  const propuesta = {
    ...resultado.propuesta,
    productos: elegidos,
    // Una plantilla que Venduo dejó de ofrecer no se propone.
    plantilla: plantillas.includes(resultado.propuesta.plantilla)
      ? resultado.propuesta.plantilla
      : plantillas[0],
  }

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

export type ResultadoDeArmarConLaIa =
  | {
      ok: true
      id: string
      nombre: string
      productos: number
      plantilla: string
      explicacion: string
      enlace: string
    }
  | { ok: false; error: string }

/**
 * Un catálogo desde una frase, ya guardado: lo que hace "Pídeselo a la IA" en
 * la lista de catálogos, la de la web y la de la app (`/api/v1/ia/catalogo`).
 *
 * La propuesta se arma con la composición de su plantilla y el estilo de la
 * tienda, y se guarda; después se abre en el editor para retocarla. Pasa por
 * `pedirCatalogoALaIa` y `guardarCatalogo`, así que valen el permiso, el tope
 * de la IA, los productos de la tienda y el contraste.
 */
export async function armarCatalogoConLaIa(
  frase: string
): Promise<ResultadoDeArmarConLaIa> {
  const permiso = await exigirFuncion("catalogos")
  if (!permiso.ok) return { ok: false, error: permiso.error }

  const propuesta = await pedirCatalogoALaIa(frase, null)
  if (!propuesta.ok) return propuesta

  const { datos, estiloDeTienda } = await getMaterialDelCatalogo()
  const productos = propuesta.propuesta.productos
    .map((id) => datos.productos[id])
    .filter((producto): producto is ProductoDelCatalogo => Boolean(producto))

  const catalogo = armarDesdePropuesta(propuesta.propuesta, {
    productos,
    tienda: { nombre: datos.tienda.nombre, whatsapp: datos.tienda.whatsapp },
    estilo: estiloDeTienda,
  })

  const guardado = await guardarCatalogo(null, catalogo)
  if (!guardado.ok) return guardado

  return {
    ok: true,
    id: guardado.id,
    nombre: catalogo.nombre,
    productos: catalogo.productos.length,
    plantilla: PLANTILLAS_DE_CATALOGO[catalogo.plantilla].nombre,
    explicacion: propuesta.propuesta.explicacion,
    enlace: guardado.enlace,
  }
}
