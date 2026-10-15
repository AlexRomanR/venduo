import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { after } from "next/server"

import { getMiTienda } from "@/lib/data/panel"
import { env, getSiteUrl } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/server"
import { urlDeTienda } from "@/lib/tienda"

/*
 * La vista de la tienda: una captura real de su portada, como la ve quien
 * compra desde el celular. La muestra la app en su Inicio.
 *
 * Cuándo hace falta una nueva lo decide la base (`vista_cambio_at`, ver la
 * migración `vista_de_tienda`). Acá se saca y se guarda. Solo la saca la ruta
 * `/api/v1/vista`, que es la única que lleva Chrome en su paquete; el resto
 * del servidor se la pide con `pedirVista`.
 */

/** El ancho de un celular común, y cuánto de la portada entra en la captura. */
const PANTALLA = { width: 390, height: 780 }
/**
 * La densidad de la captura: 390 × 1,4 da unos 540 px de ancho, lo que pide la
 * tarjeta del Inicio. Chrome la guarda en JPEG ya de ese tamaño, sin `sharp`:
 * en Vercel `sharp` necesita sus binarios declarados en cada ruta que lo
 * importa, y este módulo lo importan varias.
 */
const DENSIDAD = 1.4
/** Cuánto vale el candado: una captura que tarde más se da por perdida. */
const CANDADO_MS = 2 * 60 * 1000
const BUCKET = "store-assets"

/** La firma con que el servidor se pide a sí mismo una captura. */
export function firmaDeVista(tiendaId: string): string | null {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return null
  return createHmac("sha256", env.SUPABASE_SERVICE_ROLE_KEY)
    .update(`vista:${tiendaId}`)
    .digest("hex")
}

export function firmaValida(tiendaId: string, firma: string): boolean {
  const esperada = firmaDeVista(tiendaId)
  if (!esperada || esperada.length !== firma.length) return false
  return timingSafeEqual(Buffer.from(esperada), Buffer.from(firma))
}

/**
 * Pide una captura nueva sin esperarla. Para usar dentro de `after()`, después
 * de algo que cambió la portada. Si nada cambió, la ruta no hace nada.
 */
export async function pedirVista(tiendaId: string): Promise<void> {
  const firma = firmaDeVista(tiendaId)
  if (!firma) return
  try {
    await fetch(`${getSiteUrl()}/api/v1/vista`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tienda: tiendaId, firma }),
    })
  } catch (error) {
    console.error("[vista] no se pudo pedir la captura:", error)
  }
}

/**
 * Después de una edición del dueño desde la web: pide la captura nueva cuando
 * termine de responder. Si lo editado no se ve en la portada, la base no la
 * marcó vieja y la ruta no hace nada.
 */
export async function actualizarVistaDespues(): Promise<void> {
  const tienda = await getMiTienda()
  if (tienda) after(() => pedirVista(tienda.id))
}

async function abrirNavegador() {
  const puppeteer = await import("puppeteer-core")

  // En Vercel, el Chrome comprimido de @sparticuz; en la computadora, el que
  // esté instalado.
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default
    chromium.setGraphicsMode = false
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({
        args: chromium.args,
        headless: "shell",
      }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    })
  }

  return puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH ??
      (process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : "/usr/bin/google-chrome"),
    headless: true,
  })
}

/** La portada de la tienda, en JPEG y achicada. */
async function fotografiar(url: string): Promise<Buffer> {
  const navegador = await abrirNavegador()
  try {
    const pagina = await navegador.newPage()
    await pagina.setViewport({
      ...PANTALLA,
      deviceScaleFactor: DENSIDAD,
      isMobile: true,
      hasTouch: true,
    })
    await pagina.goto(url, { waitUntil: "networkidle0", timeout: 25_000 })
    await pagina.evaluate(() => document.fonts.ready)
    return Buffer.from(await pagina.screenshot({ type: "jpeg", quality: 80 }))
  } finally {
    await navegador.close()
  }
}

/** La carpeta y el nombre de una vista guardada, sacados de su dirección. */
function rutaEnElBucket(url: string | null): string | null {
  const marca = `/object/public/${BUCKET}/`
  const desde = url?.indexOf(marca) ?? -1
  return url && desde >= 0
    ? url.slice(desde + marca.length).split("?")[0]
    : null
}

/**
 * Saca la vista de una tienda si quedó vieja, y devuelve la vigente.
 *
 * Una tienda que no se sirve al público —en borrador, pausada, dada de baja—
 * no se puede fotografiar: devuelve la que tenga, o `null`.
 */
export async function capturarVista(tiendaId: string): Promise<string | null> {
  const admin = createAdminClient()
  if (!admin) return null

  const ahora = new Date()
  const vencido = new Date(ahora.getTime() - CANDADO_MS).toISOString()

  // El candado: solo sigue quien logra marcar la tienda como "capturando".
  const { data: tienda } = await admin
    .from("stores")
    .update({ vista_pedida_at: ahora.toISOString() })
    .eq("id", tiendaId)
    .or(`vista_pedida_at.is.null,vista_pedida_at.lt.${vencido}`)
    .select("id, slug, vista_url, vista_at, vista_cambio_at")
    .maybeSingle()

  if (!tienda) return null

  const soltar = (cambios: { vista_url?: string; vista_at?: string } = {}) =>
    admin
      .from("stores")
      .update({ ...cambios, vista_pedida_at: null })
      .eq("id", tiendaId)

  try {
    const alDia =
      tienda.vista_at &&
      new Date(tienda.vista_at) >= new Date(tienda.vista_cambio_at)
    const { data: enElAire } = await admin.rpc("store_is_live", {
      p_store_id: tiendaId,
    })

    if (alDia || !enElAire) {
      await soltar()
      return tienda.vista_url
    }

    const imagen = await fotografiar(urlDeTienda(tienda.slug))
    const ruta = `${tiendaId}/vista-${ahora.getTime()}.jpg`
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(ruta, imagen, { contentType: "image/jpeg", upsert: true })
    if (error) throw new Error(error.message)

    const url = admin.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl
    // `vista_at` es cuando empezó la captura: lo que se editó mientras tanto
    // la deja vieja otra vez, y la próxima vez se saca de nuevo.
    await soltar({ vista_url: url, vista_at: ahora.toISOString() })

    const anterior = rutaEnElBucket(tienda.vista_url)
    if (anterior) await admin.storage.from(BUCKET).remove([anterior])

    return url
  } catch (error) {
    console.error("[vista] no se pudo capturar la tienda:", error)
    await soltar()
    return tienda.vista_url
  }
}
