import "server-only"

import { getAIStatus } from "@/lib/ai"
import type { SesionDeAdmin } from "@/lib/admin"
import { PLANTILLAS_DE_CATALOGO } from "@/lib/catalogos/plantillas"
import { isCanvaConfigured } from "@/lib/env"
import {
  FUNCIONES,
  esEstado,
  type ClaveFuncion,
  type EstadoDeFuncion,
} from "@/lib/funciones"
import { PLANTILLAS, esClavePlantilla } from "@/lib/plantillas"
import { visitasDeTienda } from "@/lib/data/visitas"

/**
 * Lo que leen las pantallas de `/admin`. Todo con la sesión de administrador
 * que devuelve `exigirAdmin()`: nadie llega acá sin pasar por la puerta.
 */

type Db = SesionDeAdmin["db"]

/* ---------------------------------------------------------------- resumen */

export interface ResumenDeAdmin {
  tiendas: number
  tiendas_nuevas_7d: number
  publicadas: number
  pausadas: number
  en_prueba: number
  activas: number
  bloqueadas: number
  pedidos_30d: number
  ventas_30d_cents: number
  visitas_7d: number
  visitas_30d: number
  embudo: {
    cuentas: number
    tiendas: number
    con_producto: number
    con_visita: number
    con_pedido: number
    con_venta: number
  }
  ia_24h: {
    pedidos: number
    fallas: number
    ms_promedio: number
    ms_p95: number
  }
}

export async function resumenDeAdmin(db: Db) {
  const [resumen, tiendas, ajustes] = await Promise.all([
    db.rpc("admin_resumen"),
    db.rpc("admin_tiendas"),
    ajustesDePlataforma(db),
  ])
  const ia = getAIStatus()
  return {
    resumen: (resumen.data ?? null) as ResumenDeAdmin | null,
    masVisitadas: (tiendas.data ?? [])
      .filter((t) => Number(t.visitas_30d) > 0)
      .sort((a, b) => Number(b.visitas_30d) - Number(a.visitas_30d))
      .slice(0, 5),
    salud: {
      base: !resumen.error,
      ia,
      canva: isCanvaConfigured,
      registro: ajustes.registro,
      iaApagada: ajustes.iaApagada,
    },
  }
}

/* ---------------------------------------------------------------- tiendas */

export async function tiendasDeAdmin(db: Db) {
  const { data } = await db.rpc("admin_tiendas")
  return (data ?? []).map((fila) => ({
    ...fila,
    productos: Number(fila.productos),
    pedidos_30d: Number(fila.pedidos_30d),
    ventas_30d_cents: Number(fila.ventas_30d_cents),
    visitas_7d: Number(fila.visitas_7d),
    visitas_30d: Number(fila.visitas_30d),
  }))
}

export type FilaDeTiendaAdmin = Awaited<
  ReturnType<typeof tiendasDeAdmin>
>[number]

export async function tiendaDeAdmin(db: Db, id: string) {
  const [
    tienda,
    suscripcion,
    productos,
    notas,
    generales,
    propias,
    visitas,
    dueno,
  ] = await Promise.all([
    db
      .from("stores")
      .select(
        "id, name, slug, owner_id, template_key, is_published, whatsapp, created_at, suspended_at, suspension_reason, description"
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("subscriptions")
      .select("status, trial_ends_at, blocked_at, purge_at")
      .eq("store_id", id)
      .maybeSingle(),
    db
      .from("products")
      .select(
        "id, name, image_url, price_cents, stock, is_active, moderated_at, moderation_reason"
      )
      .eq("store_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    db
      .from("store_notes")
      .select("id, body, created_at")
      .eq("store_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    db.from("feature_states").select("feature, state"),
    db.from("store_feature_states").select("feature, state").eq("store_id", id),
    visitasDeTienda(db, id, 30),
    db.rpc("admin_tiendas"),
  ])
  if (!tienda.data) return null

  const general = new Map(
    (generales.data ?? []).map((f) => [f.feature, f.state])
  )
  const propio = new Map((propias.data ?? []).map((f) => [f.feature, f.state]))
  const funciones = FUNCIONES.map((f) => {
    const g = general.get(f.clave)
    const p = propio.get(f.clave)
    return {
      ...f,
      general: (esEstado(g) ? g : "activa") as EstadoDeFuncion,
      propio: (esEstado(p) ? p : null) as EstadoDeFuncion | null,
    }
  })

  const fila = (dueno.data ?? []).find((t) => t.id === id)

  return {
    tienda: tienda.data,
    dueno: fila?.dueno ?? null,
    numeros: fila
      ? {
          pedidos_30d: Number(fila.pedidos_30d),
          ventas_30d_cents: Number(fila.ventas_30d_cents),
          ultima_actividad: fila.ultima_actividad,
        }
      : null,
    suscripcion: suscripcion.data,
    productos: productos.data ?? [],
    notas: notas.data ?? [],
    funciones,
    visitas,
  }
}

/* ---------------------------------------------------------------- plantillas */

export async function plantillasDeAdmin(db: Db) {
  const [tienda, catalogo, uso] = await Promise.all([
    db
      .from("templates")
      .select("key, name, sector, is_active, is_new, is_recommended, position")
      .order("position")
      .order("name"),
    db.from("catalog_template_settings").select("key, is_active, position"),
    db.from("stores").select("template_key").is("deleted_at", null),
  ])

  const enUso = new Map<string, number>()
  for (const fila of uso.data ?? []) {
    if (!fila.template_key) continue
    enUso.set(fila.template_key, (enUso.get(fila.template_key) ?? 0) + 1)
  }

  // Solo las que tienen kit en código: las demás se dibujan con la editorial y
  // ofrecerlas sería mostrar algo que no es lo que se elige.
  const deTienda = (tienda.data ?? [])
    .filter((p) => esClavePlantilla(p.key) && p.key !== "clasica")
    .map((p) => ({
      clave: p.key,
      nombre: p.name,
      rubro: p.sector,
      visible: p.is_active,
      nueva: p.is_new,
      recomendada: p.is_recommended,
      tiendas: enUso.get(p.key) ?? 0,
      descripcion:
        PLANTILLAS[p.key as keyof typeof PLANTILLAS]?.descripcion ?? "",
    }))

  const ajustes = new Map((catalogo.data ?? []).map((c) => [c.key, c]))
  const deCatalogo = Object.values(PLANTILLAS_DE_CATALOGO)
    .map((p, indice) => ({
      clave: p.clave,
      nombre: p.nombre,
      detalle: p.detalle,
      visible: ajustes.get(p.clave)?.is_active ?? true,
      posicion: ajustes.get(p.clave)?.position ?? (indice + 1) * 10,
    }))
    .sort((a, b) => a.posicion - b.posicion)

  return { deTienda, deCatalogo }
}

/* ---------------------------------------------------------------- funciones y ajustes */

export async function ajustesDePlataforma(db: Db) {
  const { data } = await db.from("platform_settings").select("key, value")
  const valor = (clave: string) => data?.find((a) => a.key === clave)?.value
  const registro = valor("registro")
  const tope = valor("ia_tope_diario")
  return {
    registro: (registro === "cerrado" || registro === "invitacion"
      ? registro
      : "abierto") as "abierto" | "cerrado" | "invitacion",
    iaApagada: valor("ia_apagada") === true,
    iaTopeDiario: typeof tope === "number" ? tope : null,
  }
}

export async function funcionesDeAdmin(db: Db) {
  const [generales, propias, tiendas, ajustes] = await Promise.all([
    db.from("feature_states").select("feature, state, updated_at"),
    db
      .from("store_feature_states")
      .select("store_id, feature, state, updated_at"),
    db.from("stores").select("id, name").is("deleted_at", null),
    ajustesDePlataforma(db),
  ])
  const general = new Map(
    (generales.data ?? []).map((f) => [f.feature, f.state])
  )
  const nombres = new Map((tiendas.data ?? []).map((t) => [t.id, t.name]))

  return {
    funciones: FUNCIONES.map((f) => {
      const g = general.get(f.clave)
      return { ...f, estado: (esEstado(g) ? g : "activa") as EstadoDeFuncion }
    }),
    excepciones: (propias.data ?? [])
      .filter((p) => nombres.has(p.store_id) && esEstado(p.state))
      .map((p) => ({
        tienda: p.store_id,
        nombre: nombres.get(p.store_id) ?? "",
        clave: p.feature as ClaveFuncion,
        estado: p.state as EstadoDeFuncion,
      })),
    ajustes,
  }
}

/* ---------------------------------------------------------------- uso de IA */

export async function usoDeIa(db: Db) {
  const hace30 = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const hace24 = new Date(Date.now() - 86_400_000).toISOString()
  const [pedidos, tiendas, ajustes] = await Promise.all([
    db
      .from("ai_requests")
      .select("store_id, kind, ok, ms, error, created_at")
      .gte("created_at", hace30)
      .order("created_at", { ascending: false })
      .limit(5000),
    db.from("stores").select("id, name, slug").is("deleted_at", null),
    ajustesDePlataforma(db),
  ])
  const filas = pedidos.data ?? []
  const nombres = new Map((tiendas.data ?? []).map((t) => [t.id, t]))

  const porTienda = new Map<string, { pedidos: number; fallas: number }>()
  const porTipo = new Map<
    string,
    { pedidos: number; fallas: number; ms: number[] }
  >()
  for (const fila of filas) {
    if (fila.store_id) {
      const t = porTienda.get(fila.store_id) ?? { pedidos: 0, fallas: 0 }
      t.pedidos += 1
      if (!fila.ok) t.fallas += 1
      porTienda.set(fila.store_id, t)
    }
    const k = porTipo.get(fila.kind) ?? { pedidos: 0, fallas: 0, ms: [] }
    k.pedidos += 1
    if (!fila.ok) k.fallas += 1
    if (fila.ok) k.ms.push(fila.ms)
    porTipo.set(fila.kind, k)
  }

  return {
    total30: filas.length,
    fallas24: filas.filter((f) => !f.ok && f.created_at >= hace24),
    porTipo: [...porTipo.entries()].map(([tipo, v]) => ({
      tipo,
      pedidos: v.pedidos,
      fallas: v.fallas,
      msPromedio: v.ms.length
        ? Math.round(v.ms.reduce((a, b) => a + b, 0) / v.ms.length)
        : 0,
    })),
    porTienda: [...porTienda.entries()]
      .map(([id, v]) => ({
        id,
        nombre: nombres.get(id)?.name ?? "Tienda borrada",
        ...v,
      }))
      .sort((a, b) => b.pedidos - a.pedidos)
      .slice(0, 15),
    nombres: Object.fromEntries(
      [...nombres.entries()].map(([id, t]) => [id, t.name])
    ),
    ia: getAIStatus(),
    ajustes,
  }
}

/* ---------------------------------------------------------------- registro */

export async function registroDeAdmin(db: Db) {
  const [invitaciones, ajustes] = await Promise.all([
    db
      .from("invitations")
      .select("code, note, created_at, expires_at, used_at, used_by")
      .order("created_at", { ascending: false })
      .limit(100),
    ajustesDePlataforma(db),
  ])
  return { invitaciones: invitaciones.data ?? [], ajustes }
}

/* ---------------------------------------------------------------- cambios */

export async function cambiosDeAdmin(db: Db) {
  const [cambios, tiendas] = await Promise.all([
    db
      .from("admin_audit_log")
      .select(
        "id, action, target_type, target_id, before, after, note, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("stores").select("id, name"),
  ])
  const nombres = new Map((tiendas.data ?? []).map((t) => [t.id, t.name]))
  return (cambios.data ?? []).map((c) => ({
    ...c,
    tienda:
      c.target_type === "tienda" && c.target_id
        ? (nombres.get(c.target_id) ?? null)
        : null,
  }))
}
