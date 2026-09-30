"use server"

import { revalidatePath } from "next/cache"

import { leerDisenoParaEditar } from "@/lib/data/editor"
import {
  contextoDeDiseno,
  problemasParaPublicar,
  type Borrador,
} from "@/lib/plantillas/borrador"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types"

export type ResultadoDePublicar =
  | { ok: true; publicado: Borrador }
  | { ok: false; error: string; problemas?: string[] }

/**
 * Publicar lo que se armó en el editor.
 *
 * El borrador llega del navegador y no se le cree nada: las reglas se vuelven
 * a armar con lo que se lee de la base —las fotos y categorías de esta tienda,
 * la base de su plantilla— y el borrador se valida entero, contraste incluido.
 * Después `publicar_diseno` guarda una versión y escribe todo en una sola
 * transacción.
 *
 * Devuelve lo publicado releído de la base, con los ids que les tocaron a las
 * secciones nuevas: es el punto de partida del editor de ahí en adelante.
 */
export async function publicarDiseno(
  entrada: unknown
): Promise<ResultadoDePublicar> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: "Estás en modo demo: los cambios no se publican.",
    }
  }

  const diseno = await leerDisenoParaEditar()
  if (!diseno) {
    return { ok: false, error: "No encontramos tu tienda. Vuelve a ingresar." }
  }

  const contexto = contextoDeDiseno(diseno.base, diseno.datos)
  const { borrador, problemas } = problemasParaPublicar(entrada, contexto)

  if (!borrador) {
    return {
      ok: false,
      error: "Hay que arreglar algunas cosas antes de publicar.",
      problemas,
    }
  }

  const { error } = await supabase.rpc("publicar_diseno", {
    p_theme_overrides: borrador.personalizacion as Json,
    // `null` es sin logo: la función lo acepta, los tipos generados no lo dicen.
    p_logo_url: borrador.logoUrl as string,
    p_bloques: borrador.secciones.map((seccion) => ({
      id: seccion.id,
      tipo: seccion.tipo,
      visible: seccion.visible,
      props: seccion.props,
    })) as Json,
  })

  if (error) {
    return {
      ok: false,
      error: error.message.includes("una vez")
        ? "Hay una sección repetida que solo puede ir una vez."
        : error.message.includes("logo")
          ? "Ese logo no es de tu tienda. Vuelve a subirlo."
          : "No pudimos publicar. Inténtalo de nuevo en un momento.",
    }
  }

  // Cambia la tienda pública entera y el panel del dueño, que se viste con
  // su plantilla.
  revalidatePath("/", "layout")

  const releido = await leerDisenoParaEditar()
  return { ok: true, publicado: releido?.publicado ?? borrador }
}
