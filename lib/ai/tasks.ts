import { PLANTILLAS_DE_CATALOGO } from "@/lib/catalogos/plantillas"
import { ESQUEMA, ESQUEMA_DE_VISITAS, REGLAS_SQL } from "@/lib/insights/esquema"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import type { TipoDeBloque } from "@/lib/plantillas/bloques"
import { FUENTES } from "@/lib/plantillas/fuentes"
import { SECCIONES, type Campo } from "@/lib/plantillas/secciones"
import { getAIProvider } from "./index"
import type { ImagenParaIA } from "./types"
import {
  borradoresDeProductosSchema,
  lecturaDePlanillaSchema,
  insightSqlSchema,
  publicacionesSchema,
  propuestaDeCatalogoSchema,
  propuestaDeDisenoSchema,
  salesInsightSchema,
  storeBlueprintSchema,
  type BorradoresDeProductos,
  type GenerateStoreRequest,
  type LecturaDePlanilla,
  type InsightSql,
  type InsightsRequest,
  type Publicaciones,
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
  "concreto, sin relleno. Lo que haces lo cuentas en primera persona del " +
  "plural, como Venduo: «Elegimos…», «Cambiamos…», nunca «elegí». Los " +
  "montos son en bolivianos."

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
  /** Si la tienda puede ver sus visitas: suma `mis_visitas` al esquema. */
  conVisitas?: boolean
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
      'La explicación dice qué muestra el gráfico, sin hablar de ti: "Los 5',
      'productos con más unidades vendidas en pedidos pagados", nunca "Te',
      'muestro…" ni "Voy a mostrar…".',
      "",
      "Esquema disponible:",
      ESQUEMA,
      ...(input.conVisitas ? ["", ESQUEMA_DE_VISITAS] : []),
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
/**
 * Los textos para publicar un producto en redes: WhatsApp, Instagram y TikTok,
 * Facebook y Marketplace.
 *
 * El modelo no escribe el precio ni el enlace: los suma quien llama, con los
 * datos de la base. `vuelta` cambia en cada "Otra versión", para que no
 * repita la anterior. El contexto viaja también entre marcas, como en el
 * catálogo, para que el modo demo arme textos con el producto real.
 */
export async function escribirPublicaciones(input: {
  tienda: string
  producto: {
    nombre: string
    categoria: string | null
    descripcion: string | null
    rebaja: number | null
    pocasUnidades: boolean
  }
  vuelta: number
}): Promise<{ publicaciones: Publicaciones; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: publicacionesSchema,
    schemaName: "Publicaciones",
    system: [
      BASE_SYSTEM,
      "Escribes publicaciones para que la tienda venda un producto en sus redes.",
      "Suenan a la tienda hablándole a su clienta o cliente, no a un aviso: cálido, directo, sin exagerar.",
      "No escribas el precio ni ningún monto, ni enlaces: Venduo los agrega al final.",
      "No inventes características que no estén en los datos: ni tallas, ni colores, ni materiales.",
      "Como mucho dos emojis por texto. Sin hashtags dentro de los textos: van aparte.",
      "Si hay rebaja, dilo. Si quedan pocas unidades, dilo sin alarmar.",
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: [
          `Tienda: ${input.tienda}`,
          `Producto: ${input.producto.nombre}`,
          input.producto.categoria
            ? `Categoría: ${input.producto.categoria}`
            : null,
          input.producto.descripcion
            ? `Descripción: ${input.producto.descripcion}`
            : null,
          input.producto.rebaja
            ? `Está con ${input.producto.rebaja}% de descuento.`
            : null,
          input.producto.pocasUnidades ? "Quedan pocas unidades." : null,
          input.vuelta > 0
            ? `Es la versión número ${input.vuelta + 1}: escribe algo distinto a lo de antes.`
            : null,
          `<<CONTEXTO>>${JSON.stringify(input)}<</CONTEXTO>>`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  })

  return { publicaciones: object, provider, model }
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
  '- resumen: una frase en primera persona del plural, como Venduo. Ejemplo: "Cambiamos',
  '  el acento a terracota y subimos las preguntas frecuentes."',
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
  "  su WhatsApp en Datos de la tienda)",
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

const REGLAS_DE_CARGA =
  "Lees productos para cargarlos en la tienda. Nunca inventas un precio, un " +
  "stock ni una talla: si no se lee, va null y lo dices en `duda`. El precio " +
  'va en bolivianos tal como está escrito ("85,50" es 85.5; "1.250" es ' +
  '1250). El nombre es corto y claro, como se vería en una tienda: "Polera ' +
  'Nike negra", sin precios ni medidas de más. La categoría, si se puede, es ' +
  'una de las que la tienda ya tiene; si no, una palabra en plural: "Poleras". ' +
  "La descripción, una frase o vacía. No repitas un producto. No pongas " +
  "marcas que no estén escritas o a la vista. El stock, si no se lee, va " +
  "null sin mencionarlo: la tienda lo pone en 1 y lo cambia si hace falta."

/**
 * Productos desde fotos: una foto por producto, o páginas de un cuaderno con
 * la lista escrita. O desde el texto de una lista pegada o dictada. La IA
 * propone borradores; la persona los revisa antes de crear nada.
 */
export async function leerProductos(input: {
  modo: "fotos" | "lista"
  imagenes: ImagenParaIA[]
  texto: string | null
  categorias: string[]
}): Promise<{
  lectura: BorradoresDeProductos
  provider: string
  model: string
}> {
  const ai = getAIProvider()
  const pedido =
    input.modo === "fotos"
      ? `Hay ${input.imagenes.length} fotos, una por producto, numeradas desde 0 en orden. Devuelve un borrador por foto, con su número en \`foto\`. Lee el nombre de lo que se ve; el precio, solo si aparece escrito.`
      : input.imagenes.length
        ? `Son ${input.imagenes.length} páginas de una lista escrita a mano o impresa. Devuelve un borrador por renglón con producto. \`foto\` va null.`
        : "Es una lista escrita por la persona. Devuelve un borrador por renglón con producto. `foto` va null."

  const { object, provider, model } = await ai.generateObject({
    schema: borradoresDeProductosSchema,
    schemaName: "BorradoresDeProductos",
    system: `${BASE_SYSTEM} ${REGLAS_DE_CARGA}`,
    maxTokens: 8192,
    temperature: 0.2,
    limiteMs: 45_000,
    messages: [
      {
        role: "user",
        imagenes: input.imagenes,
        content: [
          pedido,
          "",
          "<<CONTEXTO>>",
          JSON.stringify({
            modo: input.modo,
            fotos: input.imagenes.length,
            categorias: input.categorias,
            texto: input.texto,
          }),
          "<</CONTEXTO>>",
        ].join("\n"),
      },
    ],
  })

  return { lectura: object, provider, model }
}

/**
 * Qué es cada columna de una planilla. Recibe el principio, no la planilla
 * entera: el sistema aplica la lectura a todas las filas.
 */
export async function leerPlanilla(input: {
  filas: string[][]
}): Promise<{ lectura: LecturaDePlanilla; provider: string; model: string }> {
  const ai = getAIProvider()
  const tabla = input.filas
    .map(
      (fila, indice) =>
        `Fila ${indice}: ${fila.map((celda, columna) => `[${columna}] ${celda}`).join(" | ")}`
    )
    .join("\n")

  const { object, provider, model } = await ai.generateObject({
    schema: lecturaDePlanillaSchema,
    schemaName: "LecturaDePlanilla",
    system:
      `${BASE_SYSTEM} Recibes el principio de una planilla de productos y ` +
      "dices qué es cada columna (su número entre corchetes), una entrada por " +
      "columna con datos. Decide por el encabezado y, sobre todo, por lo que " +
      "contienen las celdas: textos casi todos distintos son el nombre; textos " +
      "que se repiten (Poleras, Gorras) son la categoría; números con " +
      "decimales o Bs son el precio; enteros chicos son el stock; S, M, L, XL " +
      "o 38, 39, 40 son la talla; negro, rojo, azul son el color; códigos como " +
      "A12 son el código; textos largos son la descripción. El costo es lo que " +
      "paga la tienda; el precio, lo que cobra. Cada campo va en una sola " +
      "columna. `seguro` es true solo si no hay duda razonable; si dudas —por " +
      "ejemplo, una columna de números que puede ser stock o precio—, false: " +
      "se le pregunta a la persona. Una columna que no sirve va con campo null. " +
      "`filaDeEncabezado` es la fila de los títulos, o null si no hay.",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          "<<CONTEXTO>>",
          JSON.stringify({ filas: input.filas }),
          "<</CONTEXTO>>",
          "",
          tabla,
        ].join("\n"),
      },
    ],
  })

  return { lectura: object, provider, model }
}
