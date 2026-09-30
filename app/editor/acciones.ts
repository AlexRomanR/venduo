"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { proponerEdicion, type TiendaParaLaIa } from "@/lib/ai/tasks"
import type { PropuestaDeDiseno } from "@/lib/ai/schemas"
import { leerDisenoParaEditar, type DisenoParaEditar } from "@/lib/data/editor"
import { borradorSchema } from "@/lib/editor/protocolo"
import { combinarApariencia } from "@/lib/plantillas/apariencia"
import {
  aplicarOperaciones,
  contextoDeDiseno,
  problemasParaPublicar,
  type Borrador,
  type Operacion,
} from "@/lib/plantillas/borrador"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types"

export type ResultadoDePublicar =
  | { ok: true; publicado: Borrador }
  | { ok: false; error: string; problemas?: string[] }

/**
 * Publicar lo que se armó en el editor.
 *
 * El borrador llega del navegador y no se le cree nada: las reglas se vuelven
 * a armar con lo que se lee de la base —las fotos y categorías de esta tienda,
 * la base de su plantilla— y el borrador se valida entero, contraste incluido.
 * Después `publicar_diseno` guarda una versión y escribe todo en una sola
 * transacción.
 *
 * Devuelve lo publicado releído de la base, con los ids que les tocaron a las
 * secciones nuevas: es el punto de partida del editor de ahí en adelante.
 */
export async function publicarDiseno(
  entrada: unknown
): Promise<ResultadoDePublicar> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: "Estás en modo demo: los cambios no se publican.",
    }
  }

  const diseno = await leerDisenoParaEditar()
  if (!diseno) {
    return { ok: false, error: "No encontramos tu tienda. Vuelve a ingresar." }
  }

  const contexto = contextoDeDiseno(diseno.base, diseno.datos)
  const { borrador, problemas } = problemasParaPublicar(entrada, contexto)

  if (!borrador) {
    return {
      ok: false,
      error: "Hay que arreglar algunas cosas antes de publicar.",
      problemas,
    }
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
    return {
      ok: false,
      error: error.message.includes("una vez")
        ? "Hay una sección repetida que solo puede ir una vez."
        : error.message.includes("logo")
          ? "Ese logo no es de tu tienda. Vuelve a subirlo."
          : "No pudimos publicar. Inténtalo de nuevo en un momento.",
    }
  }

  // Cambia la tienda pública entera y el panel del dueño, que se viste con
  // su plantilla.
  revalidatePath("/", "layout")

  const releido = await leerDisenoParaEditar()
  return { ok: true, publicado: releido?.publicado ?? borrador }
}

/* -------------------------------------------------------------------------
 * La IA
 * ---------------------------------------------------------------------- */

export type ResultadoDePropuesta =
  | {
      ok: true
      /** El registro en `block_edit_proposals`; `null` en modo demo. */
      id: string | null
      resumen: string
      operaciones: Operacion[]
      /** Algo que la persona tiene que saber de lo que se dejó afuera. */
      aviso?: string
    }
  | { ok: false; error: string }

const pedidoSchema = z.string().trim().min(3).max(500)

/** Las imágenes que la IA puede usar: las de la tienda, con qué son. */
async function imagenesParaLaIa(
  diseno: DisenoParaEditar
): Promise<TiendaParaLaIa["imagenes"]> {
  const deProductos = diseno.productos
    .filter((producto) => producto.foto)
    .slice(0, 16)
    .map((producto) => ({
      url: producto.foto as string,
      descripcion: `Foto del producto «${producto.nombre}»`,
    }))

  const supabase = await createClient()
  if (!supabase || diseno.esDemo || !diseno.datos.prefijoDeImagenes) {
    return deProductos
  }

  const carpeta = `${diseno.tienda.id}/imagenes`
  const { data } = await supabase.storage.from("store-assets").list(carpeta, {
    limit: 8,
    sortBy: { column: "created_at", order: "desc" },
  })

  const subidas = (data ?? [])
    .filter((archivo) => archivo.id)
    .map((archivo) => ({
      url: `${diseno.datos.prefijoDeImagenes}imagenes/${archivo.name}`,
      descripcion: "Una foto que subió la tienda",
    }))

  return [...subidas, ...deProductos]
}

function errorDeLaIa(error: unknown): { ok: false; error: string } {
  // Se registra en el servidor: sin esto, un fallo del proveedor no se puede
  // distinguir de un pedido mal entendido.
  console.error("[editor] el proveedor de IA falló:", error)
  const detalle = error instanceof Error ? error.message : ""
  return {
    ok: false,
    error: /503|UNAVAILABLE|429|high demand/i.test(detalle)
      ? "La IA está saturada en este momento. Vuelve a pedirlo en unos segundos."
      : "La IA no pudo responder ahora. Inténtalo de nuevo en un momento.",
  }
}

async function registrarPropuesta(
  diseno: DisenoParaEditar,
  datos: {
    pedido: string
    borrador: Borrador
    propuesta: PropuestaDeDiseno
    estado: "propuesta" | "invalida"
    errores?: string[]
    provider: string
    model: string
  }
): Promise<string | null> {
  const supabase = await createClient()
  if (!supabase || diseno.esDemo) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: portada } = await supabase
    .from("store_pages")
    .select("id")
    .eq("store_id", diseno.tienda.id)
    .eq("is_home", true)
    .is("deleted_at", null)
    .maybeSingle()

  const [propuesta] = await Promise.all([
    portada
      ? supabase
          .from("block_edit_proposals")
          .insert({
            store_id: diseno.tienda.id,
            page_id: portada.id,
            prompt: datos.pedido,
            operations: datos.propuesta.operaciones as unknown as Json,
            snapshot_before: datos.borrador.secciones as unknown as Json,
            theme_before: datos.borrador.personalizacion as Json,
            status: datos.estado,
            validation_errors: (datos.errores ?? null) as Json,
          })
          .select("id")
          .single()
      : Promise.resolve({ data: null }),
    supabase.from("ai_generations").insert({
      user_id: user.id,
      store_id: diseno.tienda.id,
      kind: "bloques",
      provider: datos.provider,
      model: datos.model,
      prompt: datos.pedido,
      output: datos.propuesta as unknown as Json,
    }),
  ])

  return propuesta.data?.id ?? null
}

/**
 * Pedirle a la IA un cambio del diseño.
 *
 * La IA propone y el sistema valida: sus operaciones se aplican al borrador de
 * prueba —todas o ninguna, con el contraste exigido— antes de devolverlas. Si
 * no pasan, se le devuelven los motivos para un segundo intento. Si en ese
 * segundo intento lo único que falla son los colores, se ofrece el resto y se
 * dice por qué los colores quedaron como estaban.
 *
 * Nada de esto toca la tienda: el navegador muestra la propuesta y la persona
 * decide si la aplica a su borrador.
 */
export async function proponerCambios(entrada: {
  pedido: string
  borrador: unknown
}): Promise<ResultadoDePropuesta> {
  const pedido = pedidoSchema.safeParse(entrada.pedido)
  if (!pedido.success) {
    return {
      ok: false,
      error: "Cuéntale a la IA un poco más de lo que quieres cambiar.",
    }
  }

  const diseno = await leerDisenoParaEditar()
  if (!diseno) {
    return { ok: false, error: "No encontramos tu tienda. Vuelve a ingresar." }
  }

  const leido = borradorSchema.safeParse(entrada.borrador)
  if (!leido.success) {
    return {
      ok: false,
      error:
        "No pudimos leer tu borrador. Recarga el editor e inténtalo de nuevo.",
    }
  }

  const borrador: Borrador = leido.data
  const contexto = contextoDeDiseno(diseno.base, diseno.datos)
  const tiendaParaLaIa: TiendaParaLaIa = {
    tienda: {
      nombre: diseno.tienda.nombre,
      descripcion: diseno.tienda.descripcion,
      plantilla: diseno.tienda.nombrePlantilla,
      tieneWhatsapp: Boolean(diseno.tienda.whatsapp),
    },
    apariencia: combinarApariencia(diseno.base, borrador.personalizacion),
    secciones: borrador.secciones,
    categorias: diseno.datos.categorias,
    imagenes: await imagenesParaLaIa(diseno),
  }

  const probar = (operaciones: Operacion[]) =>
    aplicarOperaciones(borrador, operaciones, contexto, {
      exigirContraste: true,
    })

  let intento
  try {
    intento = await proponerEdicion({
      pedido: pedido.data,
      contexto: tiendaParaLaIa,
    })
  } catch (error) {
    return errorDeLaIa(error)
  }

  let resultado = probar(intento.propuesta.operaciones)
  let aviso: string | undefined

  if (!resultado.ok) {
    try {
      intento = await proponerEdicion({
        pedido: pedido.data,
        contexto: tiendaParaLaIa,
        errores: resultado.errores,
      })
    } catch (error) {
      return errorDeLaIa(error)
    }
    resultado = probar(intento.propuesta.operaciones)
  }

  if (!resultado.ok) {
    const sinColores = intento.propuesta.operaciones.filter(
      (operacion) =>
        !(
          (operacion.op === "apariencia" || operacion.op === "restablecer") &&
          operacion.ruta.startsWith("colores.")
        )
    )
    const segundo = sinColores.length > 0 ? probar(sinColores) : resultado

    if (segundo.ok) {
      intento = {
        ...intento,
        propuesta: { ...intento.propuesta, operaciones: sinColores },
      }
      resultado = segundo
      aviso =
        "Dejé los colores como estaban: la combinación que pensé no se iba a leer bien."
    } else {
      await registrarPropuesta(diseno, {
        pedido: pedido.data,
        borrador,
        propuesta: intento.propuesta,
        estado: "invalida",
        errores: resultado.errores,
        provider: intento.provider,
        model: intento.model,
      })
      return {
        ok: false,
        error:
          "La IA no logró armar un cambio que funcione. Prueba pedirlo de otra forma, con algo más concreto.",
      }
    }
  }

  const id = await registrarPropuesta(diseno, {
    pedido: pedido.data,
    borrador,
    propuesta: intento.propuesta,
    estado: "propuesta",
    provider: intento.provider,
    model: intento.model,
  })

  return {
    ok: true,
    id,
    resumen: intento.propuesta.resumen,
    operaciones: intento.propuesta.operaciones,
    aviso,
  }
}

/**
 * Lo que la persona decidió con una propuesta. "Aplicada" quiere decir que
 * entró a su borrador: llega a la tienda recién al publicar.
 */
export async function decidirPropuesta(entrada: {
  id: string
  aplicada: boolean
}): Promise<void> {
  const id = z.uuid().safeParse(entrada.id)
  if (!id.success) return

  const supabase = await createClient()
  if (!supabase) return

  await supabase
    .from("block_edit_proposals")
    .update({
      status: entrada.aplicada ? "aplicada" : "rechazada",
      applied_at: entrada.aplicada ? new Date().toISOString() : null,
    })
    .eq("id", id.data)
}
