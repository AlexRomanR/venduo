import { exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { exigirFuncion } from "@/lib/data/funciones"
import { getMaterialParaPublicar } from "@/lib/data/publicar"
import { rebajaDe } from "@/lib/publicar"

export const dynamic = "force-dynamic"

/**
 * Lo que la app necesita para Publicar en redes: los productos que la tienda
 * muestra hoy, con su foto, su precio y su rebaja, y la tienda. Es el mismo
 * material que lee la pantalla de la web, y la misma puerta.
 */
export async function GET() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("marketing")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const material = await getMaterialParaPublicar()
  return respuesta({
    tienda: { nombre: material.tienda.nombre, url: material.tienda.url },
    productos: material.productos.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precioCents: producto.precioCents,
      foto: producto.foto,
      rebaja: rebajaDe(producto),
    })),
  })
}
