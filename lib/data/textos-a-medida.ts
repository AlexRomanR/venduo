import "server-only"

import { revalidatePath } from "next/cache"

import { escribirTextosATuMedida } from "@/lib/ai/tasks"
import { leerDisenoParaEditar } from "@/lib/data/editor"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { anotarUsoDeIa, permisoDeIa } from "@/lib/data/uso-ia"
import {
  contextoDeDiseno,
  problemasParaPublicar,
  type Borrador,
} from "@/lib/plantillas/borrador"
import {
  createAdminClient,
  createClient,
  getUsuario,
} from "@/lib/supabase/server"
import {
  aplicarCambios,
  armarPropuesta,
  camposParaReescribir,
  ponerTextosGuardados,
  propuestaDeTextosSchema,
  textosGuardadosSchema,
  textosParaGuardar,
  type CambioDeTexto,
  type PropuestaDeTextos,
  type TextosGuardados,
  type VistaDeTextos,
} from "@/lib/textos-a-medida"
import { actualizarVistaDespues } from "@/lib/vista"
import type { Json } from "@/types"

/**
 * Los textos a medida, del lado del servidor: pedirlos, guardarlos y aplicarlos.
 *
 * La IA corre una vez al crear la tienda, aunque la función esté apagada.
 * Después, solo donde el administrador activa "IA: textos a medida". Siempre
 * queda como propuesta: la persona la mira y decide.
 */

/** Cuánto puede tardar el modelo. La ruta tiene 60 s en total. */
const LIMITE_DE_LA_IA_MS = 40_000
/** Hasta cuándo una tienda cuenta como recién creada. */
const PLAZO_DE_LA_PRIMERA_VEZ_MS = 24 * 60 * 60 * 1000

type Cliente = NonNullable<Awaited<ReturnType<typeof createClient>>>

interface FilaDePropuesta {
  id: string
  status: string
  operations: Json
  validation_errors: Json | null
  created_at: string
}

function leerPropuesta(fila: FilaDePropuesta): PropuestaDeTextos | null {
  const leida = propuestaDeTextosSchema.safeParse(fila.operations)
  return leida.success ? leida.data : null
}

function fallo(fila: FilaDePropuesta | null): boolean {
  const errores = fila?.validation_errors as { motivo?: string } | null
  return fila?.status === "invalida" && errores?.motivo === "error"
}

async function ultimaPropuesta(
  supabase: Cliente,
  tiendaId: string
): Promise<FilaDePropuesta | null> {
  const { data } = await supabase
    .from("block_edit_proposals")
    .select("id, status, operations, validation_errors, created_at")
    .eq("store_id", tiendaId)
    .eq("origen", "textos")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

/** Desde cuándo está activa la función para esta tienda. */
async function activadaDesde(tiendaId: string): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0
  const [propia, general] = await Promise.all([
    db
      .from("store_feature_states")
      .select("updated_at")
      .eq("store_id", tiendaId)
      .eq("feature", "ia_textos")
      .maybeSingle(),
    db
      .from("feature_states")
      .select("updated_at")
      .eq("feature", "ia_textos")
      .maybeSingle(),
  ])
  const fecha = propia.data?.updated_at ?? general.data?.updated_at
  return fecha ? new Date(fecha).getTime() : 0
}

/**
 * Lo que sigue en pie de una propuesta guardada. Si la persona cambió de
 * plantilla o editó esos textos, lo que ya no corresponde se cae solo.
 */
function vigente(
  propuesta: PropuestaDeTextos,
  secciones: Borrador["secciones"],
  descripcion: string | null
): PropuestaDeTextos {
  return {
    ...propuesta,
    cambios: aplicarCambios(secciones, propuesta.cambios).aplicados,
    descripcion:
      propuesta.descripcion?.antes === descripcion
        ? propuesta.descripcion
        : null,
  }
}

/**
 * Lo que la pantalla tiene que mostrar, generándolo si corresponde.
 *
 * Quien decide si corresponde es el servidor, nunca la pantalla: la primera vez
 * vale solo para una tienda recién creada que todavía no tuvo su propuesta.
 */
export async function prepararPropuestaDeTextos({
  reintentar = false,
}: { reintentar?: boolean } = {}): Promise<VistaDeTextos> {
  const supabase = await createClient()
  const [usuario, diseno] = await Promise.all([
    getUsuario(),
    leerDisenoParaEditar(),
  ])
  if (!supabase || !usuario || !diseno || diseno.esDemo) {
    return { estado: "nada" }
  }

  const tiendaId = diseno.tienda.id
  const descripcion = diseno.tienda.descripcion?.trim() || null
  const secciones = diseno.publicado.secciones

  const [previa, funciones, { data: tienda }, { data: portada }] =
    await Promise.all([
      ultimaPropuesta(supabase, tiendaId),
      funcionesDeMiTienda(),
      supabase
        .from("stores")
        .select("created_at, template_key")
        .eq("id", tiendaId)
        .single(),
      supabase
        .from("store_pages")
        .select("id")
        .eq("store_id", tiendaId)
        .eq("is_home", true)
        .is("deleted_at", null)
        .maybeSingle(),
    ])
  if (!tienda?.template_key || !portada) return { estado: "nada" }

  const activa = funciones.ia_textos === "activa"

  if (previa?.status === "propuesta") {
    const guardada = leerPropuesta(previa)
    if (guardada && (guardada.primeraVez || activa)) {
      const propuesta = vigente(guardada, secciones, diseno.tienda.descripcion)
      if (propuesta.cambios.length > 0 || propuesta.descripcion) {
        return { estado: "lista", id: previa.id, propuesta }
      }
    }
    // Ya no hay nada que proponer: deja de contar como pendiente.
    if (!guardada || guardada.primeraVez || activa) {
      await supabase
        .from("block_edit_proposals")
        .update({
          status: "invalida",
          validation_errors: { motivo: "sin-cambios" },
        })
        .eq("id", previa.id)
    }
    return { estado: "nada" }
  }

  const fallida = fallo(previa)
  const reciente =
    Date.now() - new Date(tienda.created_at).getTime() <
    PLAZO_DE_LA_PRIMERA_VEZ_MS
  const primeraVez = reciente && (!previa || fallida)
  const porLaFuncion =
    activa &&
    (!previa ||
      fallida ||
      new Date(previa.created_at).getTime() < (await activadaDesde(tiendaId)))

  if (!primeraVez && !porLaFuncion) return { estado: "nada" }
  if (fallida && !reintentar) return { estado: "error" }
  if (!descripcion) return { estado: "sin-descripcion" }

  const permiso = await permisoDeIa("textos", { sinFuncion: primeraVez })
  if (!permiso.ok) return { estado: "nada" }

  // Solo lo que sigue como vino de la plantilla: lo escrito no se propone.
  const { data: semilla } = await supabase
    .from("template_pages")
    .select("blocks")
    .eq("template_key", tienda.template_key)
    .eq("is_home", true)
    .maybeSingle()
  const bloques = (semilla?.blocks ?? []) as Array<{
    block_type_key: string
    props: Record<string, unknown>
  }>
  const campos = camposParaReescribir(
    secciones,
    bloques.map((b) => ({ tipo: b.block_type_key, props: b.props }))
  )
  if (campos.length === 0 && !primeraVez) return { estado: "nada" }

  const guardar = async (
    status: "propuesta" | "invalida",
    operaciones: PropuestaDeTextos,
    motivo?: string
  ) => {
    const { data, error } = await supabase
      .from("block_edit_proposals")
      .insert({
        store_id: tiendaId,
        page_id: portada.id,
        prompt: descripcion,
        operations: operaciones as unknown as Json,
        snapshot_before: secciones as unknown as Json,
        status,
        origen: "textos",
        validation_errors: motivo ? { motivo } : null,
      })
      .select("id")
      .single()
    // Dos pantallas a la vez: gana la primera, y esta muestra esa.
    if (error?.code === "23505") {
      const otra = await ultimaPropuesta(supabase, tiendaId)
      return otra?.id ?? null
    }
    return data?.id ?? null
  }

  const vacia: PropuestaDeTextos = {
    cambios: [],
    descripcion: null,
    primeraVez,
  }
  const inicio = Date.now()
  try {
    const { textos, provider, model } = await escribirTextosATuMedida({
      tienda: diseno.tienda.nombre,
      plantilla: diseno.tienda.nombrePlantilla,
      descripcion,
      campos,
      limiteMs: LIMITE_DE_LA_IA_MS,
    })
    await anotarUsoDeIa("textos", inicio)

    const propuesta = armarPropuesta(
      campos,
      textos,
      primeraVez ? diseno.tienda.descripcion : null,
      primeraVez
    )
    await supabase.from("ai_generations").insert({
      user_id: usuario.id,
      store_id: tiendaId,
      kind: "bloques",
      provider,
      model,
      prompt: descripcion,
      output: textos as unknown as Json,
    })

    if (propuesta.cambios.length === 0 && !propuesta.descripcion) {
      await guardar("invalida", vacia, "sin-cambios")
      return { estado: "nada" }
    }
    const id = await guardar("propuesta", propuesta)
    return id ? { estado: "lista", id, propuesta } : { estado: "error" }
  } catch (error) {
    console.error("[textos] la IA no respondió:", error)
    await anotarUsoDeIa("textos", inicio, error)
    await guardar("invalida", vacia, "error")
    return { estado: "error" }
  }
}

async function propuestaPendiente(supabase: Cliente, id: string) {
  const { data } = await supabase
    .from("block_edit_proposals")
    .select("id, status, operations, validation_errors, created_at, store_id")
    .eq("id", id)
    .eq("origen", "textos")
    .eq("status", "propuesta")
    .maybeSingle()
  if (!data) return null
  const propuesta = leerPropuesta(data)
  return propuesta ? { fila: data, propuesta } : null
}

/** Suma lo aceptado a lo que ya tenía, para usarlo si cambia de plantilla. */
async function guardarTextosAceptados(
  supabase: Cliente,
  tiendaId: string,
  cambios: CambioDeTexto[]
) {
  if (cambios.length === 0) return
  const { data } = await supabase
    .from("stores")
    .select("textos_a_medida")
    .eq("id", tiendaId)
    .single()
  const previos = textosGuardadosSchema.safeParse(data?.textos_a_medida)
  const nuevos = textosParaGuardar(cambios)
  const juntos: TextosGuardados = previos.success ? { ...previos.data } : {}
  for (const [tipo, campos] of Object.entries(nuevos)) {
    juntos[tipo] = { ...juntos[tipo], ...campos }
  }
  await supabase
    .from("stores")
    .update({ textos_a_medida: juntos })
    .eq("id", tiendaId)
}

async function cerrarPropuesta(
  supabase: Cliente,
  id: string,
  status: "aplicada" | "rechazada"
) {
  await supabase
    .from("block_edit_proposals")
    .update({
      status,
      applied_at: status === "aplicada" ? new Date().toISOString() : null,
    })
    .eq("id", id)
}

async function ponerDescripcion(
  supabase: Cliente,
  tiendaId: string,
  texto: string
) {
  const { error } = await supabase
    .from("stores")
    .update({ description: texto })
    .eq("id", tiendaId)
  return !error
}

export type ResultadoDeTextos = { ok: true } | { ok: false; error: string }

const NO_ESTA = "Esta propuesta ya no está disponible."

/**
 * "Usar estos textos" al crear la tienda: todavía no hay borrador, así que se
 * publican. `publicar_diseno` guarda antes una versión del historial.
 */
export async function publicarPropuestaDeTextos(
  id: string
): Promise<ResultadoDeTextos> {
  const supabase = await createClient()
  const diseno = await leerDisenoParaEditar()
  if (!supabase || !diseno) return { ok: false, error: NO_ESTA }

  const pendiente = await propuestaPendiente(supabase, id)
  if (!pendiente) return { ok: false, error: NO_ESTA }
  const { propuesta } = pendiente

  const { secciones, aplicados } = aplicarCambios(
    diseno.publicado.secciones,
    propuesta.cambios
  )
  if (aplicados.length > 0) {
    const { borrador } = problemasParaPublicar(
      { ...diseno.publicado, secciones },
      contextoDeDiseno(diseno.base, diseno.datos)
    )
    if (!borrador) {
      return { ok: false, error: "No pudimos usar estos textos." }
    }
    const { error } = await supabase.rpc("publicar_diseno", {
      p_theme_overrides: borrador.personalizacion as Json,
      // `null` es sin logo: la función lo acepta, los tipos generados no lo dicen.
      p_logo_url: borrador.logoUrl as string,
      p_bloques: borrador.secciones.map((seccion) => ({
        id: seccion.id,
        tipo: seccion.tipo,
        visible: seccion.visible,
        props: seccion.props,
      })) as Json,
    })
    if (error) {
      console.error("[textos] no se pudo publicar:", error.message)
      return { ok: false, error: "No pudimos usar estos textos." }
    }
  }

  if (propuesta.descripcion?.antes === diseno.tienda.descripcion) {
    await ponerDescripcion(
      supabase,
      diseno.tienda.id,
      propuesta.descripcion.despues
    )
  }
  await guardarTextosAceptados(supabase, diseno.tienda.id, aplicados)
  await cerrarPropuesta(supabase, id, "aplicada")

  revalidatePath("/", "layout")
  await actualizarVistaDespues()
  return { ok: true }
}

export async function descartarPropuestaDeTextos(
  id: string
): Promise<ResultadoDeTextos> {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: NO_ESTA }
  const pendiente = await propuestaPendiente(supabase, id)
  if (!pendiente) return { ok: false, error: NO_ESTA }
  await cerrarPropuesta(supabase, id, "rechazada")
  return { ok: true }
}

/**
 * La descripción corregida, desde el editor: no está en el borrador, así que se
 * guarda al usar la propuesta y vuelve atrás si la persona deshace.
 */
export async function cambiarDescripcionDePropuesta(
  id: string,
  valor: "antes" | "despues"
): Promise<ResultadoDeTextos> {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: NO_ESTA }
  const pendiente = await propuestaPendiente(supabase, id)
  const descripcion = pendiente?.propuesta.descripcion
  if (!pendiente || !descripcion) return { ok: false, error: NO_ESTA }

  const listo = await ponerDescripcion(
    supabase,
    pendiente.fila.store_id,
    descripcion[valor]
  )
  // Si solo proponía la descripción, con esto ya está decidida.
  if (
    listo &&
    valor === "despues" &&
    pendiente.propuesta.cambios.length === 0
  ) {
    await cerrarPropuesta(supabase, id, "aplicada")
  }
  return listo
    ? { ok: true }
    : { ok: false, error: "No pudimos guardar tu descripción." }
}

/**
 * Después de empezar con la portada de otra plantilla: los textos que la
 * persona ya había aceptado siguen siendo suyos, y reemplazan a los neutros.
 * El cambio de plantilla ya está hecho: si esto falla, queda con los neutros.
 */
export async function ponerTextosAceptados() {
  const supabase = await createClient()
  const diseno = await leerDisenoParaEditar()
  if (!supabase || !diseno) return

  const { data } = await supabase
    .from("stores")
    .select("textos_a_medida")
    .eq("id", diseno.tienda.id)
    .single()
  const guardados = textosGuardadosSchema.safeParse(data?.textos_a_medida)
  if (!guardados.success) return

  const antes = diseno.publicado.secciones
  const despues = ponerTextosGuardados(antes, guardados.data)
  const resultados = await Promise.all(
    despues
      .filter((seccion, i) => seccion !== antes[i])
      .map((seccion) =>
        supabase
          .from("store_blocks")
          .update({ props: seccion.props as Json })
          .eq("id", seccion.id)
      )
  )
  for (const { error } of resultados) {
    if (error) console.error("[textos] no se pudo poner:", error.message)
  }
}

/**
 * Al publicar desde el editor: si lo publicado trae textos de la propuesta, la
 * propuesta queda aplicada y esos textos, guardados. Un fallo acá no puede
 * deshacer la publicación, que ya ocurrió.
 */
export async function anotarTextosPublicados(publicado: Borrador) {
  const supabase = await createClient()
  const usuario = await getUsuario()
  if (!supabase || !usuario) return
  const { data: tienda } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", usuario.id)
    .is("deleted_at", null)
    .maybeSingle()
  if (!tienda) return

  const fila = await ultimaPropuesta(supabase, tienda.id)
  if (fila?.status !== "propuesta") return
  const propuesta = leerPropuesta(fila)
  if (!propuesta) return

  const usados = propuesta.cambios.filter((cambio) =>
    publicado.secciones.some(
      (s) => s.id === cambio.id && s.props[cambio.campo] === cambio.despues
    )
  )
  if (usados.length === 0) return
  await guardarTextosAceptados(supabase, tienda.id, usados)
  await cerrarPropuesta(supabase, fila.id, "aplicada")
}
