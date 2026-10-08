import {
  Anton,
  Archivo,
  Barlow_Condensed,
  Bodoni_Moda,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Jost,
  Oswald,
} from "next/font/google"

/**
 * Todas las tipografías de la aplicación, en un solo lugar.
 *
 * Cada una expone una variable `--fuente-*` y ninguna se aplica por sí sola:
 * `globals.css` elige cuál es el titular y cuál el cuerpo del mundo de
 * Venduo, y una plantilla las reasigna. Las claves y variables tienen que
 * coincidir con `lib/plantillas/fuentes.ts`.
 *
 * Solo se compila el subconjunto latino y los pesos que se usan: el público
 * está en datos móviles.
 */

export const geist = Geist({
  variable: "--fuente-geist",
  subsets: ["latin"],
})

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

/** Voz de titular y de cifra de Venduo: un grotesco industrial. */
export const archivo = Archivo({
  variable: "--fuente-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
})

// Las de plantilla no se precargan. Declararlas en <html> suma unas líneas de
// @font-face, pero el navegador solo baja el archivo de la que se usa; con
// precarga, la portada de Venduo bajaría las tres sin mostrar ninguna.

/** Titular de la plantilla `fashion`: condensada, pensada en mayúsculas. */
export const oswald = Oswald({
  variable: "--fuente-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `perfume`: una antigua de alto contraste. */
export const cormorant = Cormorant_Garamond({
  variable: "--fuente-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
})

/** Cuerpo de la plantilla `perfume`: geométrica, de la familia de Futura. */
export const jost = Jost({
  variable: "--fuente-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `calle`: una de cartel, pesada y angosta. */
export const anton = Anton({
  variable: "--fuente-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `atelier`: una didona, de revista de moda. */
export const bodoni = Bodoni_Moda({
  variable: "--fuente-bodoni",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `pisada`: condensada y en cursiva, de cancha. */
export const barlow = Barlow_Condensed({
  variable: "--fuente-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `formula`: una romana fina, de etiqueta. */
export const instrument = Instrument_Serif({
  variable: "--fuente-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
})

/** Titular de la plantilla `bazar`: un grotesco con carácter, de letrero. */
export const bricolage = Bricolage_Grotesque({
  variable: "--fuente-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
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
]
  .map((fuente) => fuente.variable)
  .join(" ")
