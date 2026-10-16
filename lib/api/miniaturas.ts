import "server-only"

import { getSiteUrl } from "@/lib/env"
import { plantillaDeTienda } from "@/lib/plantillas"

/**
 * Las plantillas que tienen su miniatura en `public/plantillas`.
 *
 * En la web la miniatura es un componente que se dibuja con los tokens de la
 * plantilla; la app necesita una imagen. Son capturas de ese mismo componente:
 * si cambia la base de una plantilla, o se suma una, se vuelve a capturar y se
 * agrega acá. Una plantilla sin miniatura se ofrece igual, sin imagen.
 */
const CON_MINIATURA = new Set([
  "atelier",
  "bazar",
  "calle",
  "fashion",
  "formula",
  "perfume",
  "pisada",
])

/** La dirección de la miniatura de una plantilla, o `null` si no tiene. */
export function miniaturaDePlantilla(clave: string): string | null {
  return CON_MINIATURA.has(clave)
    ? `${getSiteUrl()}/plantillas/${clave}.webp`
    : null
}

/**
 * La ruta de la plantilla vista en un celular, en `public/plantillas/celular`.
 *
 * Es lo que muestra la vista de una tienda que todavía no tiene captura —en
 * borrador, recién creada—: la portada de su plantilla con sus secciones y
 * productos de ejemplo, sacada como la captura real (390 × 780). La miniatura
 * de arriba es la de la galería, apaisada: dentro del celular se veía como
 * una computadora. Las ocho tienen la suya; si se suma una plantilla, se saca
 * la de ella.
 */
export function rutaDeVistaDePlantilla(clave: string | null): string {
  return `/plantillas/celular/${plantillaDeTienda(clave)}.webp`
}
