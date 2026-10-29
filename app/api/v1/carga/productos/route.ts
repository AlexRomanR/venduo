import { crearProductos } from "@/app/(privado)/panel/productos/cargar/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { crearProductosSchema } from "@/lib/validation/carga"

export const dynamic = "force-dynamic"

/**
 * La app: crea de una vez los borradores que la persona revisó, con sus tallas.
 * La misma acción de Cargar varios del panel, que vuelve a validar todo.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const pedido = crearProductosSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) {
    return fallo(pedido.error.issues[0]?.message ?? "Revisa los productos.")
  }

  const resultado = await crearProductos(pedido.data)
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta({
    creados: resultado.creados,
    sinTallas: resultado.sinTallas,
  })
}
