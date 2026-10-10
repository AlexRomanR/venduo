import "server-only"

import { getSiteUrl } from "@/lib/env"

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
