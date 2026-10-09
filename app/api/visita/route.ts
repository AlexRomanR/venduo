import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createAdminClient, getUsuario } from "@/lib/supabase/server"
import { ORIGENES, TIPOS_DE_VISITA, dispositivo, esRobot } from "@/lib/visitas"

const visitaSchema = z.object({
  tienda: z.uuid(),
  tipo: z.enum(TIPOS_DE_VISITA),
  producto: z.uuid().nullable().optional(),
  origen: z.enum(ORIGENES),
})

/**
 * Anota una visita a una tienda.
 *
 * La manda la página ya abierta, con `sendBeacon`: así no cuentan las
 * precargas del navegador, que dibujan la página sin que nadie la vea. La
 * escribe la base con `registrar_visita`, que solo puede llamar el servidor:
 * si el navegador escribiera directo, cualquiera inflaría los números de otra
 * tienda.
 *
 * La dirección de red y el navegador viajan a la base solo para armar la
 * huella del día, y no se guardan. Siempre responde 204: quien compra no tiene
 * por qué enterarse de nada.
 */
export async function POST(request: NextRequest) {
  const navegador = request.headers.get("user-agent") ?? ""
  if (esRobot(navegador)) return new NextResponse(null, { status: 204 })

  let cuerpo: unknown
  try {
    cuerpo = JSON.parse(await request.text())
  } catch {
    return new NextResponse(null, { status: 204 })
  }
  const visita = visitaSchema.safeParse(cuerpo)
  const db = createAdminClient()
  if (!visita.success || !db) return new NextResponse(null, { status: 204 })

  const red =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    ""
  const usuario = await getUsuario()

  // Los tipos generados no marcan los parámetros que admiten nulo; la base
  // sí los acepta: sin producto o sin sesión, van nulos.
  const { error } = await db.rpc("registrar_visita", {
    p_store_id: visita.data.tienda,
    p_kind: visita.data.tipo,
    p_product_id: (visita.data.producto ?? null) as string,
    p_source: visita.data.origen,
    p_device: dispositivo(navegador),
    p_firma: `${red}|${navegador}`,
    p_usuario: (usuario?.id ?? null) as string,
  })
  if (error) console.error("[visitas] no se pudo anotar:", error.message)

  return new NextResponse(null, { status: 204 })
}
