import {
  CAMPOS_POR_DEFECTO,
  idNuevo,
  type Campos,
  type ClaveHoja,
  type ClavePlantilla,
} from "@/lib/catalogos/constantes"
import type {
  Bloque,
  BloqueDe,
  Catalogo,
  Estilo,
  Pack,
} from "@/lib/catalogos/modelo"
import type { ProductoDelCatalogo } from "@/lib/catalogos/datos"
import {
  acentoCercano,
  contraste,
  problemasDeEstilo,
} from "@/lib/catalogos/estilo"
import { hexAHsl, hslAHex } from "@/lib/plantillas/color"

/*
 * Las doce plantillas de catálogo.
 *
 * Una plantilla no es un dibujo cerrado: es la combinación de bloques y
 * variantes con la que arranca un catálogo, y la hoja en la que va. Después
 * todo se cambia —agregar, quitar, reordenar, cambiar la variante de cualquier
 * bloque—, y por eso un bloque de una plantilla se puede usar en cualquier
 * otra. Los colores y la letra salen siempre de la tienda; lo que hace
 * distinta a cada plantilla es cómo los usa y cómo reparte las hojas.
 */

export interface PlantillaDeCatalogo {
  clave: ClavePlantilla
  nombre: string
  /** Para qué sirve, en una línea. */
  detalle: string
  /** Para qué productos queda bien. */
  ideal: string
  hoja: ClaveHoja
  /** Si arranca con los colores de la tienda invertidos: fondo oscuro. */
  invertido?: boolean
}

export const PLANTILLAS_DE_CATALOGO: Record<
  ClavePlantilla,
  PlantillaDeCatalogo
> = {
  minimal: {
    clave: "minimal",
    nombre: "Grilla minimalista",
    detalle: "Tus productos en orden, nueve por hoja y con mucho aire.",
    ideal: "Todo rubro",
    hoja: "a4",
  },
  revista: {
    clave: "revista",
    nombre: "Revista",
    detalle:
      "Portada con foto y una sección por categoría, con su descripción.",
    ideal: "Moda, hogar, belleza",
    hoja: "a4",
  },
  lookbook: {
    clave: "lookbook",
    nombre: "Lookbook",
    detalle: "Fotos grandes de a dos por hoja, para mostrar cómo se ve.",
    ideal: "Ropa, calzado, accesorios",
    hoja: "a4",
  },
  precios: {
    clave: "precios",
    nombre: "Lista de precios",
    detalle: "Nombre y precio en pocas hojas, para consultar rápido.",
    ideal: "Catálogos grandes, repuestos",
    hoja: "a4",
  },
  destacado: {
    clave: "destacado",
    nombre: "Una foto por hoja",
    detalle: "Cada producto a toda hoja, con su foto y su descripción.",
    ideal: "Lo que se vende por cómo se ve",
    hoja: "a4",
  },
  lujo: {
    clave: "lujo",
    nombre: "Vitrina de lujo",
    detalle: "Fondo oscuro y cada producto en su pedestal, sin apuro.",
    ideal: "Perfumes, joyas, relojes",
    hoja: "a4",
    invertido: true,
  },
  historia: {
    clave: "historia",
    nombre: "Historia vertical",
    detalle: "Hojas 9:16 para ver a pantalla completa, una por producto.",
    ideal: "Estados de WhatsApp, historias",
    hoja: "historia",
  },
  mayorista: {
    clave: "mayorista",
    nombre: "Mayorista",
    detalle: "Código, producto, precio y stock en una tabla.",
    ideal: "Venta por cantidad",
    hoja: "a4",
  },
  feria: {
    clave: "feria",
    nombre: "Feria",
    detalle: "Etiquetas de precio grandes, como en un puesto.",
    ideal: "Liquidaciones, ofertas, ferias",
    hoja: "a4",
  },
  packs: {
    clave: "packs",
    nombre: "Packs y combos",
    detalle: "Tus combos primero, con lo que se ahorra quien compra.",
    ideal: "Regalos, kits, promociones",
    hoja: "a4",
  },
  ofertas: {
    clave: "ofertas",
    nombre: "Ofertas",
    detalle: "Un aviso grande y el descuento de cada producto a la vista.",
    ideal: "Temporadas, liquidaciones",
    hoja: "a4",
  },
  flyer: {
    clave: "flyer",
    nombre: "Flyer",
    detalle: "Una sola hoja con lo mejor, tu contacto y tu QR.",
    ideal: "Imprimir, pegar, mandar",
    hoja: "a4",
  },
}

export interface EntradaDePlantilla {
  plantilla: ClavePlantilla
  nombre: string
  /** Los productos elegidos, en orden. */
  productos: ProductoDelCatalogo[]
  tienda: { nombre: string; whatsapp: string | null }
  estilo: Estilo
  /** Packs ya armados; si la plantilla los necesita y no hay, se arma uno. */
  packs?: Pack[]
  /**
   * El fondo, si se elige a propósito. Sin esto manda la plantilla: la vitrina
   * de lujo arranca oscura y las demás claras.
   */
  invertido?: boolean
}

/** Un catálogo nuevo, con la composición inicial de su plantilla. */
export function armarCatalogo(entrada: EntradaDePlantilla): Catalogo {
  const plantilla = PLANTILLAS_DE_CATALOGO[entrada.plantilla]
  const packs = entrada.packs ?? []
  const base = {
    version: 1 as const,
    nombre: entrada.nombre,
    plantilla: plantilla.clave,
    hoja: plantilla.hoja,
    estilo: {
      ...entrada.estilo,
      invertido: entrada.invertido ?? plantilla.invertido ?? false,
    },
    productos: entrada.productos.map((producto) => producto.id),
    packs,
  }

  const { bloques, packs: packsFinales } = COMPOSICIONES[plantilla.clave](
    entrada,
    packs
  )

  return { ...base, packs: packsFinales, bloques }
}

/**
 * Cambia la composición a la de otra plantilla, conservando lo que la persona
 * eligió: los productos, los packs, el estilo y el nombre.
 */
export function cambiarPlantilla(
  catalogo: Catalogo,
  plantilla: ClavePlantilla,
  productos: ProductoDelCatalogo[],
  tienda: EntradaDePlantilla["tienda"]
): Catalogo {
  return armarCatalogo({
    plantilla,
    nombre: catalogo.nombre,
    productos,
    tienda,
    estilo: catalogo.estilo,
    packs: catalogo.packs,
  })
}

/* ---------------------------------------------------------------------------
 * Las composiciones
 * ------------------------------------------------------------------------ */

type Composicion = (
  entrada: EntradaDePlantilla,
  packs: Pack[]
) => { bloques: Bloque[]; packs: Pack[] }

const campos = (cambios: Partial<Campos> = {}): Campos => ({
  ...CAMPOS_POR_DEFECTO,
  ...cambios,
})

function portada(
  variante: BloqueDe<"portada">["variante"],
  titulo: string,
  bajada: string
): BloqueDe<"portada"> {
  return {
    id: idNuevo("portada"),
    tipo: "portada",
    variante,
    titulo,
    bajada,
    foto: null,
  }
}

function productos(
  variante: BloqueDe<"productos">["variante"],
  porPagina: number,
  cambios: Partial<Campos> = {},
  extra: Partial<Pick<BloqueDe<"productos">, "titulo" | "cuales">> = {}
): BloqueDe<"productos"> {
  return {
    id: idNuevo("productos"),
    tipo: "productos",
    variante,
    titulo: extra.titulo ?? "",
    cuales: extra.cuales ?? { tipo: "todos" },
    porPagina,
    campos: campos(cambios),
  }
}

function contraportada(
  variante: BloqueDe<"contraportada">["variante"],
  tienda: EntradaDePlantilla["tienda"]
): BloqueDe<"contraportada"> {
  return {
    id: idNuevo("contraportada"),
    tipo: "contraportada",
    variante,
    titulo: "¿Te gustó algo?",
    texto:
      "Escríbenos por WhatsApp o compra directo en nuestra tienda online: ahí ves lo que queda de cada producto.",
    redes: "",
    pago: "Arma tu pedido en la tienda online y te llega a nuestro WhatsApp: ahí acordamos el pago.",
    whatsapp: Boolean(tienda.whatsapp),
    qr: true,
  }
}

/**
 * Un separador y su página de productos por cada categoría, en el orden en que
 * aparecen los productos. Lo que no tiene categoría va al final, junto.
 */
function porCategoria(
  lista: ProductoDelCatalogo[],
  hacer: (categoria: string, nombre: string) => Bloque[],
  sueltos: (ids: string[]) => Bloque[]
): Bloque[] {
  const vistas = new Map<string, string>()
  for (const producto of lista) {
    if (producto.categoriaId && !vistas.has(producto.categoriaId)) {
      vistas.set(producto.categoriaId, producto.categoria ?? "Productos")
    }
  }

  const bloques = [...vistas].flatMap(([categoria, nombre]) =>
    hacer(categoria, nombre)
  )
  const sinCategoria = lista
    .filter((producto) => !producto.categoriaId)
    .map((producto) => producto.id)

  return sinCategoria.length > 0
    ? [...bloques, ...sueltos(sinCategoria)]
    : bloques
}

function separador(titulo: string, bajada = ""): BloqueDe<"separador"> {
  return {
    id: idNuevo("separador"),
    tipo: "separador",
    variante: "titulo",
    titulo,
    bajada,
    foto: null,
  }
}

const COMPOSICIONES: Record<ClavePlantilla, Composicion> = {
  minimal: ({ nombre, tienda }, packs) => ({
    bloques: [
      portada("tipografica", tienda.nombre, nombre),
      productos("grilla", 9),
      contraportada("contacto", tienda),
    ],
    packs,
  }),

  revista: ({ nombre, tienda, productos: lista }, packs) => ({
    bloques: [
      portada("foto", tienda.nombre, nombre),
      ...porCategoria(
        lista,
        (categoria, titulo) => [
          { ...separador(titulo), variante: "foto" },
          productos(
            "lista",
            4,
            { descripcion: true },
            { cuales: { tipo: "categoria", categoria } }
          ),
        ],
        (ids) => [
          separador("Y además"),
          productos(
            "lista",
            4,
            { descripcion: true },
            { cuales: { tipo: "elegidos", productos: ids } }
          ),
        ]
      ),
      contraportada("contacto", tienda),
    ],
    packs,
  }),

  lookbook: ({ nombre, tienda }, packs) => ({
    bloques: [
      portada("dividida", tienda.nombre, nombre),
      productos("lookbook", 2, { descripcion: true }),
      contraportada("qr", tienda),
    ],
    packs,
  }),

  precios: ({ nombre, tienda }, packs) => ({
    bloques: [
      productos(
        "menu",
        22,
        { categoria: true },
        { titulo: nombre || "Lista de precios" }
      ),
      contraportada("contacto", tienda),
    ],
    packs,
  }),

  destacado: ({ nombre, tienda }, packs) => ({
    bloques: [
      portada("foto", tienda.nombre, nombre),
      productos("destacado", 1, { descripcion: true, categoria: true }),
      contraportada("contacto", tienda),
    ],
    packs,
  }),

  lujo: ({ nombre, tienda }, packs) => ({
    bloques: [
      portada("marco", tienda.nombre, nombre),
      productos("pedestal", 2, { descripcion: true }),
      {
        id: idNuevo("texto"),
        tipo: "texto",
        variante: "cita",
        titulo: tienda.nombre,
        texto:
          "Cada pieza, elegida a mano. Escríbenos y te asesoramos sin compromiso.",
      },
      contraportada("contacto", tienda),
    ],
    packs,
  }),

  historia: ({ nombre, tienda }, packs) => ({
    bloques: [
      portada("foto", tienda.nombre, nombre),
      productos("historia", 1),
      contraportada("qr", tienda),
    ],
    packs,
  }),

  mayorista: ({ nombre, tienda }, packs) => ({
    bloques: [
      portada("tipografica", tienda.nombre, nombre || "Precios por mayor"),
      productos(
        "tabla",
        18,
        { codigo: true, stock: true },
        { titulo: "Lista mayorista" }
      ),
      {
        id: idNuevo("texto"),
        tipo: "texto",
        variante: "libre",
        titulo: "Condiciones",
        texto:
          "Pedido mínimo, formas de pago y envíos: escríbenos y te pasamos el detalle. Los precios y el stock son los del día en que se armó este catálogo.",
      },
      contraportada("contacto", tienda),
    ],
    packs,
  }),

  feria: ({ nombre, tienda }, packs) => ({
    bloques: [
      portada("collage", tienda.nombre, nombre),
      productos("etiquetas", 6),
      contraportada("contacto", tienda),
    ],
    packs,
  }),

  packs: ({ nombre, tienda, productos: lista }, packs) => {
    const conPacks = packs.length > 0 ? packs : packDeEjemplo(lista)
    return {
      bloques: [
        portada("tipografica", tienda.nombre, nombre),
        ...conPacks.map((pack): BloqueDe<"pack"> => ({
          id: idNuevo("pack"),
          tipo: "pack",
          variante: "tarjeta",
          pack: pack.id,
        })),
        productos("grilla", 6, {}, { titulo: "Y también" }),
        contraportada("contacto", tienda),
      ],
      packs: conPacks,
    }
  },

  ofertas: ({ nombre, tienda }, packs) => ({
    bloques: [
      portada("foto", tienda.nombre, nombre || "Ofertas"),
      {
        id: idNuevo("oferta"),
        tipo: "oferta",
        variante: "banner",
        titulo: "Ofertas de temporada",
        texto: "Por tiempo limitado o hasta que se acaben.",
        etiqueta: "-20%",
      },
      productos("grilla", 6, { precioAnterior: true }),
      contraportada("contacto", tienda),
    ],
    packs,
  }),

  flyer: ({ nombre, productos: lista }, packs) => ({
    bloques: [
      productos(
        "flyer",
        6,
        {},
        {
          titulo: nombre,
          cuales: {
            tipo: "elegidos",
            productos: lista.slice(0, 6).map((producto) => producto.id),
          },
        }
      ),
    ],
    packs,
  }),
}

/**
 * Un pack para empezar: los tres primeros productos, un diez por ciento más
 * barato que por separado y redondeado a bolivianos enteros. Es un ejemplo
 * para editar, no una oferta que la tienda haya decidido.
 */
export function packDeEjemplo(lista: ProductoDelCatalogo[]): Pack[] {
  const primeros = lista.slice(0, 3)
  if (primeros.length < 2) return []
  const suelto = primeros.reduce((total, p) => total + p.precioCents, 0)
  return [
    {
      id: idNuevo("pack"),
      nombre: "Combo de la semana",
      productos: primeros.map((producto) => producto.id),
      precioCents: Math.round((suelto * 0.9) / 100) * 100,
      nota: "Llévalos juntos y ahorra.",
    },
  ]
}

/* ---------------------------------------------------------------------------
 * Con el estilo de la tienda
 * ------------------------------------------------------------------------ */

export type ClaveDeEstiloSugerido = "tienda" | "pleno" | "oscuro" | "tonos"

/** Un estilo sacado de la tienda, con la plantilla que mejor lo luce. */
export interface EstiloSugerido {
  clave: ClaveDeEstiloSugerido
  nombre: string
  detalle: string
  plantilla: ClavePlantilla
  estilo: Estilo
}

/** La plantilla de catálogo que más se parece a la de cada tienda online. */
const PLANTILLA_POR_TIENDA: Record<string, ClavePlantilla> = {
  fashion: "lookbook",
  perfume: "destacado",
  calle: "feria",
  atelier: "lujo",
  pisada: "lookbook",
  formula: "minimal",
  bazar: "precios",
  clasica: "revista",
}

/** La luz más cercana del mismo tono con la que `color` se lee sobre `fondo`. */
function conLuz(color: string, fondo: string, minimo: number): string | null {
  const [tono, saturacion, luz] = hexAHsl(color)
  for (let paso = 0; paso <= 100; paso++) {
    for (const candidata of [luz - paso, luz + paso]) {
      if (candidata < 0 || candidata > 100) continue
      const hex = hslAHex(tono, saturacion, candidata)
      if (contraste(hex, fondo) >= minimo) return hex
    }
  }
  return null
}

/**
 * El acento como fondo de las hojas, con la letra en blanco.
 *
 * Se oscurece lo justo para que el blanco se lea con margen —un rojo vivo no
 * llega a 7:1 con el blanco—, y el acento pasa a ser el mismo tono, claro.
 */
function colorPleno(acento: string): Estilo["colores"] | null {
  const [tono, saturacion, luz] = hexAHsl(acento)
  let fondo: string | null = null
  for (let candidata = Math.min(luz, 60); candidata >= 5; candidata--) {
    const hex = hslAHex(tono, saturacion, candidata)
    if (contraste("#ffffff", hex) >= 7.5) {
      fondo = hex
      break
    }
  }
  if (!fondo) return null
  const claro = hslAHex(tono, Math.min(saturacion, 85), 86)
  const nuevoAcento =
    contraste(claro, fondo) >= 4.5 ? claro : conLuz(claro, fondo, 4.5)
  return nuevoAcento
    ? { papel: fondo, tinta: "#ffffff", acento: nuevoAcento }
    : null
}

/** Todo en la gama del acento: el papel apenas teñido y el texto profundo. */
function tonosDe(acento: string): Estilo["colores"] {
  const [tono, saturacion] = hexAHsl(acento)
  return {
    papel: hslAHex(tono, Math.min(saturacion, 40), 96),
    tinta: hslAHex(tono, Math.min(saturacion, 45), 11),
    acento,
  }
}

/**
 * Los estilos que salen de la tienda: tal cual, su color a toda hoja, en
 * oscuro y en tonos de su color.
 *
 * Se calculan y no se guardan, por la misma razón que la apariencia: si la
 * tienda cambia sus colores, los estilos sugeridos cambian con ella. Uno que
 * no se lee se arregla con el acento más cercano que sí, y si ni así, no se
 * ofrece.
 */
export function estilosDeLaTienda(
  estilo: Estilo,
  plantillaDeLaTienda: string | null
): EstiloSugerido[] {
  const pleno = colorPleno(estilo.colores.acento)
  const candidatos: (EstiloSugerido | null)[] = [
    {
      clave: "tienda",
      nombre: "Tal cual tu tienda",
      detalle:
        "Tus colores, tu letra y tus esquinas, como en tu tienda online.",
      plantilla:
        (plantillaDeLaTienda && PLANTILLA_POR_TIENDA[plantillaDeLaTienda]) ||
        "revista",
      estilo: { ...estilo, invertido: false },
    },
    pleno
      ? {
          clave: "pleno",
          nombre: "Tu color a toda hoja",
          detalle:
            "Las hojas en tu color, con la letra en blanco. Se ve desde lejos.",
          plantilla: "minimal",
          estilo: { ...estilo, invertido: false, colores: pleno },
        }
      : null,
    {
      clave: "oscuro",
      nombre: "Tu tienda en oscuro",
      detalle: "Tus colores invertidos: fondo oscuro para lucir pocas piezas.",
      plantilla: "lujo",
      estilo: { ...estilo, invertido: true },
    },
    {
      clave: "tonos",
      nombre: "Tonos de tu color",
      detalle: "Todo en la gama de tu acento, del más claro al más profundo.",
      plantilla: "feria",
      estilo: {
        ...estilo,
        invertido: false,
        colores: tonosDe(estilo.colores.acento),
      },
    },
  ]

  return candidatos.flatMap((sugerido) => {
    if (!sugerido) return []
    if (problemasDeEstilo(sugerido.estilo).length === 0) return [sugerido]
    const acento = acentoCercano(sugerido.estilo)
    if (!acento) return []
    const arreglado: EstiloSugerido = {
      ...sugerido,
      estilo: {
        ...sugerido.estilo,
        colores: { ...sugerido.estilo.colores, acento },
      },
    }
    return problemasDeEstilo(arreglado.estilo).length === 0 ? [arreglado] : []
  })
}

/** Un catálogo nuevo con un estilo sugerido y su plantilla. */
export function armarConEstilo(
  sugerido: EstiloSugerido,
  entrada: Omit<EntradaDePlantilla, "plantilla" | "estilo" | "invertido">
): Catalogo {
  return armarCatalogo({
    ...entrada,
    plantilla: sugerido.plantilla,
    estilo: sugerido.estilo,
    invertido: sugerido.estilo.invertido,
  })
}
