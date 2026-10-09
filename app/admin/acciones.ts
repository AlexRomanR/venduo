"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  exigirAdminEnAccion,
  registrarCambio,
  type SesionDeAdmin,
} from "@/lib/admin"
import { CLAVES_DE_FUNCION, ESTADOS } from "@/lib/funciones"
import type { Json } from "@/types"

/**
 * Lo que puede cambiar el administrador de Venduo.
 *
 * Todas siguen el mismo molde: la puerta (`exigirAdminEnAccion`), la entrada
 * validada con zod, el estado de antes, el cambio, y la constancia en
 * `admin_audit_log`. Escriben con la clave de servicio, que salta RLS: por eso
 * ninguna se salta la puerta.
 */

export type Resultado = { ok: true } | { ok: false; error: string }

const id = z.uuid()
const estado = z.enum(ESTADOS)
const clave = z.enum(CLAVES_DE_FUNCION)

async function conAdmin(
  trabajo: (sesion: SesionDeAdmin) => Promise<Resultado>
): Promise<Resultado> {
  const puerta = await exigirAdminEnAccion()
  if (!puerta.ok) return puerta
  try {
    return await trabajo(puerta.sesion)
  } catch (error) {
    console.error("[admin] la acción falló:", error)
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." }
  }
}

function fallo(error: { message: string } | null): Resultado | null {
  if (!error) return null
  console.error("[admin]", error.message)
  return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." }
}

/* -------------------------------------------------------------------------
 * Funciones
 * ---------------------------------------------------------------------- */

export async function cambiarEstadoGeneral(
  entrada: unknown
): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = z.object({ clave, estado }).parse(entrada)
    const { data: antes } = await sesion.db
      .from("feature_states")
      .select("state")
      .eq("feature", datos.clave)
      .maybeSingle()

    const { error } = await sesion.db.from("feature_states").upsert({
      feature: datos.clave,
      state: datos.estado,
      updated_at: new Date().toISOString(),
      updated_by: sesion.usuario.id,
    })
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "funcion_general",
      tipo: "funcion",
      id: datos.clave,
      antes: antes?.state ?? null,
      despues: datos.estado,
    })
    revalidatePath("/admin", "layout")
    return { ok: true }
  })
}

/** El estado de una función en una tienda. `null` vuelve al general. */
export async function cambiarEstadoDeTienda(
  entrada: unknown
): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = z
      .object({ tienda: id, clave, estado: estado.nullable() })
      .parse(entrada)
    const { data: antes } = await sesion.db
      .from("store_feature_states")
      .select("state")
      .eq("store_id", datos.tienda)
      .eq("feature", datos.clave)
      .maybeSingle()

    const { error } =
      datos.estado === null
        ? await sesion.db
            .from("store_feature_states")
            .delete()
            .eq("store_id", datos.tienda)
            .eq("feature", datos.clave)
        : await sesion.db.from("store_feature_states").upsert({
            store_id: datos.tienda,
            feature: datos.clave,
            state: datos.estado,
            updated_at: new Date().toISOString(),
            updated_by: sesion.usuario.id,
          })
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "funcion_de_tienda",
      tipo: "tienda",
      id: datos.tienda,
      antes: { [datos.clave]: antes?.state ?? "general" },
      despues: { [datos.clave]: datos.estado ?? "general" },
    })
    revalidatePath(`/admin/tiendas/${datos.tienda}`)
    revalidatePath("/admin/funciones")
    return { ok: true }
  })
}

/* -------------------------------------------------------------------------
 * Ajustes de la plataforma
 * ---------------------------------------------------------------------- */

const ajusteSchema = z.discriminatedUnion("clave", [
  z.object({
    clave: z.literal("registro"),
    valor: z.enum(["abierto", "cerrado", "invitacion"]),
  }),
  z.object({ clave: z.literal("ia_apagada"), valor: z.boolean() }),
  z.object({
    clave: z.literal("ia_tope_diario"),
    valor: z.number().int().min(1).max(1000).nullable(),
  }),
])

export async function cambiarAjuste(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = ajusteSchema.parse(entrada)
    const { data: antes } = await sesion.db
      .from("platform_settings")
      .select("value")
      .eq("key", datos.clave)
      .maybeSingle()

    const { error } = await sesion.db.from("platform_settings").upsert({
      key: datos.clave,
      value: datos.valor as Json,
      updated_at: new Date().toISOString(),
      updated_by: sesion.usuario.id,
    })
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "ajuste",
      tipo: "plataforma",
      id: datos.clave,
      antes: antes?.value ?? null,
      despues: datos.valor as Json,
    })
    revalidatePath("/admin", "layout")
    return { ok: true }
  })
}

/* -------------------------------------------------------------------------
 * Plantillas
 * ---------------------------------------------------------------------- */

export async function cambiarPlantillaDeTienda(
  entrada: unknown
): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = z
      .object({
        clave: z.string().min(1).max(40),
        visible: z.boolean().optional(),
        nueva: z.boolean().optional(),
        recomendada: z.boolean().optional(),
      })
      .parse(entrada)
    const { data: antes } = await sesion.db
      .from("templates")
      .select("is_active, is_new, is_recommended")
      .eq("key", datos.clave)
      .maybeSingle()
    if (!antes) return { ok: false, error: "No encontramos esa plantilla." }

    const cambios = {
      ...(datos.visible === undefined ? {} : { is_active: datos.visible }),
      ...(datos.nueva === undefined ? {} : { is_new: datos.nueva }),
      ...(datos.recomendada === undefined
        ? {}
        : { is_recommended: datos.recomendada }),
    }
    const { error } = await sesion.db
      .from("templates")
      .update(cambios)
      .eq("key", datos.clave)
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "plantilla_de_tienda",
      tipo: "plantilla",
      id: datos.clave,
      antes,
      despues: { ...antes, ...cambios },
    })
    revalidatePath("/admin/plantillas")
    revalidatePath("/crear")
    return { ok: true }
  })
}

/** El orden de las plantillas: la lista de claves, de la primera a la última. */
export async function ordenarPlantillas(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = z
      .object({
        tipo: z.enum(["tienda", "catalogo"]),
        claves: z.array(z.string().min(1).max(40)).min(1).max(40),
      })
      .parse(entrada)

    const resultados = await Promise.all(
      datos.claves.map((claveDePlantilla, indice) =>
        datos.tipo === "tienda"
          ? sesion.db
              .from("templates")
              .update({ position: (indice + 1) * 10 })
              .eq("key", claveDePlantilla)
          : sesion.db.from("catalog_template_settings").upsert({
              key: claveDePlantilla,
              position: (indice + 1) * 10,
              updated_at: new Date().toISOString(),
            })
      )
    )
    const malo = fallo(resultados.find((r) => r.error)?.error ?? null)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "orden_de_plantillas",
      tipo: datos.tipo === "tienda" ? "plantilla" : "plantilla_de_catalogo",
      despues: datos.claves,
    })
    revalidatePath("/admin/plantillas")
    return { ok: true }
  })
}

export async function cambiarPlantillaDeCatalogo(
  entrada: unknown
): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = z
      .object({ clave: z.string().min(1).max(40), visible: z.boolean() })
      .parse(entrada)
    const { data: antes } = await sesion.db
      .from("catalog_template_settings")
      .select("is_active")
      .eq("key", datos.clave)
      .maybeSingle()

    const { error } = await sesion.db.from("catalog_template_settings").upsert({
      key: datos.clave,
      is_active: datos.visible,
      updated_at: new Date().toISOString(),
    })
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "plantilla_de_catalogo",
      tipo: "plantilla_de_catalogo",
      id: datos.clave,
      antes: antes?.is_active ?? true,
      despues: datos.visible,
    })
    revalidatePath("/admin/plantillas")
    return { ok: true }
  })
}

/* -------------------------------------------------------------------------
 * Tiendas
 * ---------------------------------------------------------------------- */

const motivo = z.string().trim().min(3, "Escribe el motivo.").max(300)

export async function pausarTienda(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const parseado = z.object({ tienda: id, motivo }).safeParse(entrada)
    if (!parseado.success) {
      return {
        ok: false,
        error: parseado.error.issues[0]?.message ?? "Revisa los datos.",
      }
    }
    const datos = parseado.data
    const { error } = await sesion.db
      .from("stores")
      .update({
        suspended_at: new Date().toISOString(),
        suspension_reason: datos.motivo,
      })
      .eq("id", datos.tienda)
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "pausar_tienda",
      tipo: "tienda",
      id: datos.tienda,
      despues: { pausada: true },
      nota: datos.motivo,
    })
    revalidatePath(`/admin/tiendas/${datos.tienda}`)
    revalidatePath("/admin/tiendas")
    return { ok: true }
  })
}

export async function reanudarTienda(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = z.object({ tienda: id }).parse(entrada)
    const { data: antes } = await sesion.db
      .from("stores")
      .select("suspension_reason")
      .eq("id", datos.tienda)
      .maybeSingle()
    const { error } = await sesion.db
      .from("stores")
      .update({ suspended_at: null, suspension_reason: null })
      .eq("id", datos.tienda)
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "reanudar_tienda",
      tipo: "tienda",
      id: datos.tienda,
      antes: { pausada: true, motivo: antes?.suspension_reason ?? null },
      despues: { pausada: false },
    })
    revalidatePath(`/admin/tiendas/${datos.tienda}`)
    revalidatePath("/admin/tiendas")
    return { ok: true }
  })
}

const accionDeSuscripcion = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("extender"),
    tienda: id,
    dias: z.number().int().min(1).max(365),
  }),
  z.object({ accion: z.literal("bloquear"), tienda: id }),
  z.object({ accion: z.literal("desbloquear"), tienda: id }),
])

/** El estado de la suscripción. Se modela el estado, nunca un cobro. */
export async function cambiarSuscripcion(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = accionDeSuscripcion.parse(entrada)
    const { data: antes } = await sesion.db
      .from("subscriptions")
      .select("id, status, trial_ends_at, blocked_at, purge_at")
      .eq("store_id", datos.tienda)
      .maybeSingle()
    if (!antes) return { ok: false, error: "La tienda no tiene suscripción." }

    const ahora = new Date()
    let cambios: {
      status?: "prueba" | "activa" | "bloqueada"
      trial_ends_at?: string
      blocked_at?: string | null
      purge_at?: string | null
    }
    if (datos.accion === "extender") {
      const base = new Date(
        Math.max(ahora.getTime(), new Date(antes.trial_ends_at ?? 0).getTime())
      )
      base.setUTCDate(base.getUTCDate() + datos.dias)
      cambios = {
        trial_ends_at: base.toISOString(),
        ...(antes.status === "bloqueada"
          ? { status: "prueba", blocked_at: null, purge_at: null }
          : {}),
      }
    } else if (datos.accion === "bloquear") {
      const purga = new Date(ahora)
      purga.setUTCDate(purga.getUTCDate() + 90)
      cambios = {
        status: "bloqueada",
        blocked_at: ahora.toISOString(),
        purge_at: purga.toISOString(),
      }
    } else {
      cambios = { status: "activa", blocked_at: null, purge_at: null }
    }

    const { error } = await sesion.db
      .from("subscriptions")
      .update({ ...cambios, updated_at: ahora.toISOString() })
      .eq("id", antes.id)
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: `suscripcion_${datos.accion}`,
      tipo: "tienda",
      id: datos.tienda,
      antes,
      despues: { ...antes, ...cambios },
    })
    revalidatePath(`/admin/tiendas/${datos.tienda}`)
    revalidatePath("/admin/tiendas")
    return { ok: true }
  })
}

export async function moderarProducto(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const parseado = z
      .object({ producto: id, tienda: id, motivo: motivo.nullable() })
      .safeParse(entrada)
    if (!parseado.success) {
      return {
        ok: false,
        error: parseado.error.issues[0]?.message ?? "Revisa los datos.",
      }
    }
    const datos = parseado.data
    const ocultar = datos.motivo !== null
    const { error } = await sesion.db
      .from("products")
      .update({
        moderated_at: ocultar ? new Date().toISOString() : null,
        moderation_reason: datos.motivo,
      })
      .eq("id", datos.producto)
      .eq("store_id", datos.tienda)
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: ocultar ? "ocultar_producto" : "mostrar_producto",
      tipo: "producto",
      id: datos.producto,
      despues: { oculto: ocultar },
      nota: datos.motivo,
    })
    revalidatePath(`/admin/tiendas/${datos.tienda}`)
    return { ok: true }
  })
}

export async function agregarNota(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const parseado = z
      .object({
        tienda: id,
        texto: z.string().trim().min(1, "Escribe la nota.").max(2000),
      })
      .safeParse(entrada)
    if (!parseado.success) {
      return {
        ok: false,
        error: parseado.error.issues[0]?.message ?? "Revisa los datos.",
      }
    }
    const { error } = await sesion.db.from("store_notes").insert({
      store_id: parseado.data.tienda,
      admin_id: sesion.usuario.id,
      body: parseado.data.texto,
    })
    const malo = fallo(error)
    if (malo) return malo
    revalidatePath(`/admin/tiendas/${parseado.data.tienda}`)
    return { ok: true }
  })
}

export async function borrarNota(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = z.object({ nota: id, tienda: id }).parse(entrada)
    const { error } = await sesion.db
      .from("store_notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", datos.nota)
    const malo = fallo(error)
    if (malo) return malo
    revalidatePath(`/admin/tiendas/${datos.tienda}`)
    return { ok: true }
  })
}

/* -------------------------------------------------------------------------
 * Invitaciones
 * ---------------------------------------------------------------------- */

/** Un código que se dicta por teléfono: sin letras que se confundan. */
function codigoNuevo(): string {
  const letras = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const crudo = Array.from(bytes, (b) => letras[b % letras.length]).join("")
  return `${crudo.slice(0, 4)}-${crudo.slice(4)}`
}

export async function crearInvitacion(
  entrada: unknown
): Promise<Resultado & { codigo?: string }> {
  let codigo: string | undefined
  const resultado = await conAdmin(async (sesion) => {
    const datos = z
      .object({
        nota: z.string().trim().max(120).default(""),
        dias: z.number().int().min(1).max(365).nullable(),
      })
      .parse(entrada)
    const vence =
      datos.dias === null
        ? null
        : new Date(Date.now() + datos.dias * 86_400_000).toISOString()
    codigo = codigoNuevo()
    const { error } = await sesion.db.from("invitations").insert({
      code: codigo,
      note: datos.nota || null,
      created_by: sesion.usuario.id,
      expires_at: vence,
    })
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "crear_invitacion",
      tipo: "invitacion",
      id: codigo,
      despues: { nota: datos.nota || null, vence },
    })
    revalidatePath("/admin/registro")
    return { ok: true }
  })
  return resultado.ok ? { ...resultado, codigo } : resultado
}

export async function borrarInvitacion(entrada: unknown): Promise<Resultado> {
  return conAdmin(async (sesion) => {
    const datos = z.object({ codigo: z.string().min(4).max(20) }).parse(entrada)
    const { error } = await sesion.db
      .from("invitations")
      .delete()
      .eq("code", datos.codigo)
      .is("used_at", null)
    const malo = fallo(error)
    if (malo) return malo

    await registrarCambio(sesion, {
      accion: "borrar_invitacion",
      tipo: "invitacion",
      id: datos.codigo,
    })
    revalidatePath("/admin/registro")
    return { ok: true }
  })
}
