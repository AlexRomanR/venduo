import type { Publicaciones } from "@/lib/ai/schemas"

/**
 * Los textos para redes en modo demo.
 *
 * Como el catálogo: sin proveedor, derivar la respuesta del esquema daría
 * "texto" en cada campo. Esto arma los textos con el producto real —viene en
 * el contexto— y cambia de tono con cada "Otra versión", así la pantalla se
 * puede mostrar sin red y pasa las mismas validaciones que un modelo.
 */

interface Contexto {
  tienda: string
  producto: {
    nombre: string
    categoria: string | null
    rebaja: number | null
    pocasUnidades: boolean
  }
  vuelta: number
}

function leerContexto(mensaje: string): Contexto | null {
  const crudo = mensaje.match(/<<CONTEXTO>>\s*([\s\S]*?)\s*<<\/CONTEXTO>>/)?.[1]
  try {
    const leido = JSON.parse(crudo ?? "") as Partial<Contexto>
    if (!leido.producto?.nombre) return null
    return {
      tienda: leido.tienda ?? "nuestra tienda",
      producto: {
        nombre: leido.producto.nombre,
        categoria: leido.producto.categoria ?? null,
        rebaja: leido.producto.rebaja ?? null,
        pocasUnidades: Boolean(leido.producto.pocasUnidades),
      },
      vuelta: typeof leido.vuelta === "number" ? leido.vuelta : 0,
    }
  } catch {
    return null
  }
}

/** Una palabra apta para hashtag: sin tildes ni espacios. */
function etiqueta(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .slice(0, 30)
}

export function publicacionesDeDemostracion(
  mensaje: string
): Publicaciones | null {
  const contexto = leerContexto(mensaje)
  if (!contexto) return null
  const { tienda, producto, vuelta } = contexto
  const nombre = producto.nombre

  const rebaja = producto.rebaja
    ? `Ahora con ${producto.rebaja}% de descuento.`
    : null
  const pocas = producto.pocasUnidades ? "Quedan pocas unidades." : null

  const ganchos = [
    `Llegó lo que estabas esperando: ${nombre}.`,
    `¿Ya viste ${nombre}?`,
    `${nombre}, de lo más pedido en ${tienda}.`,
  ]
  const gancho = ganchos[vuelta % ganchos.length]

  const etiquetas = [
    etiqueta(tienda),
    producto.categoria ? etiqueta(producto.categoria) : null,
    "Bolivia",
    "CompraLocal",
    producto.rebaja ? "Oferta" : "Novedad",
  ].filter((valor): valor is string => Boolean(valor && valor.length >= 2))

  return {
    whatsapp: [gancho, rebaja ?? pocas, "Escríbeme y te lo separo."]
      .filter(Boolean)
      .join("\n"),
    instagram: [
      gancho,
      producto.categoria
        ? `Para tu colección de ${producto.categoria.toLowerCase()}, directo de ${tienda}.`
        : `Directo de ${tienda} para ti.`,
      rebaja,
      pocas,
      "Pídelo por mensaje o desde el enlace.",
    ]
      .filter(Boolean)
      .join("\n"),
    facebook: [
      `${gancho} En ${tienda} lo tenemos listo para ti.`,
      rebaja,
      pocas,
      "Mira todos los detalles en el enlace y haz tu pedido por WhatsApp: te respondemos enseguida.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    hashtags: [...new Set(etiquetas)].slice(0, 8),
  }
}
