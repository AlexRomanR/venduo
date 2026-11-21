import { z } from "zod"

import type { TipoDeBloque } from "@/lib/plantillas/bloques"
import type { Seccion } from "@/lib/plantillas/borrador"
import { SECCIONES, type CampoDeTexto } from "@/lib/plantillas/secciones"

/**
 * Los textos a medida: la IA reescribe la portada con lo que vende la tienda.
 *
 * Esta es la parte que no depende ni de la base ni del modelo, y la usan el
 * servidor y el editor: qué campos se pueden reescribir, cómo se arma el antes
 * y el después, y cómo se aplica sin pisar lo que la persona cambió.
 *
 * La IA propone y la persona decide: nada de esto escribe por su cuenta.
 */

/** Los campos que la IA puede tocar. Una lista cerrada: ni fotos ni ajustes. */
const CAMPOS_POR_TIPO: Partial<Record<TipoDeBloque, readonly string[]>> = {
  hero: ["title", "subtitle", "ctaLabel"],
  cta: ["title", "buttonLabel"],
}
const CAMPOS_DE_LAS_DEMAS = ["title"] as const

export const CLAVES_DE_TEXTO = [
  "title",
  "subtitle",
  "ctaLabel",
  "buttonLabel",
] as const

export const LARGO_DE_DESCRIPCION = { min: 30, max: 600 } as const

/**
 * Lo que puede medir un texto propuesto. Es menos que lo que admite el campo:
 * una persona puede escribir un título largo, pero uno propuesto tiene que
 * entrar bien en la portada de un celular.
 */
const LARGOS_PROPUESTOS: Partial<
  Record<TipoDeBloque, Partial<Record<string, number>>>
> = {
  hero: { title: 42, subtitle: 150, ctaLabel: 24 },
  cta: { title: 44, buttonLabel: 24 },
}
const LARGO_DE_TITULO_DE_SECCION = 36

/** La tienda habla en plural: "Vendo…" no puede llegar a quien compra. */
const EN_SINGULAR = /(^|[.!?]\s+)(vendo|tengo|ofrezco|traigo|hago|soy)\b/i

export interface CampoParaReescribir {
  id: string
  tipo: TipoDeBloque
  campo: string
  actual: string
  max: number
  /** Cómo se nombra en la pantalla: "Portada · Título". */
  rotulo: string
}

const cambioSchema = z.object({
  id: z.string().min(1),
  tipo: z.string().min(1),
  campo: z.enum(CLAVES_DE_TEXTO),
  rotulo: z.string(),
  antes: z.string(),
  despues: z.string().min(1),
})

/** Lo que se guarda en `block_edit_proposals.operations`. */
export const propuestaDeTextosSchema = z.object({
  cambios: z.array(cambioSchema),
  descripcion: z
    .object({ antes: z.string(), despues: z.string().min(1) })
    .nullable(),
  /**
   * La que se escribió al crear la tienda: espera aunque la función esté
   * apagada. Las demás se dejan de mostrar si el administrador la apaga.
   */
  primeraVez: z.boolean().default(false),
})

export type CambioDeTexto = z.infer<typeof cambioSchema>
export type PropuestaDeTextos = z.infer<typeof propuestaDeTextosSchema>

/** Lo que recibe la pantalla al pedir los textos a medida. */
export type VistaDeTextos =
  | { estado: "nada" }
  | { estado: "sin-descripcion" }
  | { estado: "error" }
  | { estado: "lista"; id: string; propuesta: PropuestaDeTextos }

/** Lo aceptado, por tipo de sección y campo: `stores.textos_a_medida`. */
export const textosGuardadosSchema = z.record(
  z.string(),
  z.record(z.string(), z.string())
)
export type TextosGuardados = z.infer<typeof textosGuardadosSchema>

/** Lo que devuelve el modelo, ya validado contra su esquema. */
export interface SalidaDeTextos {
  descripcion: string
  textos: Array<{ id: string; campo: string; texto: string }>
}

function campoDeTexto(tipo: TipoDeBloque, clave: string): CampoDeTexto | null {
  const campo = SECCIONES[tipo].campos.find((c) => c.clave === clave)
  return campo && (campo.tipo === "texto" || campo.tipo === "parrafo")
    ? campo
    : null
}

function camposDe(tipo: TipoDeBloque): readonly string[] {
  return CAMPOS_POR_TIPO[tipo] ?? CAMPOS_DE_LAS_DEMAS
}

function limpio(texto: string): string {
  return texto.replace(/\s+/g, " ").trim()
}

function largoPropuesto(tipo: TipoDeBloque, clave: string, maximo: number) {
  const propio = LARGOS_PROPUESTOS[tipo]?.[clave] ?? LARGO_DE_TITULO_DE_SECCION
  return Math.min(propio, maximo)
}

/**
 * Lo que la IA puede reescribir de una portada.
 *
 * Con `semilla`, solo lo que sigue igual a como vino de la plantilla: lo que la
 * persona escribió no se le propone cambiar. Sin ella —la tienda recién creada—
 * entra todo, porque todavía no escribió nada.
 */
export function camposParaReescribir(
  secciones: Seccion[],
  semilla: Array<{ tipo: string; props: Record<string, unknown> }> | null
): CampoParaReescribir[] {
  return secciones.flatMap((seccion) => {
    if (!seccion.visible) return []
    return camposDe(seccion.tipo).flatMap((clave) => {
      const campo = campoDeTexto(seccion.tipo, clave)
      const actual = seccion.props[clave]
      if (!campo || typeof actual !== "string" || !actual.trim()) return []
      const sigueIgual =
        semilla === null ||
        semilla.some(
          (s) => s.tipo === seccion.tipo && s.props[clave] === actual
        )
      if (!sigueIgual) return []
      return [
        {
          id: seccion.id,
          tipo: seccion.tipo,
          campo: clave,
          actual,
          max: largoPropuesto(seccion.tipo, clave, campo.max),
          rotulo: `${SECCIONES[seccion.tipo].nombre} · ${campo.etiqueta}`,
        },
      ]
    })
  })
}

/**
 * Del resultado del modelo, solo lo que sirve: un campo de la lista, dentro de
 * su largo y distinto de lo que ya dice. Un id inventado o un campo de más se
 * descartan sin más.
 */
export function armarPropuesta(
  campos: CampoParaReescribir[],
  salida: SalidaDeTextos,
  descripcionActual: string | null,
  primeraVez = false
): PropuestaDeTextos {
  const escritos = new Map(
    salida.textos.map((t) => [`${t.id}:${t.campo}`, limpio(t.texto)])
  )
  const cambios = campos.flatMap((campo) => {
    const despues = escritos.get(`${campo.id}:${campo.campo}`)
    if (
      !despues ||
      despues === campo.actual ||
      despues.length > campo.max ||
      EN_SINGULAR.test(despues)
    ) {
      return []
    }
    return [
      {
        id: campo.id,
        tipo: campo.tipo,
        campo: campo.campo as CambioDeTexto["campo"],
        rotulo: campo.rotulo,
        antes: campo.actual,
        despues,
      },
    ]
  })

  const corregida = limpio(salida.descripcion)
  const conDescripcion =
    descripcionActual !== null &&
    corregida !== limpio(descripcionActual) &&
    !EN_SINGULAR.test(corregida) &&
    corregida.length >= LARGO_DE_DESCRIPCION.min &&
    corregida.length <= LARGO_DE_DESCRIPCION.max

  return {
    cambios,
    descripcion: conDescripcion
      ? { antes: descripcionActual, despues: corregida }
      : null,
    primeraVez,
  }
}

/**
 * Aplica los cambios a unas secciones. Cada campo cambia solo si sigue diciendo
 * lo que decía cuando se armó la propuesta: si la persona lo tocó después, se
 * respeta y se cuenta como saltado.
 */
export function aplicarCambios(
  secciones: Seccion[],
  cambios: CambioDeTexto[]
): { secciones: Seccion[]; aplicados: CambioDeTexto[]; saltados: number } {
  const aplicados: CambioDeTexto[] = []
  const nuevas = secciones.map((seccion) => {
    const propios = cambios.filter(
      (c) => c.id === seccion.id && seccion.props[c.campo] === c.antes
    )
    if (propios.length === 0) return seccion
    aplicados.push(...propios)
    return {
      ...seccion,
      props: {
        ...seccion.props,
        ...Object.fromEntries(propios.map((c) => [c.campo, c.despues])),
      },
    }
  })
  return {
    secciones: nuevas,
    aplicados,
    saltados: cambios.length - aplicados.length,
  }
}

/** Lo aceptado, para volver a usarlo si cambia de plantilla. */
export function textosParaGuardar(cambios: CambioDeTexto[]): TextosGuardados {
  const guardados: TextosGuardados = {}
  for (const cambio of cambios) {
    const delTipo = (guardados[cambio.tipo] ??= {})
    // Con dos secciones del mismo tipo vale la primera: es la que se ve antes.
    delTipo[cambio.campo] ??= cambio.despues
  }
  return guardados
}

/**
 * Pone los textos aceptados en la portada de otra plantilla: en la primera
 * sección de cada tipo, y solo en los campos de la lista y si entran.
 */
export function ponerTextosGuardados(
  secciones: Seccion[],
  guardados: TextosGuardados
): Seccion[] {
  const usados = new Set<string>()
  return secciones.map((seccion) => {
    const textos = guardados[seccion.tipo]
    if (!textos || usados.has(seccion.tipo)) return seccion
    usados.add(seccion.tipo)
    const props = { ...seccion.props }
    for (const clave of camposDe(seccion.tipo)) {
      const texto = textos[clave]
      const campo = campoDeTexto(seccion.tipo, clave)
      if (texto && campo && texto.length <= campo.max) props[clave] = texto
    }
    return { ...seccion, props }
  })
}
