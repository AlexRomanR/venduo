import {
  CAMPOS_POR_DEFECTO,
  VARIANTES,
  idNuevo,
  type TipoDeBloque,
} from "@/lib/catalogos/constantes"
import type { Bloque, BloqueDe, Catalogo, Pack } from "@/lib/catalogos/modelo"

/*
 * Lo que el editor le hace a un catálogo, sin pantalla de por medio.
 *
 * Funciones puras: reciben un catálogo y devuelven otro. El editor las llama
 * en cada toque, y mantenerlas acá deja una sola regla por cambio —qué pasa
 * con los packs cuando se quita un producto, por ejemplo— en vez de una por
 * botón.
 */

/** Un bloque nuevo de un tipo, con su primera variante y textos para empezar. */
export function bloqueNuevo(
  tipo: TipoDeBloque,
  catalogo: Catalogo,
  tienda: { nombre: string; whatsapp: string | null }
): Bloque {
  const id = idNuevo(tipo)
  switch (tipo) {
    case "portada":
      return {
        id,
        tipo,
        variante: "foto",
        titulo: tienda.nombre,
        bajada: catalogo.nombre,
        foto: null,
      }
    case "productos":
      return {
        id,
        tipo,
        variante: "grilla",
        titulo: "",
        cuales: { tipo: "todos" },
        porPagina: 6,
        campos: CAMPOS_POR_DEFECTO,
      }
    case "separador":
      return {
        id,
        tipo,
        variante: "titulo",
        titulo: "Nueva sección",
        bajada: "",
        foto: null,
      }
    case "pack":
      return {
        id,
        tipo,
        variante: "tarjeta",
        pack: catalogo.packs[0]?.id ?? "",
      }
    case "oferta":
      return {
        id,
        tipo,
        variante: "banner",
        titulo: "Ofertas de temporada",
        texto: "Por tiempo limitado o hasta que se acaben.",
        etiqueta: "-20%",
      }
    case "contraportada":
      return {
        id,
        tipo,
        variante: "contacto",
        titulo: "¿Te gustó algo?",
        texto:
          "Escríbenos por WhatsApp o compra directo en nuestra tienda online.",
        redes: "",
        pago: "Arma tu pedido en la tienda online y te llega a nuestro WhatsApp: ahí acordamos el pago.",
        whatsapp: Boolean(tienda.whatsapp),
        qr: true,
      }
    case "texto":
      return { id, tipo, variante: "libre", titulo: "", texto: "" }
  }
}

/**
 * Agrega un bloque donde tiene sentido: después del elegido, o antes de la
 * contraportada, que casi siempre es la última hoja.
 */
export function agregarBloque(
  catalogo: Catalogo,
  bloque: Bloque,
  despuesDe: string | null
): Catalogo {
  const bloques = [...catalogo.bloques]
  const elegido = despuesDe
    ? bloques.findIndex((otro) => otro.id === despuesDe)
    : -1
  const contraportada = bloques.findIndex(
    (otro) => otro.tipo === "contraportada"
  )
  const lugar =
    elegido >= 0
      ? elegido + 1
      : bloque.tipo !== "contraportada" && contraportada >= 0
        ? contraportada
        : bloques.length
  bloques.splice(lugar, 0, bloque)
  return { ...catalogo, bloques }
}

export function cambiarBloque(catalogo: Catalogo, bloque: Bloque): Catalogo {
  return {
    ...catalogo,
    bloques: catalogo.bloques.map((otro) =>
      otro.id === bloque.id ? bloque : otro
    ),
  }
}

export function quitarBloque(catalogo: Catalogo, id: string): Catalogo {
  return {
    ...catalogo,
    bloques: catalogo.bloques.filter((bloque) => bloque.id !== id),
  }
}

export function duplicarBloque(catalogo: Catalogo, id: string): Catalogo {
  const original = catalogo.bloques.find((bloque) => bloque.id === id)
  if (!original) return catalogo
  return agregarBloque(
    catalogo,
    { ...original, id: idNuevo(original.tipo) },
    original.id
  )
}

export function moverBloque(
  catalogo: Catalogo,
  id: string,
  posicion: number
): Catalogo {
  const bloques = [...catalogo.bloques]
  const desde = bloques.findIndex((bloque) => bloque.id === id)
  if (desde < 0) return catalogo
  const [bloque] = bloques.splice(desde, 1)
  bloques.splice(Math.max(0, Math.min(posicion, bloques.length)), 0, bloque)
  return { ...catalogo, bloques }
}

/** Cambia la variante sin perder lo escrito: todas leen los mismos campos. */
export function cambiarVariante<T extends TipoDeBloque>(
  bloque: BloqueDe<T>,
  variante: keyof (typeof VARIANTES)[T]
): BloqueDe<T> {
  return { ...bloque, variante }
}

/* ---------------------------------------------------------------------------
 * Productos
 * ------------------------------------------------------------------------ */

/**
 * Cambia los productos elegidos y arrastra el cambio a todo lo que los nombra.
 *
 * Un producto que sale del catálogo sale también de las hojas que lo listan a
 * mano y de los packs. Un pack que se queda con menos de dos productos deja de
 * ser un pack: se quita, con sus hojas.
 */
export function ponerProductos(catalogo: Catalogo, ids: string[]): Catalogo {
  const quedan = new Set(ids)
  const packs = catalogo.packs
    .map((pack) => ({
      ...pack,
      productos: pack.productos.filter((id) => quedan.has(id)),
    }))
    .filter((pack) => pack.productos.length >= 2)
  const packsVivos = new Set(packs.map((pack) => pack.id))

  const bloques = catalogo.bloques
    .filter((bloque) => bloque.tipo !== "pack" || packsVivos.has(bloque.pack))
    .map((bloque) =>
      bloque.tipo === "productos" && bloque.cuales.tipo === "elegidos"
        ? {
            ...bloque,
            cuales: {
              tipo: "elegidos" as const,
              productos: bloque.cuales.productos.filter((id) => quedan.has(id)),
            },
          }
        : bloque
    )

  return { ...catalogo, productos: ids, packs, bloques }
}

/* ---------------------------------------------------------------------------
 * Packs
 * ------------------------------------------------------------------------ */

/** El descuento con el que nace un combo: 10%, en puntos básicos. */
export const DESCUENTO_INICIAL_BPS = 1000

/**
 * Lo que cuestan los productos por separado, menos el descuento, redondeado a
 * bolivianos enteros. Un producto repetido cuenta las dos veces.
 */
export function precioConDescuento(
  productos: string[],
  precios: Record<string, number>,
  descuentoBps: number
): number {
  const suelto = productos.reduce((total, id) => total + (precios[id] ?? 0), 0)
  const bps = Math.min(Math.max(Math.round(descuentoBps), 0), 9000)
  return Math.round((suelto * (10000 - bps)) / 10000 / 100) * 100
}

/** El precio con el que nace un combo: diez por ciento menos, en bolivianos enteros. */
export function precioSugerido(
  productos: string[],
  precios: Record<string, number>
): number {
  return precioConDescuento(productos, precios, DESCUENTO_INICIAL_BPS)
}

/**
 * Los productos de un combo, con su precio al día: si el combo tiene
 * descuento, el precio sale de la suma de todos sus productos; si el precio
 * se escribió a mano, se respeta.
 */
export function ponerProductosAlPack(
  pack: Pack,
  productos: string[],
  precios: Record<string, number>
): Pack {
  return {
    ...pack,
    productos,
    precioCents:
      pack.descuentoBps == null
        ? pack.precioCents
        : precioConDescuento(productos, precios, pack.descuentoBps),
  }
}

/** El descuento elegido para un combo, con el precio que le corresponde. */
export function ponerDescuentoAlPack(
  pack: Pack,
  descuentoBps: number,
  precios: Record<string, number>
): Pack {
  const bps = Math.min(Math.max(Math.round(descuentoBps), 0), 9000)
  return {
    ...pack,
    descuentoBps: bps,
    precioCents: precioConDescuento(pack.productos, precios, bps),
  }
}

/** Un precio escrito a mano: deja de seguir al descuento. */
export function ponerPrecioAlPack(pack: Pack, precioCents: number): Pack {
  return { ...pack, precioCents, descuentoBps: null }
}

/**
 * Un pack con los dos primeros productos que hay, y su hoja.
 *
 * Nace al diez por ciento menos de lo que cuestan por separado, redondeado a
 * bolivianos enteros, y el editor dice que es una sugerencia que se cambia.
 * Si su precio queda en cero, `faltantes` no deja guardar ni mandar.
 */
export function agregarPack(
  catalogo: Catalogo,
  precios: Record<string, number>,
  agotados: ReadonlySet<string> = new Set()
): { catalogo: Catalogo; pack: Pack } {
  const conStock = catalogo.productos.filter((id) => !agotados.has(id))
  const productos = (
    conStock.length >= 2 ? conStock : catalogo.productos
  ).slice(0, 2)
  const pack: Pack = {
    id: idNuevo("pack"),
    nombre: `Combo ${catalogo.packs.length + 1}`,
    productos,
    precioCents: precioSugerido(productos, precios),
    descuentoBps: DESCUENTO_INICIAL_BPS,
    nota: "",
  }
  const conPack = { ...catalogo, packs: [...catalogo.packs, pack] }
  const hoja: BloqueDe<"pack"> = {
    id: idNuevo("pack"),
    tipo: "pack",
    variante: "tarjeta",
    pack: pack.id,
  }
  return { catalogo: agregarBloque(conPack, hoja, null), pack }
}

export function cambiarPack(catalogo: Catalogo, pack: Pack): Catalogo {
  return {
    ...catalogo,
    packs: catalogo.packs.map((otro) => (otro.id === pack.id ? pack : otro)),
  }
}

export function quitarPack(catalogo: Catalogo, id: string): Catalogo {
  return {
    ...catalogo,
    packs: catalogo.packs.filter((pack) => pack.id !== id),
    bloques: catalogo.bloques.filter(
      (bloque) => bloque.tipo !== "pack" || bloque.pack !== id
    ),
  }
}

/* ---------------------------------------------------------------------------
 * Lo que impide guardar o descargar
 * ------------------------------------------------------------------------ */

/**
 * Lo que el esquema rechazaría, dicho antes de intentarlo.
 *
 * El servidor valida igual; esto es para que el botón explique por qué no
 * anda en vez de fallar.
 */
export function faltantes(catalogo: Catalogo): string[] {
  const faltan: string[] = []
  if (!catalogo.nombre.trim()) faltan.push("Ponle un nombre al catálogo.")
  if (catalogo.bloques.length === 0) {
    faltan.push("El catálogo no tiene hojas: agrega una.")
  }
  if (
    catalogo.bloques.some(
      (bloque) =>
        bloque.tipo === "pack" &&
        !catalogo.packs.some((pack) => pack.id === bloque.pack)
    )
  ) {
    faltan.push("Hay una hoja de combo sin combo elegido.")
  }
  for (const pack of catalogo.packs) {
    const seMuestra = catalogo.bloques.some(
      (bloque) => bloque.tipo === "pack" && bloque.pack === pack.id
    )
    if (seMuestra && pack.precioCents <= 0) {
      faltan.push(
        `Ponle precio al combo «${pack.nombre.trim() || "sin nombre"}».`
      )
    }
  }
  return faltan
}

/** Las que admite el esquema del catálogo. */
const MAXIMO_DE_PARTES = 40

/** Lo que la persona escribe o elige en cada parte, sin su diseño. */
const LO_EDITABLE: Record<TipoDeBloque, string[]> = {
  portada: ["titulo", "bajada", "foto"],
  productos: ["titulo", "cuales"],
  separador: ["titulo", "bajada", "foto"],
  pack: ["pack"],
  oferta: ["titulo", "texto", "etiqueta"],
  contraportada: ["titulo", "texto", "redes", "pago", "whatsapp", "qr"],
  texto: ["titulo", "texto"],
}

function porTipo(bloques: Bloque[]) {
  const grupos = new Map<TipoDeBloque, Bloque[]>()
  for (const bloque of bloques) {
    grupos.set(bloque.tipo, [...(grupos.get(bloque.tipo) ?? []), bloque])
  }
  return grupos
}

/**
 * Pasa a una plantilla nueva lo que la persona hizo en la anterior.
 *
 * `base` es la plantilla anterior tal como vino: lo que difiere de ella es lo
 * editado. Los textos van a la parte equivalente de la nueva (la primera oferta
 * a la primera oferta); una parte agregada, o una editada sin equivalente, se
 * mantiene antes de la contraportada. El diseño es siempre el de la nueva.
 */
export function conservarEdicion(
  actual: Catalogo,
  base: Catalogo,
  nueva: Catalogo
): { catalogo: Catalogo; conservados: number } {
  const originales = porTipo(base.bloques)
  const destinos = porTipo(nueva.bloques)
  const vistos = new Map<TipoDeBloque, number>()
  const bloques = [...nueva.bloques]
  const sinLugar: Bloque[] = []
  let conservados = 0

  for (const bloque of actual.bloques) {
    const indice = vistos.get(bloque.tipo) ?? 0
    vistos.set(bloque.tipo, indice + 1)
    const original = originales.get(bloque.tipo)?.[indice]
    if (!original) {
      sinLugar.push(bloque)
      conservados++
      continue
    }

    const propio = bloque as unknown as Record<string, unknown>
    const deBase = original as unknown as Record<string, unknown>
    const editados = LO_EDITABLE[bloque.tipo].filter(
      (campo) => JSON.stringify(propio[campo]) !== JSON.stringify(deBase[campo])
    )
    if (editados.length === 0) continue
    conservados++

    const destino = destinos.get(bloque.tipo)?.[indice]
    if (!destino) {
      sinLugar.push(bloque)
      continue
    }
    bloques[bloques.indexOf(destino)] = {
      ...destino,
      ...Object.fromEntries(editados.map((campo) => [campo, propio[campo]])),
    } as Bloque
  }

  const cierre = bloques.findIndex((b) => b.tipo === "contraportada")
  bloques.splice(cierre === -1 ? bloques.length : cierre, 0, ...sinLugar)
  return {
    catalogo: { ...nueva, bloques: bloques.slice(0, MAXIMO_DE_PARTES) },
    conservados,
  }
}
