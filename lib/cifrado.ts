import "server-only"

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"

/*
 * Cifrado de lo que Venduo guarda de otras plataformas —los permisos de TikTok—
 * y de los pedidos que viajan en una cookie mientras se va y se vuelve de su
 * pantalla de autorización. Solo servidor.
 *
 * AES-256-GCM: cifra y además detecta cualquier cambio. La llave se deriva del
 * secreto de la integración y del uso, así que un valor cifrado para un uso no
 * se descifra en otro. Cambiar el secreto invalida lo guardado: se descarta y
 * la persona vuelve a aprobar una vez.
 */

function llave(secreto: string, uso: string): Buffer {
  return createHash("sha256").update(`venduo:${uso}:${secreto}`).digest()
}

/** El vector, la etiqueta y el texto cifrado, en base64url. */
export function cifrar(texto: string, secreto: string, uso: string): string {
  const iv = randomBytes(12)
  const cifrador = createCipheriv("aes-256-gcm", llave(secreto, uso), iv)
  const cifrado = Buffer.concat([
    cifrador.update(texto, "utf8"),
    cifrador.final(),
  ])
  return Buffer.concat([iv, cifrador.getAuthTag(), cifrado]).toString(
    "base64url"
  )
}

/** El texto, o `null` si no es auténtico. */
export function descifrar(
  valor: string,
  secreto: string,
  uso: string
): string | null {
  try {
    const crudo = Buffer.from(valor, "base64url")
    const descifrador = createDecipheriv(
      "aes-256-gcm",
      llave(secreto, uso),
      crudo.subarray(0, 12)
    )
    descifrador.setAuthTag(crudo.subarray(12, 28))
    return Buffer.concat([
      descifrador.update(crudo.subarray(28)),
      descifrador.final(),
    ]).toString("utf8")
  } catch {
    return null
  }
}

/** Un valor al azar, para un `state` o un nombre de archivo que no se adivina. */
export function azar(bytes = 24): string {
  return randomBytes(bytes).toString("base64url")
}
