"use server"

import { revalidatePath } from "next/cache"

import { mensajeDeErrorDeIa } from "@/lib/ai/mensajes"
import { leerPlanilla, leerProductos } from "@/lib/ai/tasks"
import type { ImagenParaIA } from "@/lib/ai/types"
import {
  esFotoDeMiTienda,
  idDeBorrador,
  leerColumnas,
  LIMITES_DE_CARGA,
  normalizar,
  type Borrador,
  type Lectura,
} from "@/lib/carga"
import { getMiTienda } from "@/lib/data/panel"
import { anotarUsoDeIa, permisoDeIa } from "@/lib/data/uso-ia"
import { env } from "@/lib/env"
import { aCentavos } from "@/lib/format"
import { fotoEnBase64 } from "@/lib/fotos"
import { createClient, getUsuario } from "@/lib/supabase/server"
import { crearProductosSchema } from "@/lib/validation/carga"
import { actualizarVistaDespues } from "@/lib/vista"

type Resultado<T> = ({ ok: true } & T) | { ok: false; error: string }

/** Las categorías que la tienda ya tiene: la IA las prefiere a inventar otras. */
async function categoriasDeMiTienda(tiendaId: string): Promise<string[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data } = await supabase
    .from("product_categories")
    .select("name")
    .eq("store_id", tiendaId)
    .is("deleted_at", null)
  return (data ?? []).map((c) => c.name)
}

/** Una foto de la tienda, achicada, para mandársela a la IA. */
async function imagenParaIa(
  url: string,
  lado: number
): Promise<ImagenParaIA | null> {
  const datos = await fotoEnBase64(url, { lado, calidad: 80 })
  const base64 = datos?.split(",")[1]
  return base64 ? { tipo: "image/jpeg", base64 } : null
}

/**
 * Borradores desde fotos de productos —una por producto— o desde las páginas
 * de una lista escrita. Las fotos ya están subidas a la carpeta de la tienda:
 * se comprueba antes de bajarlas, o se le podría pedir a la IA que baje
 * cualquier dirección o la foto de otra tienda.
 */
export async function leerFotos(entrada: {
  urls: string[]
  modo: "fotos" | "lista"
}): Promise<Resultado<{ borradores: Borrador[]; aviso: string | null }>> {
  const maximo =
    entrada.modo === "fotos"
      ? LIMITES_DE_CARGA.fotosPorPedido
      : LIMITES_DE_CARGA.paginas
  if (entrada.urls.length === 0 || entrada.urls.length > maximo) {
    return { ok: false, error: "Elige las fotos otra vez." }
  }

  const [tienda, permiso] = await Promise.all([
    getMiTienda(),
    permisoDeIa("productos"),
  ])
  if (!permiso.ok) return permiso
  if (!tienda || !env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      ok: false,
      error: "En el modo demo no se suben fotos. Prueba con una lista escrita.",
    }
  }
  const base = env.NEXT_PUBLIC_SUPABASE_URL
  if (!entrada.urls.every((url) => esFotoDeMiTienda(url, base, tienda.id))) {
    return { ok: false, error: "Una de las fotos no es de tu tienda." }
  }

  const [imagenes, categorias] = await Promise.all([
    Promise.all(
      entrada.urls.map((url) =>
        // La letra a mano necesita más resolución que un producto.
        imagenParaIa(url, entrada.modo === "fotos" ? 1024 : 1600)
      )
    ),
    categoriasDeMiTienda(tienda.id),
  ])
  if (imagenes.some((imagen) => !imagen)) {
    return {
      ok: false,
      error: "No pudimos abrir una de las fotos. Prueba con otra.",
    }
  }

  return leerConIa({
    modo: entrada.modo,
    imagenes: imagenes.filter((i): i is ImagenParaIA => i !== null),
    texto: null,
    categorias,
    urls: entrada.urls,
    tiendaId: tienda.id,
    descripcion:
      entrada.modo === "fotos"
        ? `${entrada.urls.length} fotos de productos`
        : `${entrada.urls.length} páginas de una lista escrita`,
  })
}

/** Borradores desde una lista pegada o dictada. */
export async function leerLista(
  texto: string
): Promise<Resultado<{ borradores: Borrador[]; aviso: string | null }>> {
  const lista = texto.trim()
  if (lista.length < 3) {
    return { ok: false, error: "Escribe al menos un producto." }
  }
  if (lista.length > LIMITES_DE_CARGA.caracteresDeLista) {
    return {
      ok: false,
      error: "Es una lista muy larga: pégala en partes.",
    }
  }

  const [tienda, permiso] = await Promise.all([
    getMiTienda(),
    permisoDeIa("productos"),
  ])
  if (!permiso.ok) return permiso

  return leerConIa({
    modo: "lista",
    imagenes: [],
    texto: lista,
    categorias: tienda ? await categoriasDeMiTienda(tienda.id) : [],
    urls: [],
    tiendaId: tienda?.id ?? null,
    descripcion: `Lista escrita: ${lista.slice(0, 200)}`,
  })
}

async function leerConIa(input: {
  modo: "fotos" | "lista"
  imagenes: ImagenParaIA[]
  texto: string | null
  categorias: string[]
  urls: string[]
  tiendaId: string | null
  descripcion: string
}): Promise<Resultado<{ borradores: Borrador[]; aviso: string | null }>> {
  const inicio = Date.now()
  let resultado: Awaited<ReturnType<typeof leerProductos>>
  try {
    resultado = await leerProductos(input)
    await anotarUsoDeIa("productos", inicio)
  } catch (error) {
    await anotarUsoDeIa("productos", inicio, error)
    console.error("[carga] el proveedor de IA falló:", error)
    return { ok: false, error: mensajeDeErrorDeIa(error) }
  }

  const conFoto = input.modo === "fotos"
  // La IA propone; acá se descarta lo que no cuadra: una foto que no existe,
  // o dos borradores de la misma foto.
  const usadas = new Set<number>()
  const borradores: Borrador[] = resultado.lectura.borradores
    .filter((b) => {
      if (!conFoto) return true
      if (b.foto === null || b.foto >= input.urls.length || usadas.has(b.foto))
        return false
      usadas.add(b.foto)
      return true
    })
    .map((b) => ({
      id: idDeBorrador(),
      nombre: b.nombre.trim(),
      precio: b.precio,
      stock: b.stock ?? 1,
      categoria: b.categoria?.trim() || null,
      descripcion: b.descripcion.trim(),
      codigo: null,
      costo: null,
      fotos: conFoto && b.foto !== null ? [input.urls[b.foto]] : [],
      opciones: [],
      variantes: [],
      // De una foto, el nombre y la categoría los inventó la IA: se marcan.
      // De una lista, el nombre lo escribió la persona.
      inventado: conFoto
        ? (["nombre", "categoria", "descripcion"] as const).filter((c) =>
            Boolean(b[c])
          )
        : b.categoria
          ? ["categoria"]
          : [],
      duda: b.duda,
    }))

  // Una foto sin borrador vuelve vacía, para que la persona la nombre.
  if (conFoto) {
    input.urls.forEach((url, indice) => {
      if (usadas.has(indice)) return
      borradores.push({
        id: idDeBorrador(),
        nombre: "",
        precio: null,
        stock: 1,
        categoria: null,
        descripcion: "",
        codigo: null,
        costo: null,
        fotos: [url],
        opciones: [],
        variantes: [],
        inventado: [],
        duda: "No pudimos leer esta foto.",
      })
    })
  }

  await registrarGeneracion(input.tiendaId, resultado, input.descripcion, {
    borradores: borradores.map(({ nombre, precio, categoria }) => ({
      nombre,
      precio,
      categoria,
    })),
  })

  return { ok: true, borradores, aviso: resultado.lectura.aviso }
}

/**
 * Qué es cada columna de la planilla. Con la IA apagada, sin cupo o si falla,
 * se lee por los encabezados y el contenido: la planilla se carga igual, y lo
 * dudoso se le pregunta a la persona en la pantalla.
 */
export async function leerColumnasDePlanilla(
  filas: string[][]
): Promise<Resultado<{ lectura: Lectura; conIa: boolean }>> {
  const muestra = filas
    .slice(0, 15)
    .map((fila) => fila.slice(0, 50).map((celda) => celda.slice(0, 80)))
  if (muestra.length === 0) {
    return { ok: false, error: "Esa planilla no tiene productos." }
  }
  // La lectura sin IA mira hasta 40 filas: más contenido, menos dudas.
  const sinIa = leerColumnas(filas.slice(0, 45))

  const [tienda, permiso] = await Promise.all([
    getMiTienda(),
    permisoDeIa("productos"),
  ])
  if (!permiso.ok) return { ok: true, lectura: sinIa, conIa: false }

  const inicio = Date.now()
  let resultado: Awaited<ReturnType<typeof leerPlanilla>>
  try {
    resultado = await leerPlanilla({ filas: muestra })
    await anotarUsoDeIa("productos", inicio)
  } catch (error) {
    await anotarUsoDeIa("productos", inicio, error)
    console.error("[carga] el proveedor de IA falló:", error)
    return { ok: true, lectura: sinIa, conIa: false }
  }

  // La IA propone; acá se descarta lo que no cuadra: una columna que no
  // existe, una repetida, o un campo en dos columnas —la segunda queda en
  // duda—. Una columna con datos que la IA no nombró se toma de la lectura
  // sin IA.
  const ancho = Math.max(...muestra.map((fila) => fila.length))
  const vistas = new Set<number>()
  const usados = new Set<string>()
  const columnas = resultado.lectura.columnas
    .filter(
      (c) =>
        c.columna < ancho && !vistas.has(c.columna) && vistas.add(c.columna)
    )
    .map((c) => {
      const repetido = c.campo !== null && usados.has(c.campo)
      if (c.campo) usados.add(c.campo)
      return { ...c, seguro: c.seguro && !repetido }
    })
  for (const c of sinIa.columnas) {
    if (!vistas.has(c.columna)) columnas.push({ ...c, seguro: false })
  }
  columnas.sort((a, b) => a.columna - b.columna)
  if (!columnas.some((c) => c.campo === "nombre")) {
    return { ok: true, lectura: sinIa, conIa: false }
  }

  const lectura: Lectura = {
    filaDeEncabezado:
      resultado.lectura.filaDeEncabezado !== null &&
      resultado.lectura.filaDeEncabezado < muestra.length
        ? resultado.lectura.filaDeEncabezado
        : null,
    columnas,
  }
  await registrarGeneracion(
    tienda?.id ?? null,
    resultado,
    `Planilla: ${muestra[0]?.join(" | ").slice(0, 200)}`,
    lectura
  )
  return { ok: true, lectura, conIa: true }
}

async function registrarGeneracion(
  tiendaId: string | null,
  resultado: { provider: string; model: string },
  prompt: string,
  output: object
) {
  if (!tiendaId) return
  const [user, supabase] = await Promise.all([getUsuario(), createClient()])
  if (!user || !supabase) return
  await supabase.from("ai_generations").insert({
    user_id: user.id,
    store_id: tiendaId,
    kind: "productos",
    provider: resultado.provider,
    model: resultado.model,
    prompt,
    output: JSON.parse(JSON.stringify(output)),
  })
}

/**
 * Crea los productos que la persona revisó, de una vez. Un solo insert:
 * todos o ninguno, y pocos viajes aunque sean doscientos. Las categorías que
 * faltan se crean antes, también juntas. No es IA: no pide su permiso.
 */
export async function crearProductos(entrada: {
  borradores: unknown
  visibles: boolean
}): Promise<Resultado<{ creados: number; sinTallas: number }>> {
  const validado = crearProductosSchema.safeParse(entrada)
  if (!validado.success) {
    return {
      ok: false,
      error: validado.error.issues[0]?.message ?? "Revisa los productos.",
    }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: "Estás en modo demo: los productos no se guardan.",
    }
  }
  const tienda = await getMiTienda()
  if (!tienda) return { ok: false, error: "Todavía no tienes una tienda." }

  const { borradores, visibles } = validado.data
  const base = env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  if (
    !borradores.every((b) =>
      b.fotos.every((url) => esFotoDeMiTienda(url, base, tienda.id))
    )
  ) {
    return { ok: false, error: "Una de las fotos no es de tu tienda." }
  }

  // Las categorías: las que ya existen se reconocen sin tildes ni mayúsculas.
  const { data: existentes } = await supabase
    .from("product_categories")
    .select("id, name")
    .eq("store_id", tienda.id)
    .is("deleted_at", null)
  const porNombre = new Map(
    (existentes ?? []).map((c) => [normalizar(c.name), c.id])
  )
  const nuevas = [
    ...new Map(
      borradores
        .map((b) => b.categoria)
        .filter((c): c is string => Boolean(c))
        .filter((c) => !porNombre.has(normalizar(c)))
        .map((c) => [normalizar(c), c])
    ).values(),
  ]
  if (nuevas.length) {
    const { data: creadas, error } = await supabase
      .from("product_categories")
      .insert(nuevas.map((name) => ({ store_id: tienda.id, name })))
      .select("id, name")
    if (error) {
      return { ok: false, error: "No pudimos crear las categorías nuevas." }
    }
    for (const c of creadas ?? []) porNombre.set(normalizar(c.name), c.id)
  }

  // `image_url` y `category` no se escriben: los deriva la base desde `images`
  // y `category_id`.
  const { data: productos, error } = await supabase
    .from("products")
    .insert(
      borradores.map((b) => ({
        store_id: tienda.id,
        name: b.nombre,
        description: b.descripcion || null,
        price_cents: aCentavos(b.precio),
        stock: b.stock,
        category_id: b.categoria
          ? (porNombre.get(normalizar(b.categoria)) ?? null)
          : null,
        sku: b.codigo,
        images: b.fotos,
        is_active: visibles,
      }))
    )
    .select("id")
  if (error || !productos) {
    return {
      ok: false,
      error:
        "No pudimos crear los productos. Revisa tu conexión y vuelve a intentarlo.",
    }
  }

  // Las tallas y los colores, con la misma función que el formulario: valida
  // cada combinación y deja el stock del producto en la suma de las suyas.
  // Uno que falle no deshace los demás: el producto queda, sin tallas.
  let sinTallas = 0
  for (const [indice, b] of borradores.entries()) {
    const id = productos[indice]?.id
    if (!id || !b.variantes.length) continue
    const { error: errorDeTallas } = await supabase.rpc("guardar_variantes", {
      p_producto: id,
      p_opciones: b.opciones,
      p_variantes: b.variantes.map((v) => ({
        valores: v.valores,
        stock: v.stock,
        price_cents: v.precio === null ? null : aCentavos(v.precio),
        image_url: null,
      })),
    })
    if (errorDeTallas) {
      console.error("[carga] no se guardaron las tallas:", errorDeTallas)
      sinTallas++
    }
  }

  // El costo vive aparte, solo para el dueño.
  const conCosto = borradores
    .map((b, indice) => ({ costo: b.costo, id: productos[indice]?.id }))
    .filter((c): c is { costo: number; id: string } =>
      Boolean(c.id && c.costo !== null)
    )
  if (conCosto.length) {
    await supabase.from("product_costs").upsert(
      conCosto.map((c) => ({
        product_id: c.id,
        store_id: tienda.id,
        cost_cents: aCentavos(c.costo),
      }))
    )
  }

  revalidatePath("/panel/productos")
  revalidatePath("/panel")
  await actualizarVistaDespues()
  return { ok: true, creados: productos.length, sinTallas }
}
