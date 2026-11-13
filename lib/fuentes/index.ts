import localFont from "next/font/local"

/**
 * Todas las tipografías de la aplicación, en un solo lugar.
 *
 * Cada una expone una variable `--fuente-*` y ninguna se aplica por sí sola:
 * `globals.css` elige cuál es el titular y cuál el cuerpo del mundo de
 * Venduo, y una plantilla las reasigna. Las claves y variables tienen que
 * coincidir con `lib/plantillas/fuentes.ts`.
 *
 * Los archivos viven al lado, no se piden a Google en cada build: con
 * `next/font/google`, Turbopack fallaba de vez en cuando al bajarlos
 * ("Can't resolve '@vercel/turbopack-next/internal/font/google/font'").
 * Son el subconjunto latino en woff2, variables cuando la letra lo es —el
 * público está en datos móviles—. Para sumar un peso, bajarlo de Google
 * Fonts con ese mismo corte. La licencia está en `OFL.txt`.
 */

export const geist = localFont({
  src: "./geist-100-900.woff2",
  weight: "100 900",
  variable: "--fuente-geist",
})

export const geistMono = localFont({
  src: "./geist-mono-100-900.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
})

/** Voz de titular y de cifra de Venduo: un grotesco industrial. */
export const archivo = localFont({
  src: "./archivo-600-800.woff2",
  weight: "600 800",
  variable: "--fuente-archivo",
  display: "swap",
})

// Las de plantilla no se precargan. Declararlas en <html> suma unas líneas de
// @font-face, pero el navegador solo baja el archivo de la que se usa; con
// precarga, la portada de Venduo bajaría las tres sin mostrar ninguna.

/** Titular de la plantilla `fashion`: condensada, pensada en mayúsculas. */
export const oswald = localFont({
  src: "./oswald-500-700.woff2",
  weight: "500 700",
  variable: "--fuente-oswald",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `perfume`: una antigua de alto contraste. */
export const cormorant = localFont({
  src: [
    { path: "./cormorant-500-700.woff2", weight: "500 700", style: "normal" },
    {
      path: "./cormorant-500-700-italica.woff2",
      weight: "500 700",
      style: "italic",
    },
  ],
  variable: "--fuente-cormorant",
  adjustFontFallback: "Times New Roman",
  display: "swap",
  preload: false,
})

/** Cuerpo de la plantilla `perfume`: geométrica, de la familia de Futura. */
export const jost = localFont({
  src: "./jost-400-600.woff2",
  weight: "400 600",
  variable: "--fuente-jost",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `calle`: una de cartel, pesada y angosta. */
export const anton = localFont({
  src: "./anton-400.woff2",
  weight: "400",
  variable: "--fuente-anton",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `atelier`: una didona, de revista de moda. */
export const bodoni = localFont({
  src: [
    { path: "./bodoni-500-700.woff2", weight: "500 700", style: "normal" },
    {
      path: "./bodoni-500-700-italica.woff2",
      weight: "500 700",
      style: "italic",
    },
  ],
  variable: "--fuente-bodoni",
  adjustFontFallback: "Times New Roman",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `pisada`: condensada y en cursiva, de cancha. */
export const barlow = localFont({
  src: [
    { path: "./barlow-600.woff2", weight: "600", style: "normal" },
    { path: "./barlow-700.woff2", weight: "700", style: "normal" },
    { path: "./barlow-800.woff2", weight: "800", style: "normal" },
    { path: "./barlow-600-italica.woff2", weight: "600", style: "italic" },
    { path: "./barlow-700-italica.woff2", weight: "700", style: "italic" },
    { path: "./barlow-800-italica.woff2", weight: "800", style: "italic" },
  ],
  variable: "--fuente-barlow",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `formula`: una romana fina, de etiqueta. */
export const instrument = localFont({
  src: [
    { path: "./instrument-400.woff2", weight: "400", style: "normal" },
    { path: "./instrument-400-italica.woff2", weight: "400", style: "italic" },
  ],
  variable: "--fuente-instrument",
  adjustFontFallback: "Times New Roman",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `bazar`: un grotesco con carácter, de letrero. */
export const bricolage = localFont({
  src: "./bricolage-600-800.woff2",
  weight: "600 800",
  variable: "--fuente-bricolage",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `quilate`: una romana de inscripción, de joyería. */
export const marcellus = localFont({
  src: "./marcellus-400.woff2",
  weight: "400",
  variable: "--fuente-marcellus",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `probador`: una serif de contraste alto, de revista. */
export const gloock = localFont({
  src: "./gloock-400.woff2",
  weight: "400",
  variable: "--fuente-gloock",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `ambar`: un cúfico geométrico, de perfumería árabe. */
export const reemkufi = localFont({
  src: "./reemkufi-600.woff2",
  weight: "600",
  variable: "--fuente-reemkufi",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `correa`: una grotesca ancha y alegre. */
export const syne = localFont({
  src: "./syne-700.woff2",
  weight: "700",
  variable: "--fuente-syne",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `tocador`: una serif de trazo suave (SOFT 100). */
export const fraunces = localFont({
  src: "./fraunces-600.woff2",
  weight: "600",
  variable: "--fuente-fraunces",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `crayon`: una redonda, de cuaderno de colegio. */
export const fredoka = localFont({
  src: "./fredoka-600.woff2",
  weight: "600",
  variable: "--fuente-fredoka",
  display: "swap",
  preload: false,
})

/** Las clases que declaran las variables. Van en `<html>`. */
export const VARIABLES_DE_FUENTES = [
  geist,
  geistMono,
  archivo,
  oswald,
  cormorant,
  jost,
  anton,
  bodoni,
  barlow,
  instrument,
  bricolage,
  marcellus,
  gloock,
  reemkufi,
  syne,
  fraunces,
  fredoka,
]
  .map((fuente) => fuente.variable)
  .join(" ")
