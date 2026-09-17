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
