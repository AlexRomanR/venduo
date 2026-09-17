import { z } from "zod"

import { CLAVES_FUENTE, FUENTES } from "@/lib/plantillas/fuentes"

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

/** El espaciado de los titulares, por nombre. */
export const ESPACIADOS = {
  apretado: "-0.03em",
  normal: "0em",
  abierto: "0.02em",
} as const

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
  const resultado: Apariencia = {
    colores: { ...base.colores, ...cambios.colores },
    tipografia: { ...base.tipografia, ...cambios.tipografia },
    forma: { ...base.forma, ...cambios.forma },
    disposicion: { ...base.disposicion, ...cambios.disposicion },
  }

  if (cambios.colores && !coloresLegibles(resultado.colores)) {
    resultado.colores = base.colores
  }

  return resultado
}

function luminancia(hex: string): number {
  const canales = [1, 3, 5].map((inicio) => {
    const valor = parseInt(hex.slice(inicio, inicio + 2), 16) / 255
    return valor <= 0.04045
      ? valor / 12.92
      : Math.pow((valor + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2]
}

/** El contraste WCAG entre dos colores `#rrggbb`. */
export function contraste(a: string, b: string): number {
  const [clara, oscura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (clara + 0.05) / (oscura + 0.05)
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
  return (
    contraste(colores.tinta, colores.papel) >= 7 &&
    contraste(colores.senal, colores.papel) >= 4.5 &&
    contraste("#ffffff", colores.senal) >= 4.5
  )
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
