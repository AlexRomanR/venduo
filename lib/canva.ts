import "server-only"

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"
import { z } from "zod"

import { hojasDe } from "@/lib/catalogos/datos"
import { problemasDeEstilo } from "@/lib/catalogos/estilo"
import { catalogoEnPdf } from "@/lib/catalogos/pdf"
import { getCatalogo, getMaterialDelCatalogo } from "@/lib/data/catalogos"
import { env, isCanvaConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/server"

/*
 * Editar un catálogo en Canva, directo.
 *
 * Canva no recibe un catálogo: recibe un PDF y lo convierte en un diseño
 * editable de la cuenta de la persona —textos, fotos y colores—, y devuelve el
 * enlace para seguir en su editor.
 *
 * **La aprobación se pide una sola vez.** La primera, la persona autoriza con
 * OAuth y PKCE, y se guarda el token de renovación que entrega Canva, cifrado,
 * en `social_connections`. Las siguientes se cambia por un permiso nuevo sin
 * pasar por su pantalla. Canva da un token de renovación distinto cada vez, y
 * se guarda el nuevo. Si ya no sirve —la persona quitó el acceso desde Canva—
 * se borra y se vuelve a pedir la aprobación.
 *
 * Necesita una integración creada en el portal de desarrolladores de Canva,
 * con el alcance `design:content:write` y la dirección de vuelta
 * `{sitio}/panel/catalogos/canva`. Sin sus credenciales, el editor ofrece el
 * camino a mano: bajar el PDF y subirlo a Canva.
 */

const AUTORIZAR = "https://www.canva.com/api/oauth/authorize"
const API = "https://api.canva.com/rest/v1"
const ALCANCES = "design:content:write"

/** La cookie que lleva el pedido en curso, cifrada, mientras se va a Canva y se vuelve. */
export const COOKIE_DE_CANVA = "canva_pedido"

export { isCanvaConfigured }

/** La dirección a la que Canva devuelve a la persona. Tiene que estar dada de alta allá. */
export function direccionDeVuelta(origen: string): string {
  return `${origen}/panel/catalogos/canva`
}

/* ---------------------------------------------------------------------------
 * Cifrado
 * ------------------------------------------------------------------------ */

function aBase64Url(datos: Buffer): string {
  return datos.toString("base64url")
}

/**
 * La llave de cada uso, derivada del secreto de la integración.
 *
 * Cambiar el secreto invalida los tokens guardados: no se pueden descifrar, se
 * descartan y la persona vuelve a aprobar una vez.
 */
function llave(uso: "pedido" | "token"): Buffer {
  return createHash("sha256")
    .update(`venduo-canva:${uso}:${env.CANVA_CLIENT_SECRET ?? ""}`)
    .digest()
}

/** AES-256-GCM: el vector, la etiqueta y el texto cifrado, en base64url. */
function cifrar(texto: string, uso: "pedido" | "token"): string {
  const iv = randomBytes(12)
  const cifrador = createCipheriv("aes-256-gcm", llave(uso), iv)
  const cifrado = Buffer.concat([
    cifrador.update(texto, "utf8"),
    cifrador.final(),
  ])
  return aBase64Url(Buffer.concat([iv, cifrador.getAuthTag(), cifrado]))
}

/** El texto, o `null` si no es auténtico. */
function descifrar(valor: string, uso: "pedido" | "token"): string | null {
  try {
    const crudo = Buffer.from(valor, "base64url")
    const descifrador = createDecipheriv(
      "aes-256-gcm",
      llave(uso),
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

/* ---------------------------------------------------------------------------
 * El pedido en curso
 * ------------------------------------------------------------------------ */

const pedidoSchema = z.object({
  estado: z.string().min(16),
  verificador: z.string().min(43).max(128),
  catalogo: z.string().min(1).max(64),
  vence: z.number(),
})

export type PedidoACanva = z.infer<typeof pedidoSchema>

/**
 * Un pedido nuevo: el estado contra la falsificación y el verificador de PKCE.
 *
 * Canva pide que el verificador no lo pueda leer ni la persona ni su
 * navegador: viaja en una cookie HttpOnly y cifrada, así que el navegador solo
 * guarda algo que no puede abrir.
 */
export function pedidoNuevo(catalogo: string): {
  pedido: PedidoACanva
  cookie: string
} {
  const pedido: PedidoACanva = {
    estado: aBase64Url(randomBytes(24)),
    verificador: aBase64Url(randomBytes(48)),
    catalogo,
    vence: Date.now() + 10 * 60_000,
  }
  return { pedido, cookie: cifrar(JSON.stringify(pedido), "pedido") }
}

/** El pedido guardado en la cookie, si es auténtico y no venció. */
export function leerPedido(cookie: string | undefined): PedidoACanva | null {
  // Sin la integración, la llave saldría de un secreto vacío.
  if (!cookie || !isCanvaConfigured) return null
  const texto = descifrar(cookie, "pedido")
  if (!texto) return null
  try {
    const pedido = pedidoSchema.parse(JSON.parse(texto))
    return pedido.vence > Date.now() ? pedido : null
  } catch {
    return null
  }
}

/** A dónde mandar a la persona para que autorice. */
export function direccionDeAutorizacion(
  pedido: PedidoACanva,
  vuelta: string
): string {
  const desafio = aBase64Url(
    createHash("sha256").update(pedido.verificador).digest()
  )
  const parametros = new URLSearchParams({
    code_challenge: desafio,
    code_challenge_method: "S256",
    scope: ALCANCES,
    response_type: "code",
    client_id: env.CANVA_CLIENT_ID ?? "",
    state: pedido.estado,
    redirect_uri: vuelta,
  })
  return `${AUTORIZAR}?${parametros.toString()}`
}

/* ---------------------------------------------------------------------------
 * Los permisos
 * ------------------------------------------------------------------------ */

const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
})

export interface Permiso {
  /** Para llamar a la API ahora. No se guarda. */
  acceso: string
  /** Para pedir el próximo sin la pantalla de Canva. Se guarda cifrado. */
  renovacion: string | null
}

/** Un rechazo de Canva al pedir un permiso, con su código HTTP. */
class RechazoDeCanva extends Error {
  constructor(
    readonly estado: number,
    detalle: string
  ) {
    super(`Canva no dio el permiso (${estado}): ${detalle}`)
  }
}

function credenciales(): string {
  return Buffer.from(
    `${env.CANVA_CLIENT_ID}:${env.CANVA_CLIENT_SECRET}`
  ).toString("base64")
}

async function pedirToken(cuerpo: Record<string, string>): Promise<Permiso> {
  const respuesta = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credenciales()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(cuerpo),
    signal: AbortSignal.timeout(15_000),
  })
  if (!respuesta.ok) {
    throw new RechazoDeCanva(respuesta.status, await respuesta.text())
  }
  const token = tokenSchema.parse(await respuesta.json())
  return { acceso: token.access_token, renovacion: token.refresh_token ?? null }
}

/** Cambia el código de la vuelta por un permiso. */
export function pedirPermiso(
  codigo: string,
  verificador: string,
  vuelta: string
): Promise<Permiso> {
  return pedirToken({
    grant_type: "authorization_code",
    code: codigo,
    code_verifier: verificador,
    redirect_uri: vuelta,
  })
}

/* ---------------------------------------------------------------------------
 * La conexión guardada
 * ------------------------------------------------------------------------ */

/*
 * La conexión vive en `social_connections`, una fila por tienda y proveedor,
 * con RLS activo y cero políticas: solo la toca el servidor, con la clave de
 * servicio. Quien llama ya resolvió la tienda con la sesión de la persona.
 */

/** Guarda el token de renovación de la tienda, cifrado. */
export async function guardarConexion(
  tienda: string,
  renovacion: string
): Promise<void> {
  const admin = createAdminClient()
  if (!admin) return
  const { error } = await admin.from("social_connections").upsert(
    {
      store_id: tienda,
      provider: "canva",
      refresh_token: cifrar(renovacion, "token"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "store_id,provider" }
  )
  // Sin guardarlo, la próxima vez se vuelve a pedir la aprobación: molesto,
  // no grave. No vale cortar el viaje a Canva por eso.
  if (error) console.error("[canva] no se pudo guardar la conexión:", error)
}

async function borrarConexion(tienda: string): Promise<void> {
  const admin = createAdminClient()
  if (!admin) return
  await admin
    .from("social_connections")
    .delete()
    .eq("store_id", tienda)
    .eq("provider", "canva")
}

async function renovacionGuardada(tienda: string): Promise<string | null> {
  const admin = createAdminClient()
  if (!admin) return null
  const { data } = await admin
    .from("social_connections")
    .select("refresh_token")
    .eq("store_id", tienda)
    .eq("provider", "canva")
    .maybeSingle()
  return data?.refresh_token ? descifrar(data.refresh_token, "token") : null
}

/** Si la tienda ya aprobó a Venduo en Canva. */
export async function estaConectado(tienda: string): Promise<boolean> {
  if (!isCanvaConfigured) return false
  return (await renovacionGuardada(tienda)) !== null
}

/**
 * Un permiso nuevo sin pasar por la pantalla de Canva, o `null` si hay que
 * pedir la aprobación.
 *
 * El token viejo deja de servir al renovarlo: el nuevo se guarda antes de
 * seguir. Si Canva lo rechaza, se borra; si el problema fue de red, se deja,
 * y la aprobación que sigue lo reemplaza igual.
 */
export async function permisoGuardado(tienda: string): Promise<string | null> {
  if (!isCanvaConfigured) return null
  const renovacion = await renovacionGuardada(tienda)
  if (!renovacion) return null
  try {
    const permiso = await pedirToken({
      grant_type: "refresh_token",
      refresh_token: renovacion,
    })
    if (permiso.renovacion) await guardarConexion(tienda, permiso.renovacion)
    return permiso.acceso
  } catch (error) {
    if (
      error instanceof RechazoDeCanva &&
      (error.estado === 400 || error.estado === 401)
    ) {
      await borrarConexion(tienda)
    } else {
      console.error("[canva] no se pudo renovar el permiso:", error)
    }
    return null
  }
}

/**
 * Desconecta la tienda: Canva revoca el token —y con él su aprobación— y se
 * borra la fila. Aunque Canva no responda, la fila se borra: lo que la persona
 * pidió es que Venduo deje de tener acceso.
 */
export async function desconectarCanva(tienda: string): Promise<void> {
  const renovacion = await renovacionGuardada(tienda)
  if (renovacion && isCanvaConfigured) {
    try {
      await fetch(`${API}/oauth/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credenciales()}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token: renovacion }),
        signal: AbortSignal.timeout(10_000),
      })
    } catch (error) {
      console.error("[canva] no se pudo revocar el permiso:", error)
    }
  }
  await borrarConexion(tienda)
}

/* ---------------------------------------------------------------------------
 * La importación
 * ------------------------------------------------------------------------ */

const trabajoSchema = z.object({
  job: z.object({
    id: z.string(),
    status: z.enum(["in_progress", "success", "failed"]),
    result: z
      .object({
        designs: z
          .array(z.object({ urls: z.object({ edit_url: z.string().url() }) }))
          .min(1),
      })
      .optional(),
    error: z.object({ code: z.string(), message: z.string() }).optional(),
  }),
})

/**
 * Sube el PDF a la cuenta de la persona como un diseño nuevo y devuelve el
 * enlace para editarlo.
 *
 * La importación es un trabajo que tarda unos segundos: se consulta cada
 * segundo y medio hasta que termina, dentro del tiempo de la función.
 */
async function importarEnCanva(
  acceso: string,
  pdf: Buffer,
  titulo: string
): Promise<string> {
  const respuesta = await fetch(`${API}/imports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${acceso}`,
      "Content-Type": "application/octet-stream",
      "Import-Metadata": JSON.stringify({
        // Canva acepta hasta 50 caracteres de título, en base64.
        title_base64: Buffer.from(titulo.slice(0, 50), "utf8").toString(
          "base64"
        ),
        mime_type: "application/pdf",
      }),
    },
    body: new Uint8Array(pdf),
    signal: AbortSignal.timeout(30_000),
  })
  if (!respuesta.ok) {
    throw new Error(
      `Canva no aceptó el PDF (${respuesta.status}): ${await respuesta.text()}`
    )
  }

  let { job } = trabajoSchema.parse(await respuesta.json())
  for (
    let intento = 0;
    intento < 30 && job.status === "in_progress";
    intento++
  ) {
    await new Promise((listo) => setTimeout(listo, 1_500))
    const consulta = await fetch(`${API}/imports/${job.id}`, {
      headers: { Authorization: `Bearer ${acceso}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!consulta.ok) {
      throw new Error(`Canva no respondió la importación (${consulta.status})`)
    }
    job = trabajoSchema.parse(await consulta.json()).job
  }

  if (job.status === "success" && job.result) {
    return job.result.designs[0].urls.edit_url
  }
  throw new Error(
    job.error
      ? `Canva no pudo importar el PDF: ${job.error.code} ${job.error.message}`
      : "Canva tardó demasiado en importar el PDF"
  )
}

/**
 * El catálogo guardado, con los precios de hoy, convertido en un diseño de
 * Canva. Devuelve el enlace a su editor, o `null` si el catálogo no existe o
 * no se puede armar. Un rechazo de Canva se lanza.
 */
export async function catalogoACanva(
  acceso: string,
  catalogo: string
): Promise<string | null> {
  const [abierto, { datos }] = await Promise.all([
    getCatalogo(catalogo),
    getMaterialDelCatalogo(),
  ])
  if (
    !abierto ||
    problemasDeEstilo(abierto.catalogo.estilo).length > 0 ||
    hojasDe(abierto.catalogo, datos).length === 0
  ) {
    return null
  }
  const pdf = await catalogoEnPdf(abierto.catalogo, datos)
  return importarEnCanva(acceso, pdf, abierto.catalogo.nombre)
}
