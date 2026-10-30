"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { azar } from "@/lib/cifrado"
import { exigirFuncion } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { getMaterialParaPublicar } from "@/lib/data/publicar"
import { getSiteUrl } from "@/lib/env"
import { imagenEnJpeg } from "@/lib/publicar-imagen"
import { createAdminClient } from "@/lib/supabase/server"
import {
  accesoVigente,
  cuentaDeTiktok,
  desconectar,
  estadoDePublicacion,
  mensajeDeTiktok,
  PRIVACIDADES,
  publicarFoto,
  RechazoDeTiktok,
  type CuentaDeTiktok,
} from "@/lib/tiktok"

const BUCKET = "store-assets"

/**
 * Lo que manda la pantalla de publicar. Se valida todo de nuevo acá: las
 * reglas de TikTok —privacidad que la cuenta permite, contenido de marca que
 * no puede ser privado— se cumplen en el servidor, no solo en los botones.
 */
const publicacionSchema = z
  .object({
    productoId: z.string().min(1).max(64),
    diseno: z.enum(["foto", "color", "oferta"]),
    formato: z.enum(["historia", "cuadrado"]),
    titulo: z.string().trim().max(90),
    descripcion: z.string().trim().max(2200),
    privacidad: z.enum(PRIVACIDADES),
    permitirComentarios: z.boolean(),
    musica: z.boolean(),
    comercial: z.boolean(),
    marcaPropia: z.boolean(),
    contenidoPagado: z.boolean(),
  })
  .refine((p) => !p.comercial || p.marcaPropia || p.contenidoPagado, {
    message:
      "Indica si lo que publicas te promociona a ti, a un tercero o a los dos.",
  })
  .refine((p) => !(p.contenidoPagado && p.privacidad === "SELF_ONLY"), {
    message: "El contenido de marca no puede ser privado.",
  })

export type Publicacion = z.infer<typeof publicacionSchema>

export type ResultadoDePublicar =
  | { ok: true; publicacion: string; archivo: string }
  | { ok: false; error: string; reconectar?: boolean }

/**
 * Publica la foto de un producto en la cuenta de TikTok de la tienda.
 *
 * Arma la imagen sin enlace —TikTok no deja que una app agregue enlaces al
 * contenido—, la sube como JPEG con un nombre al azar y le pide a TikTok que
 * la baje de `/api/tiktok/foto`. Lo que vuelve es con qué seguir el estado.
 */
export async function publicarEnTiktok(
  entrada: Publicacion
): Promise<ResultadoDePublicar> {
  const [marketing, tiktok, tienda] = await Promise.all([
    exigirFuncion("marketing"),
    exigirFuncion("tiktok"),
    getMiTienda(),
  ])
  if (!marketing.ok) return { ok: false, error: marketing.error }
  if (!tiktok.ok) return { ok: false, error: tiktok.error }
  if (!tienda) return { ok: false, error: "Todavía no tienes una tienda." }

  const leida = publicacionSchema.safeParse(entrada)
  if (!leida.success) {
    return {
      ok: false,
      error: leida.error.issues[0]?.message ?? "Revisa lo que vas a publicar.",
    }
  }
  const datos = leida.data

  const acceso = await accesoVigente(tienda.id)
  if (!acceso) {
    return {
      ok: false,
      error: "Vuelve a conectar tu cuenta de TikTok.",
      reconectar: true,
    }
  }

  let cuenta: CuentaDeTiktok
  const [material, leidaLaCuenta] = await Promise.all([
    getMaterialParaPublicar(),
    cuentaDeTiktok(acceso).then(
      (valor) => ({ ok: true as const, valor }),
      (error: unknown) => ({ ok: false as const, error })
    ),
  ])
  if (leidaLaCuenta.ok) cuenta = leidaLaCuenta.valor
  else return falla(leidaLaCuenta.error)
  if (!cuenta.privacidades.includes(datos.privacidad)) {
    return {
      ok: false,
      error: mensajeDeTiktok("privacy_level_option_mismatch"),
    }
  }

  const producto = material.productos.find((p) => p.id === datos.productoId)
  if (!producto) {
    return { ok: false, error: "Ese producto ya no está en tu tienda." }
  }

  const jpeg = await imagenEnJpeg({
    material,
    producto,
    diseno: datos.diseno,
    formato: datos.formato,
    sinEnlace: true,
  })
  const admin = createAdminClient()
  if (!jpeg || !admin) {
    return {
      ok: false,
      error: "No pudimos preparar la imagen. Inténtalo de nuevo.",
    }
  }

  const archivo = `${azar()}.jpg`
  const { error: subida } = await admin.storage
    .from(BUCKET)
    .upload(`${tienda.id}/tiktok/${archivo}`, jpeg, {
      contentType: "image/jpeg",
      upsert: false,
    })
  if (subida) {
    console.error("[tiktok] no se pudo subir la imagen:", subida)
    return {
      ok: false,
      error: "No pudimos preparar la imagen. Inténtalo de nuevo.",
    }
  }

  try {
    const publicacion = await publicarFoto(acceso, {
      foto: `${getSiteUrl()}/api/tiktok/foto/${tienda.id}/${archivo}`,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      privacidad: datos.privacidad,
      sinComentarios: !datos.permitirComentarios || cuenta.comentariosApagados,
      musica: datos.musica,
      marcaPropia: datos.comercial && datos.marcaPropia,
      contenidoPagado: datos.comercial && datos.contenidoPagado,
    })
    return { ok: true, publicacion, archivo }
  } catch (error) {
    await borrarArchivo(tienda.id, archivo)
    return falla(error)
  }
}

export type ResultadoDeEstado =
  | { ok: true; estado: "procesando" | "publicada" }
  | { ok: false; error: string }

/**
 * En qué va una publicación. Cuando termina, bien o mal, la foto se borra:
 * TikTok ya la bajó o ya no la va a bajar.
 */
export async function estadoEnTiktok(
  publicacion: string,
  archivo: string
): Promise<ResultadoDeEstado> {
  const tienda = await getMiTienda()
  if (!tienda) return { ok: false, error: "Todavía no tienes una tienda." }
  const acceso = await accesoVigente(tienda.id)
  if (!acceso) return { ok: false, error: mensajeDeTiktok("auth_removed") }

  try {
    const estado = await estadoDePublicacion(acceso, publicacion.slice(0, 64))
    if (estado.tipo === "procesando") return { ok: true, estado: "procesando" }
    await borrarArchivo(tienda.id, archivo)
    return estado.tipo === "publicada"
      ? { ok: true, estado: "publicada" }
      : { ok: false, error: mensajeDeTiktok(estado.motivo) }
  } catch (error) {
    return falla(error)
  }
}

/** Desconecta TikTok: Venduo deja de tener acceso a la cuenta. */
export async function desconectarTiktok(): Promise<{ ok: boolean }> {
  const tienda = await getMiTienda()
  if (!tienda) return { ok: false }
  await desconectar(tienda.id)
  revalidatePath("/panel/marketing")
  return { ok: true }
}

async function borrarArchivo(tienda: string, archivo: string) {
  if (!/^[A-Za-z0-9_-]{20,64}\.jpg$/.test(archivo)) return
  const admin = createAdminClient()
  await admin?.storage.from(BUCKET).remove([`${tienda}/tiktok/${archivo}`])
}

function falla(error: unknown): {
  ok: false
  error: string
  reconectar?: boolean
} {
  if (error instanceof RechazoDeTiktok) {
    const reconectar = [
      "access_token_invalid",
      "scope_not_authorized",
    ].includes(error.codigo)
    return { ok: false, error: mensajeDeTiktok(error.codigo), reconectar }
  }
  console.error("[tiktok] falló el pedido:", error)
  return { ok: false, error: mensajeDeTiktok("internal") }
}
