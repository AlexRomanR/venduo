import type {
  Bloque,
  BloqueDe,
  Catalogo,
  Cuales,
  Pack,
} from "@/lib/catalogos/modelo"
import type { EstiloResuelto } from "@/lib/catalogos/estilo"

/*
 * Lo que necesita el dibujo de un catálogo, ya leído de la base.
 *
 * El catálogo guarda ids; esto es lo que esos ids son hoy. El servidor lo arma
 * para el PDF —con las fotos ya convertidas a JPEG— y la página del editor
 * para la vista previa, con las URLs de siempre. Los dos le pasan lo mismo al
 * mismo dibujo, y por eso lo que se ve al editar es lo que sale en el archivo.
 */

export type Condicion = "nuevo" | "segunda_mano" | "reacondicionado"

export interface ProductoDelCatalogo {
  id: string
  nombre: string
  descripcion: string | null
  precioCents: number
  /** El precio anterior, si es mayor que el actual: es lo que marca el descuento. */
  precioAnteriorCents: number | null
  stock: number
  /** La categoría para filtrar. Sin tabla de categorías, sale del nombre. */
  categoriaId: string | null
  categoria: string | null
  condicion: Condicion
  codigo: string | null
  /** La foto de portada: una URL en la vista previa, un JPEG en el PDF. */
  foto: string | null
  destacado: boolean
}

export interface TiendaDelCatalogo {
  nombre: string
  logo: string | null
  /** El número como lo cargó la tienda, para mostrarlo. */
  whatsapp: string | null
  /** El enlace de la tienda online, para el QR y la contraportada. */
  url: string
  /** El mismo enlace sin el protocolo, para leerlo en voz alta. */
  enlace: string
  /** El QR de la tienda, como imagen PNG. */
  qr: string | null
}

export interface DatosDelCatalogo {
  tienda: TiendaDelCatalogo
  /** Todo el catálogo de la tienda, por id. */
  productos: Record<string, ProductoDelCatalogo>
  categorias: { id: string; nombre: string }[]
  /** El día de los precios y el stock, dicho completo: "1 de octubre de 2026". */
  fecha: string
}

/** Todo lo que un bloque necesita para dibujarse, el mismo en las dos salidas. */
export interface Contexto {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  estilo: EstiloResuelto
  hoja: { ancho: number; alto: number }
  /** La hoja que se dibuja y cuántas hay, para el pie. */
  numero: number
  total: number
}

export const CONDICIONES: Record<Condicion, string> = {
  nuevo: "Nuevo",
  segunda_mano: "Segunda mano",
  reacondicionado: "Reacondicionado",
}

/**
 * Los productos elegidos que siguen existiendo, en su orden.
 *
 * Un producto borrado de la tienda después de armar el catálogo desaparece
 * del PDF en silencio: mostrarlo sería vender algo que ya no está.
 */
export function elegidos(
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): ProductoDelCatalogo[] {
  return catalogo.productos
    .map((id) => datos.productos[id])
    .filter((producto): producto is ProductoDelCatalogo => Boolean(producto))
}

/** Los productos que muestra una página de productos. */
export function productosDe(
  cuales: Cuales,
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): ProductoDelCatalogo[] {
  const lista = elegidos(catalogo, datos)
  if (cuales.tipo === "todos") return lista
  if (cuales.tipo === "categoria") {
    return lista.filter((producto) => producto.categoriaId === cuales.categoria)
  }
  return cuales.productos
    .map((id) => datos.productos[id])
    .filter((producto): producto is ProductoDelCatalogo => Boolean(producto))
}

/** Los productos de un pack que siguen existiendo. */
export function productosDelPack(
  pack: Pack,
  datos: DatosDelCatalogo
): ProductoDelCatalogo[] {
  return pack.productos
    .map((id) => datos.productos[id])
    .filter((producto): producto is ProductoDelCatalogo => Boolean(producto))
}

/** Lo que costarían los productos de un pack comprados por separado. */
export function precioSuelto(productos: ProductoDelCatalogo[]): number {
  return productos.reduce((total, producto) => total + producto.precioCents, 0)
}

/**
 * Una hoja del catálogo: qué bloque la dibuja y, si es de productos, cuáles.
 *
 * Las hojas se cuentan antes de dibujar, en vez de dejar que el PDF corte
 * donde caiga: así la vista previa y el archivo tienen las mismas hojas, y el
 * pie puede decir "3 de 8" desde la primera.
 */
export type Hoja =
  | { clase: "simple"; bloque: Exclude<Bloque, BloqueDe<"productos" | "pack">> }
  | {
      clase: "productos"
      bloque: BloqueDe<"productos">
      productos: ProductoDelCatalogo[]
      /** La hoja dentro del bloque, desde 0, y cuántas tiene el bloque. */
      parte: number
      partes: number
    }
  | {
      clase: "pack"
      bloque: BloqueDe<"pack">
      pack: Pack
      productos: ProductoDelCatalogo[]
    }

/** Las hojas de un catálogo, en orden. Un bloque sin nada que mostrar no ocupa hoja. */
export function hojasDe(catalogo: Catalogo, datos: DatosDelCatalogo): Hoja[] {
  const hojas: Hoja[] = []

  for (const bloque of catalogo.bloques) {
    if (bloque.tipo === "productos") {
      const productos = productosDe(bloque.cuales, catalogo, datos)
      const porHoja = Math.max(1, bloque.porPagina)
      const partes = Math.ceil(productos.length / porHoja)
      for (let parte = 0; parte < partes; parte++) {
        hojas.push({
          clase: "productos",
          bloque,
          productos: productos.slice(parte * porHoja, (parte + 1) * porHoja),
          parte,
          partes,
        })
      }
      continue
    }

    if (bloque.tipo === "pack") {
      const pack = catalogo.packs.find((p) => p.id === bloque.pack)
      if (!pack) continue
      const productos = productosDelPack(pack, datos)
      if (productos.length === 0) continue
      hojas.push({ clase: "pack", bloque, pack, productos })
      continue
    }

    hojas.push({ clase: "simple", bloque })
  }

  return hojas
}

/** Cuántas hojas ocupa un bloque, para decirlo en el editor. */
export function hojasDelBloque(
  bloque: Bloque,
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): number {
  return hojasDe({ ...catalogo, bloques: [bloque] }, datos).length
}

/**
 * La foto de un separador: la elegida o, si no, la del primer producto de la
 * sección que abre. Así un separador de "Zapatillas" muestra una zapatilla.
 */
export function fotoDeSeparador(
  bloque: BloqueDe<"separador">,
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): string | null {
  if (bloque.foto && datos.productos[bloque.foto]?.foto) {
    return datos.productos[bloque.foto].foto
  }
  // La foto de una portada no se repite en el separador que la sigue: dos
  // hojas seguidas con la misma foto parecen un error de impresión.
  const enPortadas = new Set(
    catalogo.bloques
      .filter((otro): otro is BloqueDe<"portada"> => otro.tipo === "portada")
      .map((portada) => fotoDeBloque(portada.foto, catalogo, datos))
  )
  const indice = catalogo.bloques.findIndex((otro) => otro.id === bloque.id)
  const seccion = catalogo.bloques
    .slice(indice + 1)
    .find((otro): otro is BloqueDe<"productos"> => otro.tipo === "productos")
  const conFoto = seccion
    ? productosDe(seccion.cuales, catalogo, datos).filter((p) => p.foto)
    : []
  const elegida = conFoto.find((p) => !enPortadas.has(p.foto)) ?? conFoto[0]
  return elegida?.foto ?? fotoDeBloque(null, catalogo, datos)
}

/** El producto cuya foto va en una portada o un separador, o el primero que tenga foto. */
export function fotoDeBloque(
  foto: string | null,
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): string | null {
  if (foto && datos.productos[foto]?.foto) return datos.productos[foto].foto
  return (
    elegidos(catalogo, datos).find((producto) => producto.foto)?.foto ?? null
  )
}

/**
 * Lo que se le puede pedir a la IA, con lo que esta tienda vende.
 *
 * Un "Las zapatillas en oferta" fijo no le dice nada a quien vende relojes:
 * la primera idea sale de su categoría con más rebajas, o de la más grande.
 * Las otras dos sirven en cualquier rubro.
 */
export function ideasParaLaIa(datos: DatosDelCatalogo): string[] {
  const productos = Object.values(datos.productos)

  const contar = (lista: ProductoDelCatalogo[]) => {
    const cuenta = new Map<string, number>()
    for (const producto of lista) {
      if (!producto.categoria) continue
      cuenta.set(producto.categoria, (cuenta.get(producto.categoria) ?? 0) + 1)
    }
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  }

  const conRebaja = productos.filter(
    (producto) =>
      producto.precioAnteriorCents !== null &&
      producto.precioAnteriorCents > producto.precioCents
  )
  const enOferta = contar(conRebaja)
  const masGrande = contar(productos)

  const primera = enOferta
    ? `${enOferta} en oferta`
    : conRebaja.length > 0
      ? "Lo que está en oferta"
      : masGrande
        ? `Solo ${masGrande.toLowerCase()}`
        : null

  return [
    ...(primera ? [primera] : []),
    "Lista de precios para revendedores",
    "Lo nuevo para los estados de WhatsApp",
  ]
}
