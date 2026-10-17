"use server"

import { mensajeDeErrorDeIa } from "@/lib/ai/mensajes"
import { escribirPublicaciones } from "@/lib/ai/tasks"
import { exigirFuncion, funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { enlaceDelProducto, getMaterialParaPublicar } from "@/lib/data/publicar"
import { anotarUsoDeIa, permisoDeIa } from "@/lib/data/uso-ia"
import {
  armarTextos,
  quedanPocas,
  rebajaDe,
  textosSinIa,
  type Textos,
} from "@/lib/publicar"
import { createClient, getUsuario } from "@/lib/supabase/server"

export type ResultadoDeTextos =
  { ok: true; textos: Textos; conIa: boolean } | { ok: false; error: string }

/**
 * Los textos para publicar un producto: los escribe la IA si Venduo la dejó
 * activa en esta tienda y, si no, se arman sin ella.
 *
 * La IA propone las palabras; el precio y el enlace los pone el sistema, con
 * los datos de la base. Nada se publica desde acá: la persona revisa, cambia
 * lo que quiera y comparte.
 *
 * `conIa: false` los arma sin ella: es el texto que la app muestra al instante,
 * mientras la IA escribe o cuando no está. La pantalla de la web lo arma sola.
 */
export async function escribirTextos(
  productoId: string,
  vuelta = 0,
  conIa = true
): Promise<ResultadoDeTextos> {
  const permiso = await exigirFuncion("marketing")
  if (!permiso.ok) return { ok: false, error: permiso.error }

  const [material, funciones] = await Promise.all([
    getMaterialParaPublicar(),
    funcionesDeMiTienda(),
  ])
  const producto = material.productos.find((p) => p.id === productoId)
  if (!producto) {
    return {
      ok: false,
      error: "Ese producto ya no está en tu tienda: elige otro.",
    }
  }
  const enlace = enlaceDelProducto(material.tienda.url, producto.id)

  if (!conIa || funciones.ia_marketing !== "activa") {
    return {
      ok: true,
      textos: armarTextos(
        textosSinIa(producto, material.tienda.nombre),
        producto,
        enlace
      ),
      conIa: false,
    }
  }

  const permisoDeLaIa = await permisoDeIa("marketing")
  if (!permisoDeLaIa.ok) return permisoDeLaIa

  const inicio = Date.now()
  let resultado: Awaited<ReturnType<typeof escribirPublicaciones>>
  try {
    resultado = await escribirPublicaciones({
      tienda: material.tienda.nombre,
      producto: {
        nombre: producto.nombre,
        categoria: producto.categoria,
        descripcion: producto.descripcion,
        rebaja: rebajaDe(producto),
        pocasUnidades: quedanPocas(producto),
      },
      vuelta: Math.max(0, Math.min(20, Math.trunc(vuelta))),
    })
    await anotarUsoDeIa("marketing", inicio)
  } catch (error) {
    await anotarUsoDeIa("marketing", inicio, error)
    console.error("[publicar] el proveedor de IA falló:", error)
    return { ok: false, error: mensajeDeErrorDeIa(error) }
  }

  if (!material.esDemo) {
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
        prompt: `Publicar: ${producto.nombre}`,
        output: resultado.publicaciones,
      })
    }
  }

  return {
    ok: true,
    textos: armarTextos(resultado.publicaciones, producto, enlace),
    conIa: true,
  }
}
