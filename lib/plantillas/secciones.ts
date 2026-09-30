import { z } from "zod"

import { CONDICIONES, type TipoDeBloque } from "@/lib/plantillas/bloques"

/**
 * Las secciones que se pueden poner en la portada, dichas para una persona.
 *
 * `block_types` guarda el esquema de cada tipo para la base; esto es lo mismo
 * contado para el editor y para la IA: qué nombre tiene cada sección, qué
 * campos se le pueden cambiar, con qué etiqueta y hasta qué largo. De esta
 * tabla salen los formularios **y** los esquemas zod con los que se valida lo
 * que escribe una persona o propone la IA, así que las dos cosas no pueden
 * desencontrarse.
 *
 * Los límites copian los de `block_types.props_schema`. Lo que la base acepta
 * y el editor no ofrece —los enlaces de los botones, que ningún kit usa: todos
 * llevan al catálogo— se deja afuera a propósito.
 *
 * Sin dependencias de servidor: lo lee el editor, que corre en el navegador.
 */

interface CampoBase {
  clave: string
  etiqueta: string
  ayuda?: string
}

export type CampoDeTexto = CampoBase & {
  tipo: "texto" | "parrafo"
  max: number
  requerido?: boolean
  ejemplo?: string
}

export type Campo =
  | CampoDeTexto
  | (CampoBase & { tipo: "imagen" })
  | (CampoBase & { tipo: "numero"; min: number; max: number })
  | (CampoBase & {
      tipo: "opciones"
      opciones: Array<{ valor: string; etiqueta: string }>
    })
  | (CampoBase & { tipo: "interruptor" })
  /** El nombre de una categoría del catálogo de la tienda. */
  | (CampoBase & { tipo: "categoria" })
  | (CampoBase & {
      tipo: "lista"
      /** Cómo se llama un elemento: "pregunta", "testimonio". */
      elemento: string
      max: number
      campos: CampoDeTexto[]
    })

export interface DefinicionDeSeccion {
  tipo: TipoDeBloque
  nombre: string
  /** Una línea: qué le aporta a la tienda. La lee quien elige qué agregar. */
  descripcion: string
  /** Cuántas puede haber en la portada. `null` es sin límite. */
  maximo: number | null
  campos: Campo[]
  /** Con qué nace al agregarla: un ejemplo que se entiende, no un vacío. */
  inicial: Record<string, unknown>
}

const TITULO: CampoDeTexto = {
  clave: "title",
  etiqueta: "Título",
  tipo: "texto",
  max: 120,
  requerido: true,
}

export const SECCIONES: Record<TipoDeBloque, DefinicionDeSeccion> = {
  hero: {
    tipo: "hero",
    nombre: "Portada",
    descripcion: "Lo primero que ve tu cliente: un título grande y una foto.",
    maximo: 1,
    campos: [
      { ...TITULO, ejemplo: "Nueva temporada" },
      {
        clave: "subtitle",
        etiqueta: "Bajada",
        tipo: "parrafo",
        max: 240,
        ayuda: "Una o dos líneas que cuenten qué vendes.",
      },
      {
        clave: "ctaLabel",
        etiqueta: "Texto del botón",
        tipo: "texto",
        max: 40,
        ejemplo: "Ver la colección",
      },
      {
        clave: "imageUrl",
        etiqueta: "Foto de fondo",
        tipo: "imagen",
        ayuda: "Si no eliges una, usamos la de tu producto destacado.",
      },
    ],
    inicial: {
      title: "Bienvenido",
      subtitle: "Cuéntale a tu cliente qué vendes y por qué comprarte a ti.",
      ctaLabel: "Ver la colección",
    },
  },

  categories: {
    tipo: "categories",
    nombre: "Categorías",
    descripcion: "Tus categorías con una foto cada una, para comprar por tipo.",
    maximo: 1,
    campos: [
      { ...TITULO, ejemplo: "Compra por categoría" },
      { clave: "subtitle", etiqueta: "Bajada", tipo: "parrafo", max: 240 },
      {
        clave: "limit",
        etiqueta: "Cuántas mostrar",
        tipo: "numero",
        min: 2,
        max: 12,
      },
    ],
    inicial: { title: "Compra por categoría", limit: 6 },
  },

  product_grid: {
    tipo: "product_grid",
    nombre: "Productos",
    descripcion:
      "Una vitrina de tus productos: lo nuevo, ofertas o una categoría.",
    maximo: null,
    campos: [
      { ...TITULO, ejemplo: "Lo más pedido" },
      {
        clave: "condition",
        etiqueta: "Qué productos",
        tipo: "opciones",
        opciones: [
          { valor: "todos", etiqueta: "Todos" },
          ...Object.entries(CONDICIONES).map(([valor, etiqueta]) => ({
            valor,
            etiqueta,
          })),
        ],
      },
      {
        clave: "category",
        etiqueta: "De una categoría",
        tipo: "categoria",
        ayuda: "Déjalo vacío para mostrar de todas.",
      },
      {
        clave: "featured",
        etiqueta: "Solo los destacados",
        tipo: "interruptor",
      },
      {
        clave: "limit",
        etiqueta: "Cuántos mostrar",
        tipo: "numero",
        min: 1,
        max: 48,
      },
      {
        clave: "columns",
        etiqueta: "Columnas en la computadora",
        tipo: "numero",
        min: 2,
        max: 4,
        ayuda: "En el celular siempre van de a dos.",
      },
    ],
    inicial: {
      title: "Nuestros productos",
      condition: "todos",
      limit: 8,
      columns: 4,
    },
  },

  about: {
    tipo: "about",
    nombre: "Sobre el negocio",
    descripcion:
      "Tu historia en pocas líneas: quién está detrás y qué te distingue.",
    maximo: null,
    campos: [
      { ...TITULO, ejemplo: "Quiénes somos" },
      {
        clave: "body",
        etiqueta: "Texto",
        tipo: "parrafo",
        max: 1200,
        requerido: true,
      },
      { clave: "imageUrl", etiqueta: "Foto", tipo: "imagen" },
    ],
    inicial: {
      title: "Quiénes somos",
      body: "Cuenta cómo empezó tu negocio, qué te importa al elegir cada producto y por qué tus clientes vuelven.",
    },
  },

  testimonials: {
    tipo: "testimonials",
    nombre: "Testimonios",
    descripcion:
      "Lo que dicen tus clientes. Da confianza a quien compra por primera vez.",
    maximo: 1,
    campos: [
      { ...TITULO, ejemplo: "Lo que dicen" },
      {
        clave: "items",
        etiqueta: "Testimonios",
        tipo: "lista",
        elemento: "testimonio",
        max: 6,
        campos: [
          {
            clave: "quote",
            etiqueta: "Lo que dijo",
            tipo: "parrafo",
            max: 400,
            requerido: true,
          },
          {
            clave: "author",
            etiqueta: "Quién lo dijo",
            tipo: "texto",
            max: 80,
            requerido: true,
          },
        ],
      },
    ],
    inicial: {
      title: "Lo que dicen",
      items: [
        {
          quote: "Llegó rápido y tal cual la foto. Ya hice mi segundo pedido.",
          author: "Carla, Cochabamba",
        },
      ],
    },
  },

  cta: {
    tipo: "cta",
    nombre: "Llamado a la acción",
    descripcion: "Un cierre con un botón grande que lleva a tu catálogo.",
    maximo: null,
    campos: [
      { ...TITULO, ejemplo: "¿Hacemos negocio?" },
      { clave: "body", etiqueta: "Texto", tipo: "parrafo", max: 400 },
      {
        clave: "buttonLabel",
        etiqueta: "Texto del botón",
        tipo: "texto",
        max: 40,
        requerido: true,
      },
    ],
    inicial: {
      title: "¿Buscas algo en especial?",
      body: "Escríbenos por WhatsApp y te ayudamos a elegir.",
      buttonLabel: "Ver la colección",
    },
  },

  contact: {
    tipo: "contact",
    nombre: "Contacto",
    descripcion: "Dónde encontrarte y en qué horario.",
    maximo: 1,
    campos: [
      { ...TITULO, ejemplo: "Contacto" },
      {
        clave: "whatsapp",
        etiqueta: "WhatsApp",
        tipo: "texto",
        max: 30,
        ejemplo: "+591 70000000",
      },
      { clave: "address", etiqueta: "Dirección", tipo: "texto", max: 200 },
      { clave: "hours", etiqueta: "Horario", tipo: "texto", max: 200 },
    ],
    inicial: { title: "Contacto", hours: "Lunes a sábado, de 9:00 a 19:00" },
  },

  faq: {
    tipo: "faq",
    nombre: "Preguntas frecuentes",
    descripcion: "Responde antes de que pregunten: entregas, cambios, pagos.",
    maximo: 1,
    campos: [
      { ...TITULO, ejemplo: "Antes de comprar" },
      {
        clave: "items",
        etiqueta: "Preguntas",
        tipo: "lista",
        elemento: "pregunta",
        max: 10,
        campos: [
          {
            clave: "question",
            etiqueta: "Pregunta",
            tipo: "texto",
            max: 200,
            requerido: true,
          },
          {
            clave: "answer",
            etiqueta: "Respuesta",
            tipo: "parrafo",
            max: 800,
            requerido: true,
          },
        ],
      },
    ],
    inicial: {
      title: "Preguntas frecuentes",
      items: [
        {
          question: "¿Cómo recibo mi pedido?",
          answer:
            "Al confirmar tu pedido te escribimos por WhatsApp para acordar la entrega.",
        },
        {
          question: "¿Puedo cambiar un producto?",
          answer:
            "Sí, dentro de los 7 días si está sin usar. Escríbenos y lo coordinamos.",
        },
      ],
    },
  },
}

/** Lo que un esquema de sección necesita saber de la tienda. */
export interface ReglasDeLaTienda {
  /** Si una URL se puede usar como imagen de esta tienda. */
  imagenPermitida: (url: string) => boolean
  /** Si un nombre es de una categoría de su catálogo. */
  categoriaExiste: (nombre: string) => boolean
}

function esquemaDeTexto(campo: CampoDeTexto) {
  const texto = z
    .string()
    .trim()
    .max(campo.max, `«${campo.etiqueta}» admite hasta ${campo.max} caracteres.`)
  return campo.requerido ? texto : texto.optional()
}

function esquemaDeCampo(campo: Campo, reglas: ReglasDeLaTienda): z.ZodType {
  switch (campo.tipo) {
    case "texto":
    case "parrafo":
      return esquemaDeTexto(campo)
    case "imagen":
      return z
        .string()
        .refine(
          reglas.imagenPermitida,
          "Esa imagen no es de tu tienda. Súbela o elige una de tu biblioteca."
        )
        .optional()
    case "numero":
      return z.number().int().min(campo.min).max(campo.max).optional()
    case "opciones":
      return z
        .enum(campo.opciones.map((o) => o.valor) as [string, ...string[]])
        .optional()
    case "interruptor":
      return z.boolean().optional()
    case "categoria":
      return z
        .string()
        .trim()
        .max(60)
        .refine(
          (nombre) => nombre === "" || reglas.categoriaExiste(nombre),
          "Esa categoría no existe en tu catálogo."
        )
        .optional()
    case "lista":
      return z
        .array(
          z.object(
            Object.fromEntries(
              campo.campos.map((sub) => [sub.clave, esquemaDeTexto(sub)])
            )
          )
        )
        .max(
          campo.max,
          `Puedes poner hasta ${campo.max} en «${campo.etiqueta}».`
        )
  }
}

/**
 * El esquema zod de las propiedades de una sección.
 *
 * Las claves que no están en la tabla se descartan: así una propuesta de la IA
 * que invente un campo no llega a la base, y una sección vieja con claves que
 * ya no se usan se limpia al publicarla.
 */
export function esquemaDeSeccion(tipo: TipoDeBloque, reglas: ReglasDeLaTienda) {
  return z.object(
    Object.fromEntries(
      SECCIONES[tipo].campos.map((campo) => [
        campo.clave,
        esquemaDeCampo(campo, reglas),
      ])
    )
  )
}

/**
 * Las propiedades de una sección guardada, leídas para el editor.
 *
 * No valida de golpe: toma campo por campo lo que sirve y descarta lo que no.
 * Una sección sembrada hace meses con un título de más no tiene que impedir
 * abrir el editor; se recorta y la persona lo ve. Lo obligatorio que falte se
 * completa con el ejemplo de la sección.
 */
export function leerPropiedades(
  tipo: TipoDeBloque,
  crudas: unknown,
  reglas: ReglasDeLaTienda
): Record<string, unknown> {
  const origen =
    typeof crudas === "object" && crudas !== null && !Array.isArray(crudas)
      ? (crudas as Record<string, unknown>)
      : {}
  const definicion = SECCIONES[tipo]
  const salida: Record<string, unknown> = {}

  for (const campo of definicion.campos) {
    let valor = origen[campo.clave]

    // Un elemento roto de una lista no se lleva puestos a los demás.
    if (campo.tipo === "lista") {
      salida[campo.clave] = (Array.isArray(valor) ? valor : [])
        .slice(0, campo.max)
        .flatMap((elemento) => {
          const leido = leerElemento(campo.campos, elemento)
          return leido ? [leido] : []
        })
      continue
    }

    if (
      (campo.tipo === "texto" || campo.tipo === "parrafo") &&
      typeof valor === "string"
    ) {
      valor = valor.slice(0, campo.max)
    }

    const leido = esquemaDeCampo(campo, reglas).safeParse(valor)
    if (leido.success && leido.data !== undefined) {
      salida[campo.clave] = leido.data
    } else if (
      "requerido" in campo &&
      campo.requerido &&
      definicion.inicial[campo.clave] !== undefined
    ) {
      salida[campo.clave] = definicion.inicial[campo.clave]
    }
  }

  return salida
}

function leerElemento(
  campos: CampoDeTexto[],
  crudo: unknown
): Record<string, string> | null {
  if (typeof crudo !== "object" || crudo === null) return null

  const origen = crudo as Record<string, unknown>
  const salida: Record<string, string> = {}

  for (const campo of campos) {
    const valor = origen[campo.clave]
    if (typeof valor === "string" && valor.trim()) {
      salida[campo.clave] = valor.trim().slice(0, campo.max)
    } else if (campo.requerido) {
      return null
    }
  }

  return salida
}
