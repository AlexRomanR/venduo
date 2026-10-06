import { PLANTILLAS_DE_CATALOGO } from "@/lib/catalogos/plantillas"
import { ESQUEMA, REGLAS_SQL } from "@/lib/insights/esquema"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import type { TipoDeBloque } from "@/lib/plantillas/bloques"
import { FUENTES } from "@/lib/plantillas/fuentes"
import { SECCIONES, type Campo } from "@/lib/plantillas/secciones"
import { getAIProvider } from "./index"
import {
  insightSqlSchema,
  marketingCampaignSchema,
  propuestaDeCatalogoSchema,
  propuestaDeDisenoSchema,
  salesInsightSchema,
  storeBlueprintSchema,
  type GenerateStoreRequest,
  type InsightSql,
  type InsightsRequest,
  type MarketingCampaign,
  type PropuestaDeCatalogo,
  type PropuestaDeDiseno,
  type SalesInsight,
  type StoreBlueprint,
} from "./schemas"

const BASE_SYSTEM =
  "Eres el asistente de Venduo, el sistema con el que emprendedores " +
  "bolivianos que venden por TikTok, Instagram, Facebook y WhatsApp manejan " +
  "su negocio: su tienda online, su stock, sus cobros, sus pedidos y sus " +
  "catálogos. Escribes en español neutro de Bolivia, tratando de tú, claro y " +
  "concreto, sin relleno. Los montos son en bolivianos."

/** Genera la tienda completa (datos + catálogo + copy) a partir de una idea. */
export async function generateStoreBlueprint(
  input: GenerateStoreRequest
): Promise<{ blueprint: StoreBlueprint; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: storeBlueprintSchema,
    schemaName: "StoreBlueprint",
    system: BASE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Crea una tienda online para este negocio: ${input.prompt}`,
          `Moneda: ${input.currency}. Cantidad de productos: ${input.productCount}.`,
          "Los precios van en centavos (enteros) y tienen que ser realistas para el mercado local.",
        ].join("\n"),
      },
    ],
  })

  return { blueprint: object, provider, model }
}

/** Análisis conversacional sobre las ventas del período. */
export async function analyzeSales(
  input: InsightsRequest
): Promise<{ insight: SalesInsight; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: salesInsightSchema,
    schemaName: "SalesInsight",
    system: BASE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Pregunta de la tienda: ${input.question}`,
          "Series de ventas (JSON, montos en centavos):",
          JSON.stringify(input.sales),
        ].join("\n"),
      },
    ],
  })

  return { insight: object, provider, model }
}

/**
 * Traduce una pregunta en palabras a una consulta SQL.
 *
 * Hace los tres pasos —qué gráfico, qué vistas, qué consulta— en **una sola
 * llamada**. Encadenar tres viajes al modelo para una pregunta que no cambia
 * entre uno y otro cuesta tres veces más y triplica las oportunidades de que
 * algo se pierda por el camino; pedirle que razone en ese orden dentro de un
 * mismo esquema da el mismo razonamiento por un tercio del precio.
 *
 * `anterior` es lo que permite seguir editando por chat: el modelo ve la
 * consulta que está en pantalla y la modifica en vez de empezar de cero.
 */
export async function buildInsightSql(input: {
  pregunta: string
  anterior?: InsightSql | null
  hoy: string
}): Promise<{ consulta: InsightSql; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: insightSqlSchema,
    schemaName: "InsightSql",
    system: [
      BASE_SYSTEM,
      "Traduces preguntas sobre el negocio a una consulta SQL de PostgreSQL.",
      "",
      "Razona en este orden:",
      "1. Qué forma pide la pregunta. Una evolución en el tiempo es linea o",
      "   area; pocos períodos, columna; un ranking o una comparación entre",
      "   categorías, barra; una sola cifra, numero; muchas filas donde el",
      "   detalle importa, tabla.",
      "   Si la persona nombra un tipo de gráfico, usa ese y no el que habrías",
      "   elegido. Es su pantalla.",
      "   No hay torta ni dona, y no se pueden agregar: la paleta es un solo",
      "   rojo, así que el color no puede separar categorías. Si las piden, usa",
      "   barra ordenada de mayor a menor —que responde lo mismo y se lee",
      "   mejor— y dilo en la explicación en una frase, sin pedir disculpas.",
      "2. Qué vistas hacen falta para responderla.",
      "3. La consulta.",
      "",
      "Esquema disponible:",
      ESQUEMA,
      "",
      "Reglas de la consulta:",
      REGLAS_SQL,
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: [
          `Hoy es ${input.hoy}.`,
          input.anterior
            ? `La consulta en pantalla es:\n${input.anterior.sql}\nLa persona quiere modificarla.`
            : "No hay ninguna consulta en pantalla todavía.",
          `Pregunta: ${input.pregunta}`,
        ].join("\n"),
      },
    ],
  })

  return { consulta: object, provider, model }
}

/** Campaña de marketing multicanal para una tienda. */
export async function generateCampaign(input: {
  storeName: string
  audience: string
  objective: string
}): Promise<{ campaign: MarketingCampaign; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: marketingCampaignSchema,
    schemaName: "MarketingCampaign",
    system: BASE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Tienda: ${input.storeName}`,
          `Público: ${input.audience}`,
          `Objetivo: ${input.objective}`,
          "Genera publicaciones listas para usar en distintos canales.",
        ].join("\n"),
      },
    ],
  })

  return { campaign: object, provider, model }
}

/* -------------------------------------------------------------------------
 * Edición de la tienda
 * ---------------------------------------------------------------------- */

/** Lo que la IA ve de la tienda. Nunca datos de otras tiendas. */
export interface TiendaParaLaIa {
  tienda: {
    nombre: string
    descripcion: string | null
    plantilla: string
    /** Sin número, la ficha no puede ofrecer preguntar por WhatsApp. */
    tieneWhatsapp: boolean
  }
  /** La apariencia del borrador, ya combinada con la base de la plantilla. */
  apariencia: Apariencia
  secciones: Array<{
    id: string
    tipo: TipoDeBloque
    visible: boolean
    props: Record<string, unknown>
  }>
  categorias: string[]
  /** Las únicas imágenes que puede usar: las de la tienda y sus productos. */
  imagenes: Array<{ url: string; descripcion: string }>
}

/** Cómo se describe un campo para el modelo, desde la misma tabla del editor. */
function describirCampo(campo: Campo): string {
  switch (campo.tipo) {
    case "texto":
    case "parrafo":
      return `${campo.clave} (texto hasta ${campo.max}${campo.requerido ? ", obligatorio" : ""})`
    case "imagen":
      return `${campo.clave} (una URL de la lista de imágenes)`
    case "numero":
      return `${campo.clave} (entero de ${campo.min} a ${campo.max})`
    case "opciones":
      return `${campo.clave} (${campo.opciones.map((o) => o.valor).join(" | ")})`
    case "interruptor":
      return `${campo.clave} (true | false)`
    case "categoria":
      return `${campo.clave} (una categoría de la lista, o vacío para todas)`
    case "lista":
      return `${campo.clave} (lista de hasta ${campo.max} objetos con ${campo.campos
        .map((sub) => `${sub.clave}: texto hasta ${sub.max}`)
        .join(", ")})`
  }
}

const TIPOS_DE_SECCION = Object.values(SECCIONES)
  .map(
    (definicion) =>
      `- ${definicion.tipo} («${definicion.nombre}»${definicion.maximo ? `, máximo ${definicion.maximo}` : ""}): ${definicion.campos.map(describirCampo).join("; ")}`
  )
  .join("\n")

const FUENTES_DISPONIBLES = Object.entries(FUENTES)
  .map(([clave, fuente]) => `${clave} (${fuente.nombre})`)
  .join(", ")

const REGLAS_DE_EDICION = [
  "Editas el diseño de la tienda online de un emprendedor. No escribes HTML ni CSS:",
  "devuelves operaciones sobre su borrador, el sistema las valida y el emprendedor",
  "las ve en una vista previa antes de decidir si las aplica.",
  "",
  "Reglas:",
  "- Haz lo que te piden, completo, y nada más.",
  "- Para tocar una sección existente usa su id exacto de la lista. Nunca inventes un id.",
  "- Las posiciones empiezan en 0.",
  '- En "editar" manda solo los campos que cambian, con sus claves exactas.',
  "- Respeta el máximo de cada tipo: si ya está, muévela o edítala en vez de agregar otra.",
  "- Imágenes: solo URLs de la lista de imágenes. Nunca inventes una URL.",
  "- Categorías: solo nombres de la lista de categorías.",
  "- Colores en #rrggbb, y tienen que leerse: colores.tinta contra colores.papel con",
  "  contraste de 7:1 o más; colores.senal contra colores.papel con 4,5:1 o más, y la",
  "  letra de los botones es blanca, así que colores.senal tiene que ser oscuro. Por eso",
  "  no hay fondos oscuros: si los piden, dilo en el resumen y propone lo más cercano.",
  "- Si cambias colores.senal, cambia también colores.senalAlta a un tono un poco más",
  "  claro del mismo color.",
  `- Fuentes: ${FUENTES_DISPONIBLES}.`,
  "- Textos en español neutro de Bolivia, tratando de tú, cortos y concretos. Sin",
  "  emojis. Respeta el largo máximo de cada campo.",
  "- Si lo que piden no se hace desde el diseño —precios, productos, fotos que no están",
  "  en la lista— no devuelvas operaciones y explica en el resumen qué sí puedes hacer.",
  '- resumen: una frase en primera persona. Ejemplo: "Cambio el acento a terracota y',
  '  subo las preguntas frecuentes."',
  "",
  "Ajustes de apariencia (ruta: valores):",
  '- colores.papel, colores.tinta, colores.senal, colores.senalAlta: "#rrggbb"',
  `- tipografia.titular, tipografia.cuerpo: ${Object.keys(FUENTES).join(" | ")}`,
  "- tipografia.pesoTitular: 400 | 500 | 600 | 700 | 800 | null",
  "- tipografia.espaciadoTitular: apretado | normal | abierto | null",
  "- tipografia.mayusculas: true | false",
  "- forma.radio: recto | suave | redondo",
  "- disposicion.tarjeta: cuadrada | retrato",
  "- disposicion.columnas: 2 | 3 | 4",
  "- ficha.diseno: dividida (foto al lado del texto) | vitrina (todo centrado)",
  "- ficha.barraFija: true | false (en el celular, barra con el precio y el botón de",
  "  compra siempre a la vista)",
  "- ficha.consulta: true | false (enlace para preguntar por WhatsApp; solo si",
  "  tienda.tieneWhatsapp es true: si no, explica en el resumen que primero agregue",
  "  su WhatsApp en Cuenta)",
  '- ficha.relacionados: true | false ("También te puede gustar")',
  "- carrito.diseno: columnas | boleta | pasos",
  "- carrito.sugerencias: true | false (tres productos más para sumar al pedido)",
  "",
  "Tipos de sección y sus campos:",
  TIPOS_DE_SECCION,
].join("\n")

/**
 * Propone cambios al diseño de la tienda a partir de lo que pide la persona.
 *
 * Devuelve operaciones, que la acción del servidor vuelve a validar contra el
 * borrador: esta función no decide si algo se puede aplicar. `errores` es para
 * el segundo intento: lo que no pasó la validación se le devuelve al modelo
 * para que lo corrija.
 *
 * El contexto va entre `<<CONTEXTO>>` para que el modo demo lo lea y conteste
 * con ids de la tienda de verdad.
 */
export async function proponerEdicion(input: {
  pedido: string
  contexto: TiendaParaLaIa
  errores?: string[]
}): Promise<{ propuesta: PropuestaDeDiseno; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: propuestaDeDisenoSchema,
    schemaName: "PropuestaDeDiseno",
    system: [BASE_SYSTEM, REGLAS_DE_EDICION].join("\n\n"),
    temperature: 0.5,
    messages: [
      {
        role: "user",
        content: [
          `El emprendedor pide: «${input.pedido}»`,
          "",
          "La tienda:",
          "<<CONTEXTO>>",
          JSON.stringify(input.contexto),
          "<</CONTEXTO>>",
          ...(input.errores?.length
            ? [
                "",
                "Tu propuesta anterior no se pudo aplicar por esto:",
                ...input.errores.map((error) => `- ${error}`),
                "Corrígela y vuelve a proponer.",
              ]
            : []),
        ].join("\n"),
      },
    ],
  })

  return { propuesta: object, provider, model }
}

/* -------------------------------------------------------------------------
 * Catálogos en PDF
 * ---------------------------------------------------------------------- */

/** Lo que la IA ve de un producto para armar un catálogo. Sin datos de otras tiendas. */
export interface ProductoParaCatalogo {
  id: string
  nombre: string
  categoria: string | null
  precio: string
  /** El descuento en puntos porcentuales, si está rebajado. */
  rebaja: number | null
  condicion: string
  stock: number
  destacado: boolean
}

const REGLAS_DE_CATALOGO =
  "Armas catálogos en PDF que la tienda manda por WhatsApp. Eliges solo " +
  "productos de la lista, por su id exacto, y los ordenas para vender: lo " +
  "más atractivo primero y agrupado por categoría cuando ayuda a encontrar. " +
  "Dejas fuera lo que tiene stock 0, salvo que el pedido lo pida. Si te pasan " +
  "los productos actuales del catálogo, eliges y ordenas solo entre esos. La " +
  "plantilla es la que mejor sirve al pedido. El nombre es corto y concreto; " +
  "la bajada, una línea que invite a escribir. Nunca inventas productos, " +
  "precios ni descuentos."

/**
 * Un catálogo desde una frase: qué productos, en qué orden, con qué plantilla.
 *
 * El contexto va entre marcas porque el modo demo lo lee de ahí para responder
 * con los productos reales de la tienda.
 */
export async function proponerCatalogo(input: {
  frase: string
  tienda: string
  productos: ProductoParaCatalogo[]
  actuales: string[] | null
}): Promise<{
  propuesta: PropuestaDeCatalogo
  provider: string
  model: string
}> {
  const ai = getAIProvider()
  const plantillas = Object.values(PLANTILLAS_DE_CATALOGO)
    .map(
      (plantilla) =>
        `- ${plantilla.clave}: ${plantilla.nombre}. ${plantilla.detalle} Ideal para: ${plantilla.ideal}.`
    )
    .join("\n")

  const { object, provider, model } = await ai.generateObject({
    schema: propuestaDeCatalogoSchema,
    schemaName: "PropuestaDeCatalogo",
    system: `${BASE_SYSTEM} ${REGLAS_DE_CATALOGO}`,
    messages: [
      {
        role: "user",
        content: [
          `Pedido: ${input.frase}`,
          "",
          "Plantillas:",
          plantillas,
          "",
          "<<CONTEXTO>>",
          JSON.stringify({
            tienda: input.tienda,
            productos: input.productos,
            actuales: input.actuales,
          }),
          "<</CONTEXTO>>",
        ].join("\n"),
      },
    ],
  })

  return { propuesta: object, provider, model }
}
