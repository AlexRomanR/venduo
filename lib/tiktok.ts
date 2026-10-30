import "server-only"

import { z } from "zod"

import { azar, cifrar, descifrar } from "@/lib/cifrado"
import { env, isTikTokConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/server"
import { PRIVACIDADES, type Privacidad } from "@/lib/tiktok-textos"

/*
 * Publicar en TikTok, directo, con su Content Posting API.
 *
 * **La aprobación se pide una sola vez.** La tienda autoriza a Venduo en
 * TikTok (Login Kit, `video.publish`); el permiso de acceso dura 24 horas y el
 * de renovación un año. Los dos se guardan cifrados en `social_connections`
 * —RLS activo, cero políticas, solo la clave de servicio—, y el de acceso se
 * renueva solo cuando vence. Si TikTok rechaza la renovación —la persona quitó
 * el acceso desde TikTok—, se borra y se vuelve a pedir la aprobación.
 *
 * **Lo que se publica pasa por la persona.** TikTok exige, y la pantalla
 * cumple, que vea con qué cuenta publica, la vista previa, el título, quién lo
 * puede ver —sin nada elegido de antemano—, los comentarios y el aviso de
 * contenido comercial. Nada sale hasta que toca "Publicar".
 *
 * **La foto la baja TikTok** desde una dirección pública de un dominio que
 * verificó (`PULL_FROM_URL`): se sube un JPEG a `store-assets` y se sirve en
 * `/api/tiktok/foto/{tienda}/{archivo}`, con un nombre que no se adivina.
 *
 * Mientras la integración no pase la revisión de TikTok, todo lo publicado
 * queda en "Solo yo": lo dice TikTok en las opciones de privacidad que
 * devuelve, y la pantalla muestra solo esas.
 */

const AUTORIZAR = "https://www.tiktok.com/v2/auth/authorize/"
const API = "https://open.tiktokapis.com/v2"
const ALCANCES = "user.info.basic,video.publish"

/** La cookie que lleva el pedido en curso mientras se va a TikTok y se vuelve. */
export const COOKIE_DE_TIKTOK = "tiktok_pedido"

export { isTikTokConfigured }

/** A dónde devuelve TikTok. Tiene que estar dada de alta en su Login Kit. */
export function direccionDeVuelta(origen: string): string {
  return `${origen}/panel/marketing/tiktok/vuelta`
}

const secreto = () => env.TIKTOK_CLIENT_SECRET ?? ""

/* ---------------------------------------------------------------------------
 * El pedido de autorización
 * ------------------------------------------------------------------------ */

const pedidoSchema = z.object({
  estado: z.string().min(16),
  /** A dónde volver: siempre una pantalla de "Publicar en redes". */
  volver: z.string().startsWith("/panel/marketing"),
  vence: z.number(),
})

/** Un pedido nuevo y su cookie cifrada. Vence en diez minutos. */
export function pedidoNuevo(volver: string): {
  estado: string
  cookie: string
} {
  const estado = azar()
  const seguro = volver.startsWith("/panel/marketing")
    ? volver
    : "/panel/marketing"
  const pedido = { estado, volver: seguro, vence: Date.now() + 10 * 60_000 }
  return {
    estado,
    cookie: cifrar(JSON.stringify(pedido), secreto(), "tiktok-pedido"),
  }
}

/** El pedido de la cookie, o `null` si no es auténtico o venció. */
export function leerPedido(
  cookie: string | undefined
): z.infer<typeof pedidoSchema> | null {
  if (!cookie) return null
  const texto = descifrar(cookie, secreto(), "tiktok-pedido")
  if (!texto) return null
  try {
    const pedido = pedidoSchema.parse(JSON.parse(texto))
    return pedido.vence > Date.now() ? pedido : null
  } catch {
    return null
  }
}

/** La pantalla de TikTok donde la persona aprueba a Venduo. */
export function direccionDeAutorizacion(
  origen: string,
  estado: string
): string {
  const consulta = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY ?? "",
    response_type: "code",
    scope: ALCANCES,
    redirect_uri: direccionDeVuelta(origen),
    state: estado,
  })
  return `${AUTORIZAR}?${consulta.toString()}`
}

/* ---------------------------------------------------------------------------
 * Los permisos
 * ------------------------------------------------------------------------ */

const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number(),
  refresh_token: z.string().min(1),
  open_id: z.string().min(1),
  scope: z.string(),
})

/** Un rechazo de TikTok, con su código: lo que la pantalla traduce. */
export class RechazoDeTiktok extends Error {
  constructor(
    readonly codigo: string,
    readonly estado: number,
    detalle: string
  ) {
    super(`TikTok rechazó el pedido (${estado} ${codigo}): ${detalle}`)
  }
}

async function pedirToken(cuerpo: Record<string, string>) {
  const respuesta = await fetch(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY ?? "",
      client_secret: secreto(),
      ...cuerpo,
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const datos: unknown = await respuesta.json().catch(() => null)
  const token = tokenSchema.safeParse(datos)
  if (!respuesta.ok || !token.success) {
    const error = z.object({ error: z.string().optional() }).safeParse(datos)
    throw new RechazoDeTiktok(
      (error.success && error.data.error) || "token",
      respuesta.status,
      JSON.stringify(datos).slice(0, 300)
    )
  }
  return token.data
}

/** Guarda los permisos de la tienda, cifrados. */
async function guardar(
  tienda: string,
  token: z.infer<typeof tokenSchema>
): Promise<void> {
  const admin = createAdminClient()
  if (!admin) return
  const { error } = await admin.from("social_connections").upsert(
    {
      store_id: tienda,
      provider: "tiktok",
      external_account_id: token.open_id,
      access_token: cifrar(token.access_token, secreto(), "tiktok-acceso"),
      refresh_token: cifrar(
        token.refresh_token,
        secreto(),
        "tiktok-renovacion"
      ),
      // Cinco minutos antes, para no usar uno que vence en el camino.
      expires_at: new Date(
        Date.now() + (token.expires_in - 300) * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "store_id,provider" }
  )
  if (error) console.error("[tiktok] no se pudo guardar la conexión:", error)
}

/** Cambia el código de la vuelta por los permisos y los guarda. */
export async function conectar(
  tienda: string,
  codigo: string,
  origen: string
): Promise<void> {
  const token = await pedirToken({
    grant_type: "authorization_code",
    code: codigo,
    redirect_uri: direccionDeVuelta(origen),
  })
  await guardar(tienda, token)
}

async function borrar(tienda: string): Promise<void> {
  const admin = createAdminClient()
  if (!admin) return
  await admin
    .from("social_connections")
    .delete()
    .eq("store_id", tienda)
    .eq("provider", "tiktok")
}

/**
 * El permiso de acceso vigente de la tienda, renovado si venció, o `null` si
 * no conectó TikTok o hay que volver a pedir la aprobación.
 */
export async function accesoVigente(tienda: string): Promise<string | null> {
  if (!isTikTokConfigured) return null
  const admin = createAdminClient()
  if (!admin) return null
  const { data } = await admin
    .from("social_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("store_id", tienda)
    .eq("provider", "tiktok")
    .maybeSingle()
  if (!data?.refresh_token) return null

  if (
    data.access_token &&
    data.expires_at &&
    Date.parse(data.expires_at) > Date.now()
  ) {
    const acceso = descifrar(data.access_token, secreto(), "tiktok-acceso")
    if (acceso) return acceso
  }

  const renovacion = descifrar(
    data.refresh_token,
    secreto(),
    "tiktok-renovacion"
  )
  if (!renovacion) {
    await borrar(tienda)
    return null
  }
  try {
    // TikTok puede devolver un permiso de renovación nuevo: se guarda ese.
    const token = await pedirToken({
      grant_type: "refresh_token",
      refresh_token: renovacion,
    })
    await guardar(tienda, token)
    return token.access_token
  } catch (error) {
    if (error instanceof RechazoDeTiktok && error.estado < 500) {
      await borrar(tienda)
    } else {
      console.error("[tiktok] no se pudo renovar el permiso:", error)
    }
    return null
  }
}

/**
 * Desconecta la tienda: TikTok revoca el permiso —Venduo desaparece de sus
 * "Apps con permiso"— y se borra la fila. Aunque TikTok no responda, la fila
 * se borra: lo que la persona pidió es que Venduo deje de tener acceso.
 */
export async function desconectar(tienda: string): Promise<void> {
  const acceso = await accesoVigente(tienda)
  if (acceso) {
    await fetch(`${API}/oauth/revoke/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY ?? "",
        client_secret: secreto(),
        token: acceso,
      }),
      signal: AbortSignal.timeout(10_000),
    }).catch((error) => console.error("[tiktok] no se pudo revocar:", error))
  }
  await borrar(tienda)
}

/* ---------------------------------------------------------------------------
 * La API de publicación
 * ------------------------------------------------------------------------ */

const respuestaSchema = z.object({
  data: z.unknown(),
  error: z.object({ code: z.string(), message: z.string().optional() }),
})

async function llamar(
  acceso: string,
  ruta: string,
  cuerpo: unknown
): Promise<unknown> {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${acceso}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(20_000),
  })
  const leida = respuestaSchema.safeParse(
    await respuesta.json().catch(() => null)
  )
  if (!leida.success) {
    throw new RechazoDeTiktok(
      "respuesta",
      respuesta.status,
      "Respuesta ilegible"
    )
  }
  if (leida.data.error.code !== "ok") {
    throw new RechazoDeTiktok(
      leida.data.error.code,
      respuesta.status,
      leida.data.error.message ?? ""
    )
  }
  return leida.data.data
}

export { PRIVACIDADES, type Privacidad }

const creadorSchema = z.object({
  creator_avatar_url: z.string().optional(),
  creator_username: z.string().optional(),
  creator_nickname: z.string(),
  privacy_level_options: z.array(z.string()),
  comment_disabled: z.boolean().optional(),
})

export interface CuentaDeTiktok {
  apodo: string
  usuario: string | null
  avatar: string | null
  privacidades: Privacidad[]
  comentariosApagados: boolean
}

/**
 * La cuenta con la que se publica y lo que permite hoy. TikTok pide leerla
 * cada vez que se abre la pantalla de publicar: sus opciones cambian si la
 * persona cambia su cuenta de pública a privada.
 */
export async function cuentaDeTiktok(acceso: string): Promise<CuentaDeTiktok> {
  const datos = creadorSchema.parse(
    await llamar(acceso, "/post/publish/creator_info/query/", {})
  )
  return {
    apodo: datos.creator_nickname,
    usuario: datos.creator_username ?? null,
    avatar: datos.creator_avatar_url ?? null,
    privacidades: datos.privacy_level_options.filter(
      (opcion): opcion is Privacidad =>
        (PRIVACIDADES as readonly string[]).includes(opcion)
    ),
    comentariosApagados: Boolean(datos.comment_disabled),
  }
}

export interface PublicacionDeFoto {
  foto: string
  titulo: string
  descripcion: string
  privacidad: Privacidad
  sinComentarios: boolean
  musica: boolean
  /** Promociona lo propio: "Contenido promocional". */
  marcaPropia: boolean
  /** Promociona a un tercero: "Colaboración pagada". */
  contenidoPagado: boolean
}

/** Manda la foto a publicar. Devuelve con qué seguir su estado. */
export async function publicarFoto(
  acceso: string,
  publicacion: PublicacionDeFoto
): Promise<string> {
  const datos = z.object({ publish_id: z.string() }).parse(
    await llamar(acceso, "/post/publish/content/init/", {
      media_type: "PHOTO",
      post_mode: "DIRECT_POST",
      post_info: {
        title: publicacion.titulo,
        description: publicacion.descripcion,
        privacy_level: publicacion.privacidad,
        disable_comment: publicacion.sinComentarios,
        auto_add_music: publicacion.musica,
        brand_content_toggle: publicacion.contenidoPagado,
        brand_organic_toggle: publicacion.marcaPropia,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_images: [publicacion.foto],
        photo_cover_index: 0,
      },
    })
  )
  return datos.publish_id
}

const estadoSchema = z.object({
  status: z.string(),
  fail_reason: z.string().optional(),
})

export type EstadoDePublicacion =
  | { tipo: "procesando" }
  | { tipo: "publicada" }
  | { tipo: "fallida"; motivo: string }

/** En qué va una publicación. */
export async function estadoDePublicacion(
  acceso: string,
  publicacion: string
): Promise<EstadoDePublicacion> {
  const datos = estadoSchema.parse(
    await llamar(acceso, "/post/publish/status/fetch/", {
      publish_id: publicacion,
    })
  )
  if (datos.status === "PUBLISH_COMPLETE") return { tipo: "publicada" }
  if (datos.status === "FAILED") {
    return { tipo: "fallida", motivo: datos.fail_reason ?? "internal" }
  }
  return { tipo: "procesando" }
}

/** Lo que TikTok contestó, dicho para la persona. */
export function mensajeDeTiktok(codigo: string): string {
  switch (codigo) {
    case "spam_risk_too_many_posts":
      return "Llegaste al límite de publicaciones de TikTok por hoy. Prueba mañana."
    case "spam_risk_user_banned_from_posting":
      return "TikTok no deja publicar desde esta cuenta por ahora."
    case "reached_active_user_cap":
      return "Hoy ya publicaron muchas tiendas desde Venduo. Prueba más tarde."
    case "unaudited_client_can_only_post_to_private_accounts":
      return "Por ahora solo se puede publicar en cuentas privadas de TikTok."
    case "privacy_level_option_mismatch":
      return "Esa opción de privacidad ya no está disponible en tu cuenta. Elige otra."
    case "access_token_invalid":
    case "scope_not_authorized":
    case "auth_removed":
      return "Vuelve a conectar tu cuenta de TikTok."
    case "rate_limit_exceeded":
      return "Espera un minuto e inténtalo de nuevo."
    case "photo_pull_failed":
    case "picture_size_check_failed":
    case "file_format_check_failed":
      return "TikTok no pudo leer la imagen. Inténtalo de nuevo."
    case "spam_risk_text":
    case "spam_risk":
      return "TikTok no aceptó la publicación. Revisa el texto e inténtalo de nuevo."
    case "publish_cancelled":
      return "La publicación se canceló."
    default:
      return "TikTok no pudo publicarla. Inténtalo de nuevo en un momento."
  }
}
