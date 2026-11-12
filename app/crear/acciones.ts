"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"

import {
  COOKIE_DEL_ALTA,
  DURACION_DEL_ALTA,
  leerBorradorDelAlta,
} from "@/lib/data/alta"
import { createClient } from "@/lib/supabase/server"
import {
  crearTiendaSchema,
  soloCifras,
  type CrearTiendaInput,
} from "@/lib/validation/tienda"

type Resultado = {
  ok: boolean
  error?: string
  /** Ya tenía tienda: lo que corresponde es el panel. */
  yaTieneTienda?: boolean
  /** Lo que la base rechazó es el WhatsApp: hay que volver a escribirlo. */
  revisarWhatsapp?: boolean
  /** Se perdió el borrador: hay que volver al paso 1. */
  sinBorrador?: boolean
}

/**
 * Paso 1 del alta: guarda el negocio en el borrador. Todavía no crea nada: la
 * tienda nace en el paso 2, con la plantilla.
 */
export async function guardarNegocio(
  entrada: CrearTiendaInput
): Promise<Resultado> {
  const datos = crearTiendaSchema.safeParse(entrada)
  if (!datos.success) {
    return {
      ok: false,
      error: datos.error.issues[0]?.message ?? "Revisa los datos.",
    }
  }

  ;(await cookies()).set(COOKIE_DEL_ALTA, JSON.stringify(datos.data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/crear",
    maxAge: DURACION_DEL_ALTA,
  })
  return { ok: true }
}

const claveSchema = z.string().trim().min(1).max(60)

/**
 * Paso 2 del alta: crea la tienda con el negocio del borrador y la plantilla
 * elegida. Todo lo que importa pasa en `create_store`: que no tenga otra
 * tienda, que la plantilla se ofrezca, el WhatsApp, el enlace único y la
 * prueba. Acá solo se arma el pedido y se traduce el error.
 */
export async function crearTienda(clave: string): Promise<Resultado> {
  const plantilla = claveSchema.safeParse(clave)
  if (!plantilla.success) {
    return { ok: false, error: "Esa plantilla no existe." }
  }

  const negocio = await leerBorradorDelAlta()
  if (!negocio) return { ok: false, sinBorrador: true }

  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: "Estás en modo demo: falta configurar Supabase en .env.local.",
    }
  }

  const { error } = await supabase.rpc("create_store", {
    p_name: negocio.nombre,
    p_description: negocio.descripcion,
    p_template_key: plantilla.data,
    p_whatsapp: soloCifras(negocio.whatsapp),
  })

  if (error) {
    if (error.message.includes("Ya tienes una tienda")) {
      return { ok: false, yaTieneTienda: true }
    }
    if (/whatsapp/i.test(error.message)) {
      return {
        ok: false,
        revisarWhatsapp: true,
        error: "Revisa el WhatsApp de tu negocio.",
      }
    }
    return {
      ok: false,
      error: "No pudimos crear tu tienda. Inténtalo de nuevo.",
    }
  }

  ;(await cookies()).delete({ name: COOKIE_DEL_ALTA, path: "/crear" })
  // La barra, el destino al entrar y el alta cambian con la tienda nueva.
  revalidatePath("/", "layout")
  return { ok: true }
}
