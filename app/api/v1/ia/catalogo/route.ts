import { z } from "zod"

import { armarCatalogoConLaIa } from "@/app/(privado)/panel/catalogos/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { exigirFuncion } from "@/lib/data/funciones"

export const dynamic = "force-dynamic"
// El modelo puede tardar: sin esto, la función se corta antes que su tope.
export const maxDuration = 60

const pedidoSchema = z.object({ frase: z.string().trim().min(1).max(300) })

/**
 * Un catálogo desde una frase, ya guardado y listo para mandar.
 *
 * Es "Pídeselo a la IA" de la lista de catálogos: la misma acción que usa la
 * web (`armarCatalogoConLaIa`), así que valen igual el permiso, el tope de la
 * IA, los productos de la tienda y el contraste.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("catalogos")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const pedido = pedidoSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) {
    return fallo("Cuéntale a la IA qué catálogo quieres armar.")
  }

  const armado = await armarCatalogoConLaIa(pedido.data.frase)
  if (!armado.ok) return fallo(armado.error, 422)

  return respuesta({
    id: armado.id,
    nombre: armado.nombre,
    productos: armado.productos,
    plantilla: armado.plantilla,
    explicacion: armado.explicacion,
    enlace: armado.enlace,
  })
}
