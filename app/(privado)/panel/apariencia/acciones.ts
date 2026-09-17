"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { esClavePlantilla } from "@/lib/plantillas"
import { createClient } from "@/lib/supabase/server"

const cambioSchema = z.object({
  clave: z.string().refine(esClavePlantilla, "Esa plantilla no existe."),
  conservarSecciones: z.boolean(),
})

export type CambioDePlantilla = z.input<typeof cambioSchema>

/**
 * Cambiar la plantilla de la tienda.
 *
 * Todo lo que importa pasa en `change_store_template`: comprueba que la tienda
 * sea del usuario y que la plantilla se ofrezca, guarda el diseño anterior y
 * cambia. Acá solo se valida la forma y se traduce el error.
 */
export async function cambiarPlantilla(
  entrada: CambioDePlantilla
): Promise<{ ok: boolean; error?: string }> {
  const datos = cambioSchema.safeParse(entrada)
  if (!datos.success) {
    return { ok: false, error: "Esa plantilla no existe." }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: "En modo demo no se puede cambiar la plantilla.",
    }
  }

  const { error } = await supabase.rpc("change_store_template", {
    p_template_key: datos.data.clave,
    p_keep_sections: datos.data.conservarSecciones,
  })

  if (error) {
    return {
      ok: false,
      error: error.message.includes("ya usa")
        ? "Tu tienda ya usa esa plantilla."
        : "No pudimos cambiar la plantilla. Inténtalo de nuevo.",
    }
  }

  // Cambia cómo se ve todo: el panel, que toma la identidad de la plantilla, y
  // cada pantalla de la tienda pública.
  revalidatePath("/", "layout")
  return { ok: true }
}
