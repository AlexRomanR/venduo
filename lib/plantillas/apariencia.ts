import { z } from "zod"

import { contraste, hexAHsl, hslAHex } from "@/lib/plantillas/color"
import { CLAVES_FUENTE, ESPACIADOS, FUENTES } from "@/lib/plantillas/fuentes"

// Viven en `fuentes.ts`, que no importa zod: los lee la barra lateral del
// panel, que es de cliente y está en todas las pantallas privadas.
export { ESPACIADOS, estiloDelTitular } from "@/lib/plantillas/fuentes"
export {
  contraste,
  hexAHsl,
  hslAHex,
  senalAltaDe,
} from "@/lib/plantillas/color"

/**
 * La apariencia de una tienda: lo que una plantilla fija y una tienda puede
 * cambiar.
 *
 * Es el contrato entre las tres capas. La base de cada plantilla es una
 * `Apariencia` completa; la personalización de una tienda es una
 * `Personalizacion`, que solo trae lo que cambia; y lo que se dibuja sale de
 * `resolverApariencia`, que combina las dos y descarta lo que no pasa.
 *
 * Cada valor es un token cerrado —un color `#rrggbb`, una clave de fuente, un
 * radio con nombre— y nunca CSS libre. No es por prolijidad: la apariencia
 * termina dentro de una etiqueta `<style>` en la tienda pública, y un valor
 * libre ahí es una inyección. Es también lo que va a poder proponer una IA, y
 * este esquema es contra lo que se valida.
 */

const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Un color se escribe como #rrggbb")

/** El radio de botones y controles, por nombre. */
export const RADIOS = {
  recto: "0px",
  suave: "calc(var(--radius) * 0.6)",
  redondo: "9999px",
} as const

export const aparienciaSchema = z.object({
  colores: z.object({
    /** El campo: el fondo de todo. */
    papel: color,
    /** El texto y las reglas. Las jerarquías son tinta con opacidad. */
    tinta: color,
    /** El acento de acción: botones, precios destacados, lo pendiente. */
    senal: color,
    /** La señal al pasar el cursor. */
    senalAlta: color,
  }),
  tipografia: z.object({
    titular: z.enum(CLAVES_FUENTE),
    cuerpo: z.enum(CLAVES_FUENTE),
    /**
     * Un peso único para todo titular. `null` respeta el de cada componente,
     * que es lo que hace la base editorial.
     */
    pesoTitular: z
      .union([
        z.literal(400),
        z.literal(500),
        z.literal(600),
        z.literal(700),
        z.literal(800),
      ])
      .nullable(),
    /** `null` respeta el espaciado de cada componente. */
    espaciadoTitular: z.enum(["apretado", "normal", "abierto"]).nullable(),
    mayusculas: z.boolean(),
  }),
  forma: z.object({
    radio: z.enum(["recto", "suave", "redondo"]),
  }),
  disposicion: z.object({
    /** La proporción de la foto de producto. */
    tarjeta: z.enum(["cuadrada", "retrato"]),
    /** Cuántas columnas tiene la grilla de productos en escritorio. */
    columnas: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  }),
  /**
   * La ficha de producto. Cada kit la dibuja a su manera; esto elige entre
   * formas que los tres saben dibujar, así que ningún valor queda sin efecto
   * en una plantilla.
   */
  ficha: z.object({
    /** `dividida`: la foto al lado del texto. `vitrina`: todo centrado. */
    diseno: z.enum(["dividida", "vitrina"]),
    /** En el celular, una barra con el precio y el botón que sigue al pulgar. */
    barraFija: z.boolean(),
    /** Un enlace para preguntar por WhatsApp. Sin número en la tienda no sale. */
    consulta: z.boolean(),
    /** "También te puede gustar", al pie. */
    relacionados: z.boolean(),
  }),
  /** El carrito, que es el mismo componente en todas las plantillas. */
  carrito: z.object({
    /** `columnas`: pedido y datos lado a lado. `boleta` y `pasos`: una columna. */
    diseno: z.enum(["columnas", "boleta", "pasos"]),
    /** Otros productos de la tienda para sumar al pedido. */
    sugerencias: z.boolean(),
    /** El campo de correo, que es opcional para quien compra. */
    correo: z.boolean(),
  }),
})

export type Apariencia = z.infer<typeof aparienciaSchema>

/**
 * Lo que una tienda cambia respecto de su base.
 *
 * Todo es opcional y se guarda tal cual en `stores.theme_overrides`: un objeto
 * vacío es la plantilla sin tocar. Las claves desconocidas se descartan.
 */
export const personalizacionSchema = z.object({
  colores: aparienciaSchema.shape.colores.partial().optional(),
  tipografia: aparienciaSchema.shape.tipografia.partial().optional(),
  forma: aparienciaSchema.shape.forma.partial().optional(),
  disposicion: aparienciaSchema.shape.disposicion.partial().optional(),
  ficha: aparienciaSchema.shape.ficha.partial().optional(),
  carrito: aparienciaSchema.shape.carrito.partial().optional(),
})

export type Personalizacion = z.infer<typeof personalizacionSchema>

/**
 * La apariencia que se dibuja: la base con la personalización encima.
 *
 * Una personalización que no cumple el esquema se ignora entera, no a medias:
 * aplicar la mitad de un cambio produce una combinación que nadie eligió. Y
 * unos colores que no se leen —texto sin contraste contra el fondo, un botón
 * cuyo blanco se pierde— vuelven a los de la base aunque el esquema los acepte.
 *
 * El contraste se mide solo cuando la tienda cambió colores. La paleta de una
 * base la revisa quien la escribe; la editorial, por ejemplo, tiene su rojo a
 * 4,35:1 contra el papel, y medirla acá descartaría cualquier otro cambio de
 * una tienda que la use.
 */
export function resolverApariencia(
  base: Apariencia,
  personalizacion: unknown
): Apariencia {
  const leida = personalizacionSchema.safeParse(personalizacion ?? {})
  if (!leida.success) return base

  const cambios = leida.data
  const resultado = combinarApariencia(base, cambios)

  if (cambios.colores && !coloresLegibles(resultado.colores)) {
    resultado.colores = base.colores
  }

  return resultado
}

/**
 * La base con una personalización ya validada encima, **sin** mirar el
 * contraste.
 *
 * Es lo que dibuja la vista previa del editor. Ahí el contraste no se corrige
 * en silencio: si una combinación no se lee, la persona tiene que verla así y
 * leer por qué, en vez de ver otros colores sin entender qué pasó. Lo que llega
 * al comprador sigue pasando por `resolverApariencia`.
 */
export function combinarApariencia(
  base: Apariencia,
  cambios: Personalizacion
): Apariencia {
  return {
    colores: { ...base.colores, ...cambios.colores },
    tipografia: { ...base.tipografia, ...cambios.tipografia },
    forma: { ...base.forma, ...cambios.forma },
    disposicion: { ...base.disposicion, ...cambios.disposicion },
    ficha: { ...base.ficha, ...cambios.ficha },
    carrito: { ...base.carrito, ...cambios.carrito },
  }
}

/**
 * Si una paleta se puede leer.
 *
 * La tinta pide 7:1 y no 4,5 porque casi nunca se usa pura: el texto
 * secundario es tinta al 55–70%, y con 4,5 de partida ese texto queda por
 * debajo del mínimo. La señal lleva texto blanco encima en los botones, así
 * que se mide en las dos direcciones.
 */
export function coloresLegibles(colores: Apariencia["colores"]): boolean {
  return problemasDeContraste(colores).length === 0
}

export type TokenDeColor = keyof Apariencia["colores"]

export interface ProblemaDeContraste {
  /** Qué no se lee, dicho para una persona. */
  mensaje: string
  /** Los colores que intervienen: cambiar cualquiera lo arregla. */
  colores: TokenDeColor[]
  contraste: number
  minimo: number
}

/**
 * Qué no se lee de una paleta, y por qué.
 *
 * Son las mismas tres comprobaciones de `coloresLegibles`, contadas para que el
 * editor pueda decir "el texto no se lee sobre este fondo" en vez de rechazar
 * un color sin explicación.
 */
export function problemasDeContraste(
  colores: Apariencia["colores"]
): ProblemaDeContraste[] {
  const problemas: ProblemaDeContraste[] = []

  const texto = contraste(colores.tinta, colores.papel)
  if (texto < 7) {
    problemas.push({
      mensaje: "El texto no se lee bien sobre el fondo.",
      colores: ["tinta", "papel"],
      contraste: texto,
      minimo: 7,
    })
  }

  const botones = contraste(colores.senal, colores.papel)
  if (botones < 4.5) {
    problemas.push({
      mensaje: "Los botones se pierden contra el fondo.",
      colores: ["senal", "papel"],
      contraste: botones,
      minimo: 4.5,
    })
  }

  const letraDelBoton = contraste("#ffffff", colores.senal)
  if (letraDelBoton < 4.5) {
    problemas.push({
      mensaje: "La letra blanca de los botones no se lee.",
      colores: ["senal"],
      contraste: letraDelBoton,
      minimo: 4.5,
    })
  }

  return problemas
}

/**
 * El color más parecido a `token` con el que la paleta se lee.
 *
 * Conserva el tono y la saturación y mueve solo la luz, un punto por vez hacia
 * los dos lados: la primera que pasa es la más cercana a lo que la persona
 * eligió. Devuelve `null` si ninguna luz alcanza —un fondo oscuro con botones
 * que tienen que llevar letra blanca, por ejemplo—; entonces lo que hay que
 * cambiar es otro color.
 */
export function colorLegibleCercano(
  colores: Apariencia["colores"],
  token: TokenDeColor
): string | null {
  const [tono, saturacion, luz] = hexAHsl(colores[token])

  for (let paso = 1; paso <= 100; paso++) {
    for (const candidata of [luz - paso, luz + paso]) {
      if (candidata < 0 || candidata > 100) continue

      const hex = hslAHex(tono, saturacion, candidata)
      if (coloresLegibles({ ...colores, [token]: hex })) return hex
    }
  }

  return null
}

/**
 * Cómo se llama cada ajuste para quien edita su tienda.
 *
 * La base de datos dice `papel`, `tinta` y `senal`; una persona dice fondo,
 * texto y botones. Lo usan el editor y el resumen de lo que cambió.
 */
export const NOMBRES_DE_AJUSTE = {
  "colores.papel": "Fondo",
  "colores.tinta": "Texto",
  "colores.senal": "Botones y acentos",
  "colores.senalAlta": "Botones al pasar el cursor",
  "tipografia.titular": "Letra de los títulos",
  "tipografia.cuerpo": "Letra del texto",
  "tipografia.pesoTitular": "Grosor de los títulos",
  "tipografia.espaciadoTitular": "Espacio entre letras de los títulos",
  "tipografia.mayusculas": "Títulos en mayúsculas",
  "forma.radio": "Forma de los botones",
  "disposicion.tarjeta": "Foto de los productos",
  "disposicion.columnas": "Columnas del catálogo",
  "ficha.diseno": "Diseño de la ficha",
  "ficha.barraFija": "Botón de compra siempre a mano",
  "ficha.consulta": "Preguntar por WhatsApp",
  "ficha.relacionados": "Productos parecidos",
  "carrito.diseno": "Diseño del carrito",
  "carrito.sugerencias": "Sugerencias en el carrito",
  "carrito.correo": "Pedir el correo",
} as const

export type RutaDeAjuste = keyof typeof NOMBRES_DE_AJUSTE

export const RUTAS_DE_AJUSTE = Object.keys(NOMBRES_DE_AJUSTE) as [
  RutaDeAjuste,
  ...RutaDeAjuste[],
]

/** El nombre de cada valor cerrado, para mostrarlo. */
export const NOMBRES_DE_VALOR: Record<string, string> = {
  recto: "Rectos",
  suave: "Suaves",
  redondo: "Redondos",
  cuadrada: "Cuadrada",
  retrato: "Vertical",
  apretado: "Apretado",
  normal: "Normal",
  abierto: "Abierto",
  dividida: "Dividida",
  vitrina: "Vitrina",
  columnas: "Dos columnas",
  boleta: "Boleta",
  pasos: "Por pasos",
}

/**
 * Las variables CSS de una apariencia.
 *
 * Sale del esquema y de tablas cerradas —nunca de texto libre—, y eso es lo
 * que permite inyectarlo en una etiqueta `<style>`. Si algún día un valor deja
 * de ser un token, esta función deja de ser segura.
 *
 * Los tokens de Tailwind están declarados `inline` en `globals.css`: cada
 * clase lee `var(--papel)` en el momento, así que redefinir las variables tiñe
 * todo lo que ya existe sin tocar un componente.
 */
export function cssDeApariencia(apariencia: Apariencia): string {
  const { colores, tipografia, forma } = apariencia

  const variables = [
    `--papel:${colores.papel}`,
    `--tinta:${colores.tinta}`,
    `--senal:${colores.senal}`,
    `--senal-alta:${colores.senalAlta}`,
    `--font-titular:var(${FUENTES[tipografia.titular].variable})`,
    `--font-cuerpo:var(${FUENTES[tipografia.cuerpo].variable})`,
    `--radio:${RADIOS[forma.radio]}`,
  ]

  // Sin capa y sin !important: las utilidades de Tailwind viven en una capa, y
  // una regla fuera de capas les gana por orden de cascada.
  const titular: string[] = []
  if (tipografia.pesoTitular) {
    titular.push(`font-weight:${tipografia.pesoTitular}`)
  }
  if (tipografia.espaciadoTitular) {
    titular.push(`letter-spacing:${ESPACIADOS[tipografia.espaciadoTitular]}`)
  }
  if (tipografia.mayusculas) {
    titular.push("text-transform:uppercase")
  }

  // Las miniaturas de la galería llevan su propia plantilla adentro de esta
  // página: la regla del titular no les llega, o una miniatura de perfumería
  // saldría en mayúsculas dentro de un panel de moda.
  const css = `html:root{${variables.join(";")}}`
  return titular.length > 0
    ? `${css}.font-titular:not([data-miniatura] *){${titular.join(";")}}`
    : css
}

/**
 * Las mismas variables como estilo en línea, para dibujar una apariencia en
 * un recuadro —la miniatura de la galería— sin teñir la página entera.
 */
export function variablesEnLinea(
  apariencia: Apariencia
): Record<string, string> {
  const { colores, tipografia, forma } = apariencia

  return {
    "--papel": colores.papel,
    "--tinta": colores.tinta,
    "--senal": colores.senal,
    "--senal-alta": colores.senalAlta,
    "--font-titular": `var(${FUENTES[tipografia.titular].variable})`,
    "--font-cuerpo": `var(${FUENTES[tipografia.cuerpo].variable})`,
    "--radio": RADIOS[forma.radio],
    fontFamily: `var(${FUENTES[tipografia.cuerpo].variable})`,
  }
}
