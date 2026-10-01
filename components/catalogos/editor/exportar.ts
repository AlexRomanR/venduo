import type { Catalogo } from "@/lib/catalogos/modelo"
import { slugify } from "@/lib/format"

/*
 * Bajar y compartir un catálogo desde el navegador.
 *
 * El PDF lo arma el servidor; acá solo se pide, se guarda en el teléfono o se
 * pasa a la hoja de compartir del sistema, que es donde está WhatsApp.
 */

export function nombreDelArchivo(nombre: string): string {
  return `${slugify(nombre) || "catalogo"}.pdf`
}

/** El PDF del catálogo tal como está en el editor, guardado o no. */
export async function pedirPdf(catalogo: Catalogo): Promise<Blob> {
  const respuesta = await fetch("/panel/catalogos/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(catalogo),
  })
  const tipo = respuesta.headers.get("Content-Type") ?? ""

  if (respuesta.ok && tipo.includes("application/pdf")) return respuesta.blob()
  // Una sesión vencida no da error: el middleware redirige a /login y llega
  // esa página con un 200. Por eso se mira el tipo y no solo el estado.
  if (respuesta.ok) throw new Error("Tu sesión venció. Vuelve a ingresar.")
  const aviso = tipo.startsWith("text/plain") ? await respuesta.text() : ""
  throw new Error(aviso || "No pudimos armar el PDF. Inténtalo de nuevo.")
}

/** Guarda el archivo en el dispositivo. */
export function descargar(archivo: Blob, nombre: string) {
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement("a")
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  // El navegador necesita la URL un momento después del clic.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

/** Si este navegador puede pasar un PDF a la hoja de compartir. */
export function puedeCompartirArchivos(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false
  const prueba = new File([""], "catalogo.pdf", { type: "application/pdf" })
  return navigator.canShare({ files: [prueba] })
}

/**
 * Pasa el PDF a la hoja de compartir del sistema: WhatsApp, Instagram, lo que
 * la persona tenga. Devuelve `false` si la persona la cerró sin compartir.
 */
export async function compartirArchivo(
  archivo: Blob,
  nombre: string,
  titulo: string
): Promise<boolean> {
  const pdf = new File([archivo], nombre, { type: "application/pdf" })
  try {
    await navigator.share({ files: [pdf], title: titulo })
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false
    }
    throw error
  }
}

/** Abre WhatsApp con el mensaje listo; la persona elige a quién. */
export function enlaceDeWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}
