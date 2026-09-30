import { z } from "zod"

import {
  aparienciaSchema,
  combinarApariencia,
  NOMBRES_DE_AJUSTE,
  NOMBRES_DE_VALOR,
  personalizacionSchema,
  problemasDeContraste,
  RUTAS_DE_AJUSTE,
  type Apariencia,
  type Personalizacion,
  type RutaDeAjuste,
} from "@/lib/plantillas/apariencia"
import { TIPOS_DE_BLOQUE, type TipoDeBloque } from "@/lib/plantillas/bloques"
import { FUENTES } from "@/lib/plantillas/fuentes"
import {
  camposVacios,
  esquemaDeSeccion,
  SECCIONES,
  type ReglasDeLaTienda,
} from "@/lib/plantillas/secciones"

/**
 * El borrador del editor: lo que la tienda va a ser cuando se publique.
 *
 * Vive en el navegador mientras se edita y llega a la base de una sola vez, por
 * `publicar_diseno`. Todo cambio —arrastrar una sección, elegir un color, lo
 * que propone la IA— es una lista de **operaciones** sobre el borrador. Hay un
 * solo camino para modificarlo, y por eso lo que la IA puede hacer es
 * exactamente lo que puede hacer una persona, validado igual.
 *
 * Sin dependencias de servidor.
 */

export interface Seccion {
  /** El id de `store_blocks`, o uno nuevo para una sección sin publicar. */
  id: string
  tipo: TipoDeBloque
  visible: boolean
  props: Record<string, unknown>
}

export interface Borrador {
  personalizacion: Personalizacion
  logoUrl: string | null
  secciones: Seccion[]
}

/** Lo que el borrador necesita saber de la tienda para validarse. */
export interface ContextoDeDiseno extends ReglasDeLaTienda {
  /** La base de la plantilla, contra la que se mide el contraste. */
  base: Apariencia
  /** El logo solo puede salir de la carpeta de la tienda en su bucket. */
  logoPermitido: (url: string) => boolean
}

export const MAXIMO_DE_SECCIONES = 30

/** Lo que el servidor sabe de la tienda y el contexto necesita. */
export interface DatosDeContexto {
  /**
   * `…/storage/v1/object/public/store-assets/{tienda}/`: de acá salen el logo
   * y las fotos que sube la persona. `null` en modo demo, donde no se sube.
   */
  prefijoDeImagenes: string | null
  /** Las fotos de sus productos, que también puede usar en una sección. */
  fotosDeProductos: string[]
  categorias: string[]
}

/**
 * Las reglas del borrador para una tienda concreta.
 *
 * Lo arman el editor y el servidor con los mismos datos, así que lo que el
 * editor deja pasar es lo que el servidor acepta al publicar. El servidor no
 * confía en el que armó el navegador: lo vuelve a armar con lo que lee de la
 * base.
 */
export function contextoDeDiseno(
  base: Apariencia,
  datos: DatosDeContexto
): ContextoDeDiseno {
  const fotos = new Set(datos.fotosDeProductos)
  const categorias = new Set(
    datos.categorias.map((nombre) => nombre.trim().toLowerCase())
  )
  // La misma forma que exige `publicar_diseno`: la carpeta de la tienda y sin
  // nada después del nombre del archivo.
  const deLaTienda = (url: string) =>
    datos.prefijoDeImagenes !== null &&
    url.length < 500 &&
    url.startsWith(datos.prefijoDeImagenes) &&
    !/[?#]|\.\./.test(url.slice(datos.prefijoDeImagenes.length))

  return {
    base,
    imagenPermitida: (url) => deLaTienda(url) || fotos.has(url),
    logoPermitido: deLaTienda,
    categoriaExiste: (nombre) => categorias.has(nombre.trim().toLowerCase()),
  }
}

/* -------------------------------------------------------------------------
 * Operaciones
 * ---------------------------------------------------------------------- */

const valorDeAjuste = z.union([z.string(), z.number(), z.boolean(), z.null()])
const propiedades = z.record(z.string(), z.unknown())

export const operacionSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("apariencia"),
    ruta: z.enum(RUTAS_DE_AJUSTE),
    valor: valorDeAjuste,
  }),
  /** Vuelve un ajuste al valor de la plantilla. */
  z.object({ op: z.literal("restablecer"), ruta: z.enum(RUTAS_DE_AJUSTE) }),
  z.object({ op: z.literal("logo"), url: z.string().nullable() }),
  z.object({
    op: z.literal("agregar"),
    tipo: z.enum(TIPOS_DE_BLOQUE),
    posicion: z.number().int().min(0),
    props: propiedades,
    /** Lo pone el editor; la IA no lo manda y se genera. */
    id: z.string().optional(),
  }),
  z.object({
    op: z.literal("editar"),
    seccion: z.string(),
    props: propiedades,
  }),
  z.object({
    op: z.literal("mover"),
    seccion: z.string(),
    posicion: z.number().int().min(0),
  }),
  z.object({
    op: z.literal("mostrar"),
    seccion: z.string(),
    visible: z.boolean(),
  }),
  z.object({ op: z.literal("quitar"), seccion: z.string() }),
])

export type Operacion = z.infer<typeof operacionSchema>

export type ResultadoDeOperaciones =
  { ok: true; borrador: Borrador } | { ok: false; errores: string[] }

/** El esquema de cada ajuste de la apariencia, por su ruta. */
function esquemaDeAjuste(ruta: RutaDeAjuste): z.ZodType {
  const [grupo, clave] = ruta.split(".") as [keyof Apariencia, string]
  const forma = aparienciaSchema.shape[grupo].shape as Record<string, z.ZodType>
  return forma[clave]
}

function nombreDeSeccion(seccion: Seccion | undefined): string {
  return seccion ? `«${SECCIONES[seccion.tipo].nombre}»` : "una sección"
}

function nuevoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `nueva-${Math.random().toString(36).slice(2)}`
}

/**
 * Aplica operaciones al borrador: todas o ninguna.
 *
 * Cada una se comprueba en su turno —la sección existe, la posición está en
 * rango, las propiedades cumplen el esquema de su tipo— y al final se valida el
 * borrador entero. Si algo falla, el borrador no cambia y se devuelven todos los
 * motivos en palabras. Nunca se aplica la mitad de una propuesta.
 *
 * `exigirContraste` es para lo que propone la IA: una paleta que no se lee se
 * rechaza. Lo que elige una persona a mano sí entra al borrador —tiene que ver
 * cómo queda—, y lo frena la publicación.
 */
export function aplicarOperaciones(
  borrador: Borrador,
  operaciones: Operacion[],
  contexto: ContextoDeDiseno,
  { exigirContraste = false }: { exigirContraste?: boolean } = {}
): ResultadoDeOperaciones {
  const errores: string[] = []
  let personalizacion: Personalizacion = structuredClone(
    borrador.personalizacion
  )
  let logoUrl = borrador.logoUrl
  const secciones: Seccion[] = structuredClone(borrador.secciones)

  const buscar = (id: string) => secciones.findIndex((s) => s.id === id)

  for (const operacion of operaciones) {
    switch (operacion.op) {
      case "apariencia": {
        const leido = esquemaDeAjuste(operacion.ruta).safeParse(operacion.valor)
        if (!leido.success) {
          errores.push(
            `${NOMBRES_DE_AJUSTE[operacion.ruta]}: ese valor no es válido.`
          )
          break
        }
        const [grupo, clave] = operacion.ruta.split(".") as [
          keyof Personalizacion,
          string,
        ]
        personalizacion = {
          ...personalizacion,
          [grupo]: { ...personalizacion[grupo], [clave]: leido.data },
        } as Personalizacion
        break
      }

      case "restablecer": {
        const [grupo, clave] = operacion.ruta.split(".") as [
          keyof Personalizacion,
          string,
        ]
        const resto = { ...personalizacion[grupo] } as Record<string, unknown>
        delete resto[clave]
        const siguiente = { ...personalizacion } as Record<string, unknown>
        // Un grupo sin nada propio no se guarda: `{}` es la plantilla tal cual.
        if (Object.keys(resto).length > 0) siguiente[grupo] = resto
        else delete siguiente[grupo]
        personalizacion = siguiente as Personalizacion
        break
      }

      case "logo": {
        if (operacion.url !== null && !contexto.logoPermitido(operacion.url)) {
          errores.push("Ese logo no es de tu tienda. Súbelo desde el editor.")
          break
        }
        logoUrl = operacion.url
        break
      }

      case "agregar": {
        const definicion = SECCIONES[operacion.tipo]
        const iguales = secciones.filter((s) => s.tipo === operacion.tipo)
        if (definicion.maximo !== null && iguales.length >= definicion.maximo) {
          errores.push(
            `Tu portada ya tiene ${definicion.maximo === 1 ? "una sección" : `${definicion.maximo} secciones`} «${definicion.nombre}».`
          )
          break
        }
        if (secciones.length >= MAXIMO_DE_SECCIONES) {
          errores.push(`Tu portada ya tiene ${MAXIMO_DE_SECCIONES} secciones.`)
          break
        }
        const props = esquemaDeSeccion(operacion.tipo, contexto).safeParse({
          ...definicion.inicial,
          ...operacion.props,
        })
        if (!props.success) {
          errores.push(...mensajes(props.error, operacion.tipo))
          break
        }
        const posicion = Math.min(operacion.posicion, secciones.length)
        secciones.splice(posicion, 0, {
          id: operacion.id ?? nuevoId(),
          tipo: operacion.tipo,
          visible: true,
          props: props.data,
        })
        break
      }

      case "editar": {
        const indice = buscar(operacion.seccion)
        if (indice < 0) {
          errores.push("Una de las secciones que se quería cambiar ya no está.")
          break
        }
        const seccion = secciones[indice]
        const props = esquemaDeSeccion(seccion.tipo, contexto).safeParse({
          ...seccion.props,
          ...operacion.props,
        })
        if (!props.success) {
          errores.push(...mensajes(props.error, seccion.tipo))
          break
        }
        secciones[indice] = { ...seccion, props: props.data }
        break
      }

      case "mover": {
        const indice = buscar(operacion.seccion)
        if (indice < 0) {
          errores.push("Una de las secciones que se quería mover ya no está.")
          break
        }
        const [seccion] = secciones.splice(indice, 1)
        secciones.splice(
          Math.min(operacion.posicion, secciones.length),
          0,
          seccion
        )
        break
      }

      case "mostrar": {
        const indice = buscar(operacion.seccion)
        if (indice < 0) {
          errores.push("Una de las secciones ya no está.")
          break
        }
        secciones[indice] = {
          ...secciones[indice],
          visible: operacion.visible,
        }
        break
      }

      case "quitar": {
        const indice = buscar(operacion.seccion)
        if (indice < 0) {
          errores.push("Una de las secciones que se quería quitar ya no está.")
          break
        }
        secciones.splice(indice, 1)
        break
      }
    }
  }

  const resultado: Borrador = { personalizacion, logoUrl, secciones }

  if (exigirContraste) {
    const colores = combinarApariencia(contexto.base, personalizacion).colores
    for (const problema of problemasDeContraste(colores)) {
      errores.push(problema.mensaje)
    }
  }

  return errores.length > 0
    ? { ok: false, errores: [...new Set(errores)] }
    : { ok: true, borrador: resultado }
}

/**
 * Los problemas de una sección, con el nombre que ve la persona.
 *
 * zod habla de `items.1.answer`; el editor dice «Respuesta» de la pregunta 2.
 * Los mensajes propios —largo máximo, imagen ajena, categoría inexistente— ya
 * vienen escritos en español desde `secciones.ts`.
 */
function mensajes(error: z.ZodError, tipo: TipoDeBloque): string[] {
  const definicion = SECCIONES[tipo]

  return error.issues.map((issue) => {
    const [clave, indice, subclave] = issue.path
    const campo = definicion.campos.find((c) => c.clave === clave)
    let etiqueta = campo?.etiqueta ?? "un campo"

    if (campo?.tipo === "lista" && typeof indice === "number") {
      const sub = campo.campos.find((c) => c.clave === subclave)
      etiqueta = sub
        ? `${sub.etiqueta} de ${campo.elemento} ${indice + 1}`
        : `${campo.elemento} ${indice + 1}`
    }

    const propio = issue.code === "custom" || issue.message.includes("«")
    return propio
      ? `${definicion.nombre}: ${issue.message}`
      : issue.code === "invalid_type"
        ? `${definicion.nombre}: falta completar «${etiqueta}».`
        : `${definicion.nombre}: «${etiqueta}» no es válido.`
  })
}

/* -------------------------------------------------------------------------
 * Validar antes de publicar
 * ---------------------------------------------------------------------- */

/**
 * Todo lo que tiene que cumplir un borrador para publicarse.
 *
 * Lo corre el servidor antes de llamar a `publicar_diseno`, y el editor para
 * saber si el botón de publicar se puede tocar. Acá el contraste sí es
 * obligatorio: lo que no se lee no llega al comprador.
 */
export function problemasParaPublicar(
  borrador: unknown,
  contexto: ContextoDeDiseno
): { borrador: Borrador | null; problemas: string[] } {
  const forma = z
    .object({
      personalizacion: personalizacionSchema,
      logoUrl: z.string().nullable(),
      secciones: z
        .array(
          z.object({
            id: z.string().min(1).max(64),
            tipo: z.enum(TIPOS_DE_BLOQUE),
            visible: z.boolean(),
            props: propiedades,
          })
        )
        .max(MAXIMO_DE_SECCIONES),
    })
    .safeParse(borrador)

  if (!forma.success) {
    return { borrador: null, problemas: ["El borrador no se pudo leer."] }
  }

  const leido = forma.data
  const problemas: string[] = []

  if (leido.logoUrl !== null && !contexto.logoPermitido(leido.logoUrl)) {
    problemas.push("Ese logo no es de tu tienda. Vuelve a subirlo.")
  }

  const secciones: Seccion[] = []
  for (const seccion of leido.secciones) {
    const props = esquemaDeSeccion(seccion.tipo, contexto).safeParse(
      seccion.props
    )
    if (!props.success) {
      problemas.push(...mensajes(props.error, seccion.tipo))
      continue
    }
    // Lo oculto no lo ve nadie: puede quedar a medio escribir.
    if (seccion.visible) {
      problemas.push(...camposVacios(seccion.tipo, props.data))
    }
    secciones.push({ ...seccion, props: props.data })
  }

  for (const definicion of Object.values(SECCIONES)) {
    const veces = leido.secciones.filter((s) => s.tipo === definicion.tipo)
    if (definicion.maximo !== null && veces.length > definicion.maximo) {
      problemas.push(`«${definicion.nombre}» puede ir una sola vez.`)
    }
  }

  const colores = combinarApariencia(
    contexto.base,
    leido.personalizacion
  ).colores
  problemas.push(...problemasDeContraste(colores).map((p) => p.mensaje))

  return {
    borrador:
      problemas.length === 0
        ? {
            personalizacion: leido.personalizacion,
            logoUrl: leido.logoUrl,
            secciones,
          }
        : null,
    problemas,
  }
}

/* -------------------------------------------------------------------------
 * Contarlo en palabras
 * ---------------------------------------------------------------------- */

function valorLegible(ruta: RutaDeAjuste, valor: unknown): string {
  if (valor === null || valor === undefined) return "el de la plantilla"
  if (typeof valor === "boolean") return valor ? "sí" : "no"
  if (ruta.startsWith("tipografia.") && typeof valor === "string") {
    return valor in FUENTES
      ? FUENTES[valor as keyof typeof FUENTES].nombre
      : (NOMBRES_DE_VALOR[valor] ?? valor)
  }
  return typeof valor === "string"
    ? (NOMBRES_DE_VALOR[valor] ?? valor)
    : String(valor)
}

/**
 * Una operación contada para quien decide si la aplica.
 *
 * Se describe contra el borrador **antes** de aplicarla, que es cuando todavía
 * se sabe cómo se llamaba la sección que se quita o dónde estaba.
 */
export function describirOperacion(
  operacion: Operacion,
  antes: Borrador
): string {
  const seccion = (id: string) => antes.secciones.find((s) => s.id === id)

  switch (operacion.op) {
    case "apariencia":
      return `${NOMBRES_DE_AJUSTE[operacion.ruta]}: ${valorLegible(operacion.ruta, operacion.valor)}`
    case "restablecer":
      return `${NOMBRES_DE_AJUSTE[operacion.ruta]}: vuelve al de la plantilla`
    case "logo":
      return operacion.url ? "Cambia el logo" : "Quita el logo"
    case "agregar":
      return `Agrega «${SECCIONES[operacion.tipo].nombre}» en el lugar ${Math.min(operacion.posicion, antes.secciones.length) + 1}`
    case "editar": {
      const objetivo = seccion(operacion.seccion)
      const campos = objetivo
        ? SECCIONES[objetivo.tipo].campos
            .filter((campo) => campo.clave in operacion.props)
            .map((campo) => campo.etiqueta.toLowerCase())
        : []
      return campos.length > 0
        ? `Cambia ${enumerar(campos)} de ${nombreDeSeccion(objetivo)}`
        : `Cambia ${nombreDeSeccion(objetivo)}`
    }
    case "mover":
      return `Mueve ${nombreDeSeccion(seccion(operacion.seccion))} al lugar ${operacion.posicion + 1}`
    case "mostrar":
      return `${operacion.visible ? "Muestra" : "Oculta"} ${nombreDeSeccion(seccion(operacion.seccion))}`
    case "quitar":
      return `Quita ${nombreDeSeccion(seccion(operacion.seccion))}`
  }
}

/** "título, bajada y foto": una lista dicha como se habla. */
function enumerar(partes: string[]): string {
  return partes.length > 1
    ? `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`
    : (partes[0] ?? "")
}

export interface Cambio {
  tipo: "apariencia" | "logo" | "seccion"
  texto: string
  /** Para dibujar la muestra de un color al lado del texto. */
  color?: string
}

/**
 * Lo que cambió entre lo publicado y el borrador, para el resumen de publicar.
 *
 * Compara estados y no operaciones: veinte ajustes al mismo color son un
 * cambio, y mover una sección y devolverla a su lugar no es ninguno.
 */
export function cambiosEntre(
  publicado: Borrador,
  borrador: Borrador,
  base: Apariencia
): Cambio[] {
  const cambios: Cambio[] = []
  const antes = combinarApariencia(base, publicado.personalizacion)
  const despues = combinarApariencia(base, borrador.personalizacion)

  for (const ruta of RUTAS_DE_AJUSTE) {
    // Sale solo del color de los botones: contarlo aparte es ruido.
    if (ruta === "colores.senalAlta") continue
    const [grupo, clave] = ruta.split(".") as [keyof Apariencia, string]
    const valorAntes = (antes[grupo] as Record<string, unknown>)[clave]
    const valorDespues = (despues[grupo] as Record<string, unknown>)[clave]
    if (valorAntes === valorDespues) continue

    cambios.push({
      tipo: "apariencia",
      texto: `${NOMBRES_DE_AJUSTE[ruta]}: ${valorLegible(ruta, valorAntes)} → ${valorLegible(ruta, valorDespues)}`,
      color: grupo === "colores" ? String(valorDespues) : undefined,
    })
  }

  if (publicado.logoUrl !== borrador.logoUrl) {
    cambios.push({
      tipo: "logo",
      texto: borrador.logoUrl
        ? publicado.logoUrl
          ? "Logo nuevo"
          : "Tu tienda ahora tiene logo"
        : "Sin logo",
    })
  }

  const idsAntes = publicado.secciones.map((s) => s.id)
  const idsDespues = borrador.secciones.map((s) => s.id)

  for (const seccion of publicado.secciones) {
    if (!idsDespues.includes(seccion.id)) {
      cambios.push({
        tipo: "seccion",
        texto: `Se quita ${nombreDeSeccion(seccion)}`,
      })
    }
  }

  for (const seccion of borrador.secciones) {
    const previa = publicado.secciones.find((s) => s.id === seccion.id)
    if (!previa) {
      cambios.push({
        tipo: "seccion",
        texto: `Nueva sección: ${nombreDeSeccion(seccion)}`,
      })
      continue
    }
    if (previa.visible !== seccion.visible) {
      cambios.push({
        tipo: "seccion",
        texto: `${seccion.visible ? "Se muestra" : "Se oculta"} ${nombreDeSeccion(seccion)}`,
      })
    }
    if (JSON.stringify(previa.props) !== JSON.stringify(seccion.props)) {
      cambios.push({
        tipo: "seccion",
        texto: `Textos o fotos de ${nombreDeSeccion(seccion)}`,
      })
    }
  }

  const ordenAntes = idsAntes.filter((id) => idsDespues.includes(id))
  const ordenDespues = idsDespues.filter((id) => idsAntes.includes(id))
  if (ordenAntes.join() !== ordenDespues.join()) {
    cambios.push({ tipo: "seccion", texto: "Nuevo orden de las secciones" })
  }

  return cambios
}
