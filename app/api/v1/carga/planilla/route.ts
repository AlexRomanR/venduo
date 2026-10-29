import { z } from "zod"

import { leerColumnasDePlanilla } from "@/app/(privado)/panel/productos/cargar/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { LIMITES_DE_CARGA } from "@/lib/carga"
import { leerCsv, leerXlsx, type Filas } from "@/lib/planilla"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const pedidoSchema = z.union([
  // Una tabla pegada como texto: la app ya la partió en filas.
  z.object({
    filas: z
      .array(z.array(z.string().max(2_000)).max(60))
      .min(1)
      .max(400),
  }),
  // Un archivo: el teléfono no puede abrir un .xlsx, la web sí.
  z.object({
    archivo: z
      .string()
      .max(Math.ceil((LIMITES_DE_CARGA.bytesDePlanilla * 4) / 3) + 8),
    nombre: z.string().max(200),
  }),
])

/**
 * La app: qué es cada columna de una planilla, con la IA si está activa. Lee
 * también el archivo —`.xlsx` o `.csv`, en base64—, y devuelve sus filas para
 * que la app muestre la tabla. La misma lectura de Cargar varios del panel.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const pedido = pedidoSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) {
    return fallo(
      "Esa planilla pesa más de 2 MB. Guárdala solo con tus productos."
    )
  }

  let filas: Filas
  if ("filas" in pedido.data) {
    filas = pedido.data.filas
  } else {
    const { archivo, nombre } = pedido.data
    if (!/\.(xlsx|csv|txt)$/i.test(nombre)) {
      return fallo(
        "No pudimos leer ese archivo. Guárdalo como Excel (.xlsx) o CSV y vuelve a subirlo."
      )
    }
    try {
      const bytes = Uint8Array.from(Buffer.from(archivo, "base64"))
      filas = /\.xlsx$/i.test(nombre)
        ? await leerXlsx(bytes)
        : leerCsv(new TextDecoder().decode(bytes))
    } catch {
      filas = []
    }
    if (filas.length === 0) return fallo("Esa planilla no tiene productos.")
  }
  filas = filas.slice(0, LIMITES_DE_CARGA.productos + 20)

  const resultado = await leerColumnasDePlanilla(filas)
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta({ filas, lectura: resultado.lectura })
}
