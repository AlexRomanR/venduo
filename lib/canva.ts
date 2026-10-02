import "server-only"

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"
import { z } from "zod"

import { env, isCanvaConfigured } from "@/lib/env"

/*
 * Editar un catálogo en Canva, directo.
 *
 * Canva no recibe un catálogo: recibe un PDF y lo convierte en un diseño
 * editable de la cuenta de la persona —textos, fotos y colores—, y devuelve el
 * enlace para seguir en su editor. Para eso la persona autoriza a Venduo una
 * vez por pedido, con OAuth y PKCE, y el permiso se usa en el momento y no se
 * guarda: no hay tabla de tokens que cuidar.
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
 * El pedido en curso
 * ------------------------------------------------------------------------ */

const pedidoSchema = z.object({
  estado: z.string().min(16),
  verificador: z.string().min(43).max(128),
  catalogo: z.string().min(1).max(64),
  vence: z.number(),
})

export type PedidoACanva = z.infer<typeof pedidoSchema>

function aBase64Url(datos: Buffer): string {
  return datos.toString("base64url")
}

/** La llave de la cookie, derivada del secreto de la integración. */
function llave(): Buffer {
  return createHash("sha256")
    .update(`venduo-canva:${env.CANVA_CLIENT_SECRET ?? ""}`)
    .digest()
}

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
  const iv = randomBytes(12)
  const cifrador = createCipheriv("aes-256-gcm", llave(), iv)
  const cifrado = Buffer.concat([
    cifrador.update(JSON.stringify(pedido), "utf8"),
    cifrador.final(),
  ])
  const cookie = aBase64Url(Buffer.concat([iv, cifrador.getAuthTag(), cifrado]))
  return { pedido, cookie }
}

/** El pedido guardado en la cookie, si es auténtico y no venció. */
export function leerPedido(cookie: string | undefined): PedidoACanva | null {
  // Sin la integración, la llave saldría de un secreto vacío.
  if (!cookie || !isCanvaConfigured) return null
  try {
    const crudo = Buffer.from(cookie, "base64url")
    const descifrador = createDecipheriv(
      "aes-256-gcm",
      llave(),
      crudo.subarray(0, 12)
    )
    descifrador.setAuthTag(crudo.subarray(12, 28))
    const texto = Buffer.concat([
      descifrador.update(crudo.subarray(28)),
      descifrador.final(),
    ]).toString("utf8")
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
 * La API
 * ------------------------------------------------------------------------ */

const tokenSchema = z.object({ access_token: z.string().min(1) })

/** Cambia el código de la vuelta por un permiso de un solo uso. */
export async function pedirPermiso(
  codigo: string,
  verificador: string,
  vuelta: string
): Promise<string> {
  const credenciales = Buffer.from(
    `${env.CANVA_CLIENT_ID}:${env.CANVA_CLIENT_SECRET}`
  ).toString("base64")
  const respuesta = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credenciales}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: codigo,
      code_verifier: verificador,
      redirect_uri: vuelta,
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!respuesta.ok) {
    throw new Error(
      `Canva no dio el permiso (${respuesta.status}): ${await respuesta.text()}`
    )
  }
  return tokenSchema.parse(await respuesta.json()).access_token
}

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
export async function importarEnCanva(
  permiso: string,
  pdf: Buffer,
  titulo: string
): Promise<string> {
  const respuesta = await fetch(`${API}/imports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${permiso}`,
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
      headers: { Authorization: `Bearer ${permiso}` },
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
