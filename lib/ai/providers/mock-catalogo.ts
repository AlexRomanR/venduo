import { PLANTILLAS_DE_CATALOGO } from "@/lib/catalogos/plantillas"
import type { ClavePlantilla } from "@/lib/catalogos/modelo"
import type { PropuestaDeCatalogo } from "../schemas"

/**
 * El catálogo propuesto en modo demo.
 *
 * Como la propuesta de diseño: sin proveedor, derivar la respuesta del esquema
 * daría siempre lo mismo. Esto lee el pedido por palabras clave y elige entre
 * los productos reales de la tienda —vienen en el contexto—, así que la
 * demostración funciona sin red y pasa las mismas validaciones que un modelo.
 */

interface ProductoLeido {
  id: string
  nombre: string
  categoria: string | null
  rebaja: number | null
  condicion: string
  stock: number
  destacado: boolean
}

interface Contexto {
  tienda: string
  productos: ProductoLeido[]
  actuales: string[] | null
}

function leerContexto(mensaje: string): Contexto {
  const crudo = mensaje.match(/<<CONTEXTO>>\s*([\s\S]*?)\s*<<\/CONTEXTO>>/)?.[1]
  try {
    const leido = JSON.parse(crudo ?? "{}") as Partial<Contexto>
    return {
      tienda: leido.tienda ?? "tu tienda",
      productos: Array.isArray(leido.productos) ? leido.productos : [],
      actuales: Array.isArray(leido.actuales) ? leido.actuales : null,
    }
  } catch {
    return { tienda: "tu tienda", productos: [], actuales: null }
  }
}

/** Sin tildes y en minúsculas: "Liquidación" y "liquidacion" son lo mismo. */
function plano(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

/** Qué plantilla pide la frase, y con qué nombre arranca el catálogo. */
const INTENCIONES: {
  patron: RegExp
  plantilla: ClavePlantilla
  nombre: string
  bajada: string
}[] = [
  {
    patron: /oferta|descuento|rebaj|liquid|promo|black|cyber/,
    plantilla: "ofertas",
    nombre: "Ofertas de la semana",
    bajada: "Hasta agotar stock. Escríbenos y te lo separamos.",
  },
  {
    patron: /segunda|usad|feria|reacondicion/,
    plantilla: "feria",
    nombre: "Feria de segunda mano",
    bajada: "Prendas revisadas, a precio de feria.",
  },
  {
    patron: /mayor|cantidad|revend|distribui/,
    plantilla: "mayorista",
    nombre: "Precios por mayor",
    bajada: "Pedidos por cantidad: escríbenos y te pasamos el detalle.",
  },
  {
    patron: /lista de precios|precios|tarifa/,
    plantilla: "precios",
    nombre: "Lista de precios",
    bajada: "Todo lo que tenemos, con su precio de hoy.",
  },
  {
    patron: /lujo|elegan|perfum|joya|reloj|premium/,
    plantilla: "lujo",
    nombre: "Selección especial",
    bajada: "Pocas piezas, elegidas a mano.",
  },
  {
    patron: /historia|estado|stories|vertical/,
    plantilla: "historia",
    nombre: "Lo nuevo de la semana",
    bajada: "Desliza y escríbenos por lo que te guste.",
  },
  {
    patron: /pack|combo|kit|regalo/,
    plantilla: "packs",
    nombre: "Combos y regalos",
    bajada: "Llévalos juntos y ahorra.",
  },
  {
    patron: /flyer|volante|imprimir|una hoja|una sola/,
    plantilla: "flyer",
    nombre: "Lo más pedido",
    bajada: "Pide por WhatsApp o escanea el QR.",
  },
  {
    patron: /lookbook|look|outfit|temporada|coleccion/,
    plantilla: "lookbook",
    nombre: "Lookbook de temporada",
    bajada: "Así se ve puesto.",
  },
  {
    patron: /revista|novedad|nuevo|lanzamiento|llego|llegaron/,
    plantilla: "revista",
    nombre: "Lo nuevo",
    bajada: "Recién llegado a la tienda.",
  },
]

export function catalogoDeDemostracion(mensaje: string): PropuestaDeCatalogo {
  const pedido = plano(mensaje.match(/Pedido:\s*(.*)/)?.[1] ?? "")
  const { productos: todos, actuales } = leerContexto(mensaje)

  let lista = actuales
    ? todos.filter((producto) => actuales.includes(producto.id))
    : todos
  const criterios: string[] = []

  // Una categoría nombrada en la frase —"zapatillas", "polera"— acota.
  const categorias = [
    ...new Set(lista.map((p) => p.categoria).filter(Boolean)),
  ] as string[]
  const nombradas = categorias.filter((categoria) => {
    const nombre = plano(categoria)
    return (
      pedido.includes(nombre) || pedido.includes(nombre.replace(/e?s$/, ""))
    )
  })
  if (nombradas.length > 0) {
    lista = lista.filter(
      (producto) => producto.categoria && nombradas.includes(producto.categoria)
    )
  }

  const intencion = INTENCIONES.find(({ patron }) => patron.test(pedido))
  const plantilla = intencion?.plantilla ?? "minimal"

  if (plantilla === "ofertas") {
    const rebajados = lista.filter((producto) => producto.rebaja)
    if (rebajados.length > 0) {
      lista = rebajados
      criterios.push("con descuento")
    }
  }
  if (plantilla === "feria") {
    const usados = lista.filter((producto) => producto.condicion !== "nuevo")
    if (usados.length > 0) {
      lista = usados
      criterios.push("de segunda mano")
    }
  }

  // Lo agotado afuera, salvo que lo pidan; lo destacado, primero.
  if (!/agotad/.test(pedido)) {
    const conStock = lista.filter((producto) => producto.stock > 0)
    if (conStock.length > 0) lista = conStock
  }
  lista = [
    ...lista.filter((producto) => producto.destacado),
    ...lista.filter((producto) => !producto.destacado),
  ]
  if (plantilla === "flyer") lista = lista.slice(0, 6)
  if (lista.length === 0) lista = todos.slice(0, 12)

  const categoria = nombradas.length === 1 ? nombradas[0] : null
  const nombre = categoria
    ? plantilla === "ofertas"
      ? `${categoria} en oferta`
      : categoria
    : (intencion?.nombre ?? "Nuestro catálogo")
  const definicion = PLANTILLAS_DE_CATALOGO[plantilla]
  // "Elegí 4 zapatillas con descuento" y no "4 productos zapatillas": la
  // categoría, si la nombró, es el sustantivo de la frase.
  const sustantivo =
    nombradas.length > 0
      ? nombradas.map((c) => c.toLowerCase()).join(" y ")
      : "productos"
  const cantidad =
    lista.length === 1
      ? `un producto${nombradas.length > 0 ? ` de ${sustantivo}` : ""}`
      : `${lista.length} ${sustantivo}`

  return {
    nombre: nombre.slice(0, 60),
    plantilla,
    productos: lista.slice(0, 60).map((producto) => producto.id),
    bajada: intencion?.bajada ?? "Escríbenos por WhatsApp y te lo separamos.",
    explicacion:
      `Elegí ${cantidad}${criterios.length ? ` ${criterios.join(" y ")}` : ""}, ` +
      `lo destacado primero, y la plantilla ${definicion.nombre}: ` +
      `${definicion.detalle.charAt(0).toLowerCase()}${definicion.detalle.slice(1)}`,
  }
}
