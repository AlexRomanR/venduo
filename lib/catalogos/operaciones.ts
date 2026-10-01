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
        pago: "Pagas con PagoFácil en la tienda online, y tu dinero queda protegido hasta que recibes tu pedido.",
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

/** Un pack con los primeros productos, al diez por ciento menos, y su hoja. */
export function agregarPack(
  catalogo: Catalogo,
  precios: Record<string, number>
): { catalogo: Catalogo; pack: Pack } {
  const productos = catalogo.productos.slice(0, 2)
  const suelto = productos.reduce((total, id) => total + (precios[id] ?? 0), 0)
  const pack: Pack = {
    id: idNuevo("pack"),
    nombre: `Combo ${catalogo.packs.length + 1}`,
    productos,
    precioCents: Math.round((suelto * 0.9) / 100) * 100,
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
    faltan.push("Hay una hoja de pack sin pack elegido.")
  }
  return faltan
}
