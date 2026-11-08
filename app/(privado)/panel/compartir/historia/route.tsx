import { respuestaDeHistoria } from "@/lib/historia-imagen"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Una tarjeta para historias de Compartir, en PNG de 1080 × 1920: con la
 * tienda adentro, su letra y sus colores (`lib/historia-imagen.tsx`).
 */
export function GET(peticion: Request) {
  return respuestaDeHistoria(peticion)
}
