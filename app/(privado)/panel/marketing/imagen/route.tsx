import fs from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"

import {
  PESOS,
  resolverEstilo,
  type EstiloResuelto,
} from "@/lib/catalogos/estilo"
import { exigirFuncion } from "@/lib/data/funciones"
import { getMaterialParaPublicar } from "@/lib/data/publicar"
import { slugify } from "@/lib/format"
import { fotoEnBase64 } from "@/lib/fotos"
import { esDiseno, esFormato, FORMATOS, rebajaDe } from "@/lib/publicar"
import { toDataURL } from "@/lib/qr"
import { ImagenDelProducto } from "@/components/publicar/imagen"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Fuente = {
  name: string
  data: Buffer
  weight: 400 | 500 | 600 | 700 | 800
  style: "normal"
}

/** El peso que hay en disco más cercano al pedido. */
function pesoCercano(fuente: keyof typeof PESOS, peso: number): number {
  return PESOS[fuente].reduce((mejor, candidato) =>
    Math.abs(candidato - peso) < Math.abs(mejor - peso) ? candidato : mejor
  )
}

/**
 * Las letras de la tienda, leídas del disco como en el catálogo en PDF: un
 * corte de red no cambia la letra de la imagen. Solo las que usa el dibujo.
 */
async function fuentesDe(estilo: EstiloResuelto): Promise<Fuente[]> {
  const carpeta = path.join(process.cwd(), "public", "fuentes")
  const pedidas = [
    [estilo.titular.fuente, estilo.titular.peso],
    [estilo.cuerpo.fuente, estilo.cuerpo.peso],
    [estilo.cuerpo.fuente, estilo.cuerpo.pesoFuerte],
  ] as const
  const unicas = new Map<string, Fuente>()
  await Promise.all(
    pedidas.map(async ([fuente, peso]) => {
      const real = pesoCercano(fuente, peso)
      const clave = `${fuente}-${real}`
      if (unicas.has(clave)) return
      const data = await fs.readFile(path.join(carpeta, `${clave}.ttf`))
      unicas.set(clave, {
        name: fuente,
        data,
        weight: real as Fuente["weight"],
        style: "normal",
      })
    })
  )
  return [...unicas.values()]
}

/**
 * La imagen de un producto para redes, en PNG: 1080 × 1920 para historias y
 * estados, 1080 × 1080 para publicaciones. Se dibuja en el servidor para que
 * salga nítida y con la letra de la tienda en cualquier teléfono.
 *
 * Corre como la persona: lee lo mismo que su panel, y si Venduo le apagó
 * "Publicar en redes" responde 403.
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

  const estilo = resolverEstilo(material.estilo)
  const medida = FORMATOS.find((f) => f.clave === formato) ?? FORMATOS[0]
  const [fuentes, foto, qr] = await Promise.all([
    fuentesDe(estilo),
    producto.foto
      ? fotoEnBase64(producto.foto, { lado: 1400, calidad: 86 })
      : Promise.resolve(null),
    formato === "historia"
      ? toDataURL(material.tienda.url, {
          size: 336,
          margin: 1,
          dark: estilo.colores.tinta,
          light: estilo.colores.papel,
        })
      : Promise.resolve(null),
  ])

  // "Oferta" sin rebaja no tiene qué mostrar: sale con la foto grande.
  const disenoReal =
    diseno === "oferta" && !rebajaDe(producto) ? "foto" : diseno

  const nombre = `${slugify(producto.nombre) || "producto"}-${formato}.png`
  return new ImageResponse(
    <ImagenDelProducto
      producto={producto}
      tienda={material.tienda}
      estilo={estilo}
      foto={foto}
      qr={qr}
      diseno={disenoReal}
      formato={formato}
    />,
    {
      width: medida.ancho,
      height: medida.alto,
      fonts: fuentes,
      headers: {
        // Privada: es de esta tienda, con sus precios de hoy.
        "Cache-Control": "private, max-age=60",
        ...(consulta.get("descargar")
          ? { "Content-Disposition": `attachment; filename="${nombre}"` }
          : {}),
      },
    }
  )
}
