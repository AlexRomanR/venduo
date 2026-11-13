import "server-only"

import { cookies } from "next/headers"

import {
  crearTiendaSchema,
  type CrearTiendaInput,
} from "@/lib/validation/tienda"

/**
 * El borrador del alta: lo que la persona contó de su negocio en el paso 1,
 * mientras elige la plantilla en el paso 2. La tienda se crea recién al elegir,
 * con todo junto, porque `create_store` lo pide así.
 *
 * Vive en una cookie del servidor, sin JavaScript que la lea: lleva su WhatsApp.
 * Sobrevive a recargar y a volver atrás, y se borra al crear la tienda o al
 * salir.
 */
export const COOKIE_DEL_ALTA = "venduo_alta"

/** Un día: lo que tarda alguien en volver a terminar lo que empezó. */
export const DURACION_DEL_ALTA = 60 * 60 * 24

/** El borrador, si hay uno y sigue siendo válido. */
export async function leerBorradorDelAlta(): Promise<CrearTiendaInput | null> {
  const guardado = (await cookies()).get(COOKIE_DEL_ALTA)?.value
  if (!guardado) return null
  try {
    const leido = crearTiendaSchema.safeParse(JSON.parse(guardado))
    return leido.success ? leido.data : null
  } catch {
    return null
  }
}
