/**
 * Las tipografías que una plantilla puede usar.
 *
 * La lista es cerrada porque `next/font` las compila: una fuente que no está
 * declarada en `lib/fuentes.ts` no existe en la página, aunque una
 * personalización la nombre. La clave es lo que se guarda en la base; la
 * variable es la que declara `lib/fuentes.ts`, y las dos listas tienen que
 * coincidir.
 *
 * Este módulo no importa `next/font` a propósito: lo leen la galería de
 * plantillas, que es de cliente, y la validación de lo que venga de la base.
 */
export const FUENTES = {
  archivo: { nombre: "Archivo", variable: "--fuente-archivo" },
  geist: { nombre: "Geist", variable: "--fuente-geist" },
  oswald: { nombre: "Oswald", variable: "--fuente-oswald" },
  cormorant: { nombre: "Cormorant Garamond", variable: "--fuente-cormorant" },
  jost: { nombre: "Jost", variable: "--fuente-jost" },
} as const

export type ClaveFuente = keyof typeof FUENTES

export const CLAVES_FUENTE = Object.keys(FUENTES) as [
  ClaveFuente,
  ...ClaveFuente[],
]

/** El valor de `font-family` de una fuente, para un estilo en línea. */
export function familiaDe(clave: ClaveFuente): string {
  return `var(${FUENTES[clave].variable})`
}

/** El espaciado de los titulares, por nombre. */
export const ESPACIADOS = {
  apretado: "-0.03em",
  normal: "0em",
  abierto: "0.02em",
} as const

/** Lo que define cómo escribe sus titulares una tienda. */
export interface TipografiaDelTitular {
  titular: ClaveFuente
  pesoTitular: number | null
  espaciadoTitular: keyof typeof ESPACIADOS | null
  mayusculas: boolean
}

/**
 * Cómo escribe sus titulares una tienda, como estilo en línea.
 *
 * Es para mostrar su nombre con su propia letra dentro de una pantalla que no
 * lleva su plantilla: la tarjeta de la tienda en el panel. Sale de tokens
 * cerrados, igual que `cssDeApariencia`.
 *
 * Vive acá y no en `apariencia.ts` porque la lee la barra lateral, que es de
 * cliente y está en todas las pantallas privadas: traerla desde allá subía el
 * esquema de zod entero al navegador, cien kilobytes en cada pantalla del panel.
 */
export function estiloDelTitular(
  tipografia: TipografiaDelTitular
): Record<string, string | number> {
  return {
    fontFamily: familiaDe(tipografia.titular),
    fontWeight: tipografia.pesoTitular ?? 800,
    letterSpacing: tipografia.espaciadoTitular
      ? ESPACIADOS[tipografia.espaciadoTitular]
      : "-0.02em",
    textTransform: tipografia.mayusculas ? "uppercase" : "none",
  }
}
