import { exigirFuncion } from "@/lib/data/funciones"
import { getMaterialParaPublicar } from "@/lib/data/publicar"
import { slugify } from "@/lib/format"
import { imagenDelProducto } from "@/lib/publicar-imagen"
import { esDiseno, esFormato } from "@/lib/publicar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * La imagen de un producto para redes, en PNG: 1080 × 1920 para historias y
 * estados, 1080 × 1080 para publicaciones. Se dibuja en el servidor para que
 * salga nítida y con la letra de la tienda en cualquier teléfono.
 *
 * Corre como la persona: lee lo mismo que su panel, y si Venduo le apagó
 * "Publicar en redes" responde 403. `?para=tiktok` la dibuja sin enlace ni
 * QR, como sale a TikTok.
 */
export async function GET(peticion: Request) {
  const permiso = await exigirFuncion("marketing")
  if (!permiso.ok) return new Response(permiso.error, { status: 403 })

  const consulta = new URL(peticion.url).searchParams
  const diseno = consulta.get("diseno")
  const formato = consulta.get("formato")
  if (!esDiseno(diseno) || !esFormato(formato)) {
    return new Response("Pedido incompleto.", { status: 400 })
  }

  const material = await getMaterialParaPublicar()
  const producto = material.productos.find(
    (p) => p.id === consulta.get("producto")
  )
  if (!producto) {
    return new Response("Ese producto ya no está en tu tienda.", {
      status: 404,
    })
  }

  const nombre = `${slugify(producto.nombre) || "producto"}-${formato}.png`
  return imagenDelProducto({
    material,
    producto,
    diseno,
    formato,
    // La vista previa de TikTok la muestra como va a salir: sin enlace.
    sinEnlace: consulta.get("para") === "tiktok",
    cabeceras: {
      // Privada: es de esta tienda, con sus precios de hoy.
      "Cache-Control": "private, max-age=60",
      ...(consulta.get("descargar")
        ? { "Content-Disposition": `attachment; filename="${nombre}"` }
        : {}),
    },
  })
}
