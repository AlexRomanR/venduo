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
    ideal: "Segunda mano, liquidaciones",
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
    estilo: { ...entrada.estilo, invertido: plantilla.invertido ?? false },
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
    pago: "Pagas con PagoFácil en la tienda online, y tu dinero queda protegido hasta que recibes tu pedido.",
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
        { categoria: true, condicion: false },
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
      productos("pedestal", 2, { descripcion: true, condicion: false }),
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
        { codigo: true, stock: true, condicion: false },
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
      productos("etiquetas", 6, { condicion: true }),
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
