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

/**
 * Baja el PDF del catálogo como una descarga del propio navegador.
 *
 * Antes se pedía con `fetch` y se guardaba con un enlace a un blob, y algunos
 * navegadores lo dejaban sin extensión y en una carpeta temporal. Ahora se
 * manda un formulario y el servidor responde el archivo como `attachment`:
 * el navegador lo guarda en Descargas, con su nombre y su `.pdf`.
 *
 * El formulario apunta a un `iframe` oculto para no salir de la pantalla. Una
 * descarga no avisa cuándo empieza, así que el servidor devuelve una cookie
 * con la marca de este pedido; un error, en cambio, carga como página en el
 * `iframe`, y su texto es el aviso.
 */
export function descargarPdf(catalogo: Catalogo): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const marca = crypto.randomUUID().replace(/-/g, "")
    const marco = document.createElement("iframe")
    marco.name = `descarga-${marca}`
    marco.hidden = true
    document.body.append(marco)

    const formulario = document.createElement("form")
    formulario.method = "POST"
    formulario.action = "/panel/catalogos/pdf"
    formulario.target = marco.name
    formulario.hidden = true
    for (const [nombre, valor] of [
      ["catalogo", JSON.stringify(catalogo)],
      ["descarga", marca],
    ]) {
      const campo = document.createElement("input")
      campo.type = "hidden"
      campo.name = nombre
      campo.value = valor
      formulario.append(campo)
    }
    document.body.append(formulario)

    let terminado = false
    const terminar = () => {
      terminado = true
      window.clearInterval(vigia)
      window.clearTimeout(tope)
      formulario.remove()
      window.setTimeout(() => marco.remove(), 1_000)
    }

    marco.addEventListener("load", () => {
      if (terminado) return
      const lugar = marco.contentWindow?.location
      // El `iframe` recién creado carga about:blank: eso no es una respuesta.
      if (!lugar || lugar.href === "about:blank") return
      const texto = marco.contentDocument?.body?.textContent?.trim() ?? ""
      terminar()
      rechazar(
        new Error(
          lugar.pathname.startsWith("/login")
            ? "Tu sesión venció. Vuelve a ingresar."
            : texto.length > 0 && texto.length < 300
              ? texto
              : "No pudimos armar el PDF. Inténtalo de nuevo."
        )
      )
    })

    const vigia = window.setInterval(() => {
      if (document.cookie.split("; ").includes(`descarga=${marca}`)) {
        document.cookie = "descarga=; Max-Age=0; Path=/"
        terminar()
        resolver()
      }
    }, 250)
    // Si la cookie no llegara, no dejar el botón esperando para siempre.
    const tope = window.setTimeout(() => {
      terminar()
      resolver()
    }, 60_000)

    formulario.submit()
  })
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
