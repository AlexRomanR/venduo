import { z } from "zod"

import {
  guardarCatalogo,
  pedirCatalogoALaIa,
} from "@/app/(privado)/panel/catalogos/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import type { ProductoDelCatalogo } from "@/lib/catalogos/datos"
import {
  armarDesdePropuesta,
  PLANTILLAS_DE_CATALOGO,
} from "@/lib/catalogos/plantillas"
import { getMaterialDelCatalogo } from "@/lib/data/catalogos"
import { exigirFuncion } from "@/lib/data/funciones"

export const dynamic = "force-dynamic"
// El modelo puede tardar: sin esto, la función se corta antes que su tope.
export const maxDuration = 60

const pedidoSchema = z.object({ frase: z.string().trim().min(1).max(300) })

/**
 * Un catálogo desde una frase, ya guardado y listo para mandar.
 *
 * En el panel la propuesta de la IA queda abierta en el constructor, para
 * retocarla hoja por hoja. La app no tiene constructor: acá la propuesta se
 * arma con la composición de su plantilla y el estilo de la tienda, y se
 * guarda. Queda en "Tus catálogos" como cualquier otro, y desde la
 * computadora se puede seguir editando.
 *
 * Pasa por las mismas acciones del panel, así que vale lo mismo: el permiso y
 * el tope de la IA, los productos que son de la tienda y el contraste.
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

  const propuesta = await pedirCatalogoALaIa(pedido.data.frase, null)
  if (!propuesta.ok) return fallo(propuesta.error, 422)

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
  if (!guardado.ok) return fallo(guardado.error, 422)

  return respuesta({
    id: guardado.id,
    nombre: catalogo.nombre,
    productos: catalogo.productos.length,
    plantilla: PLANTILLAS_DE_CATALOGO[catalogo.plantilla].nombre,
    explicacion: propuesta.propuesta.explicacion,
    enlace: guardado.enlace,
  })
}
