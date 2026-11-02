import localFont from "next/font/local"

/** Kalam: la letra de quien anota rápido con bolígrafo. */
export const kalam = localFont({
  src: [
    { path: "./kalam-400.woff2", weight: "400", style: "normal" },
    { path: "./kalam-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--fuente-mano",
  display: "swap",
})

/**
 * Archivo completa, con sus dos ejes: el peso (100 a 900) y el ancho (62 a
 * 125). Es un archivo aparte de `lib/fuentes`, que solo trae el peso: el ancho
 * lo usa solo la portada, y así no lo cargan las demás pantallas.
 */
export const archivoAncho = localFont({
  src: [
    { path: "./archivo-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./archivo-italica.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--fuente-ancha",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
})
