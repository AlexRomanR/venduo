import { z } from "zod"

import { publicarDiseno } from "@/app/editor/acciones"
import { miniaturaDePlantilla } from "@/lib/api/miniaturas"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { getAparienciaDeMiTienda } from "@/lib/data/apariencia"
import { leerDisenoParaEditar } from "@/lib/data/editor"
import {
  COMBINACIONES,
  esLaCombinacion,
  esLaPaleta,
  PALETAS,
  sinCambios,
} from "@/lib/editor/sugerencias"
import { combinarApariencia } from "@/lib/plantillas/apariencia"
import type { Borrador } from "@/lib/plantillas/borrador"
import { SECCIONES, type Campo } from "@/lib/plantillas/secciones"

export const dynamic = "force-dynamic"

/** La clave con la que la app pide volver a lo que trae la plantilla. */
const DE_LA_PLANTILLA = "plantilla"

/** Los campos que la app deja editar: los de texto. El resto, en el editor. */
function camposDeTexto(campos: Campo[]) {
  return campos.filter(
    (campo) => campo.tipo === "texto" || campo.tipo === "parrafo"
  )
}

/**
 * La apariencia de la tienda, en la versión liviana que edita la app: el logo,
 * los colores y la letra entre los sugeridos, y las secciones de la portada
 * —cuáles se ven, en qué orden y con qué textos—.
 *
 * Es lo publicado, leído como lo lee el editor. Lo demás —colores a medida,
 * fotos de las secciones, la ficha, el carrito— sigue en el editor completo.
 */
export async function GET() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const [diseno, apariencia] = await Promise.all([
    leerDisenoParaEditar(),
    getAparienciaDeMiTienda(),
  ])
  if (!diseno || !apariencia) {
    return fallo("Todavía no tienes una tienda.", 404)
  }

  const { base, publicado, tienda } = diseno
  const actual = combinarApariencia(base, publicado.personalizacion)
  const coloresDeBase = sinCambios(publicado.personalizacion, "colores")
  const letraDeBase = sinCambios(publicado.personalizacion, "tipografia")

  const tres = (colores: typeof actual.colores) => ({
    papel: colores.papel,
    tinta: colores.tinta,
    senal: colores.senal,
  })

  return respuesta({
    plantilla: {
      clave: tienda.plantilla,
      nombre: tienda.nombrePlantilla,
      miniatura: miniaturaDePlantilla(tienda.plantilla),
    },
    otrasPlantillas: apariencia.disponibles.map((plantilla) => ({
      clave: plantilla.clave,
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      nueva: plantilla.nueva,
      recomendada: plantilla.recomendada,
      miniatura: miniaturaDePlantilla(plantilla.clave),
    })),
    logoUrl: publicado.logoUrl,
    // Dónde sube la app un logo nuevo, dentro del bucket `store-assets`.
    carpetaDelLogo: `${tienda.id}/logo`,
    colores: tres(actual.colores),
    paletas: [
      {
        clave: DE_LA_PLANTILLA,
        nombre: `Los de ${tienda.nombrePlantilla}`,
        colores: tres(base.colores),
        elegida: coloresDeBase,
      },
      ...PALETAS.map((paleta) => ({
        clave: paleta.nombre,
        nombre: paleta.nombre,
        colores: tres(paleta.colores),
        elegida: !coloresDeBase && esLaPaleta(actual.colores, paleta),
      })),
    ],
    letras: [
      {
        clave: DE_LA_PLANTILLA,
        nombre: `La de ${tienda.nombrePlantilla}`,
        detalle: "Como viene con tu plantilla",
        elegida: letraDeBase,
      },
      ...COMBINACIONES.map((combinacion) => ({
        clave: combinacion.nombre,
        nombre: combinacion.nombre,
        detalle: combinacion.ideal,
        elegida:
          !letraDeBase && esLaCombinacion(actual.tipografia, combinacion),
      })),
    ],
    secciones: publicado.secciones.map((seccion) => ({
      id: seccion.id,
      nombre: SECCIONES[seccion.tipo].nombre,
      visible: seccion.visible,
      textos: camposDeTexto(SECCIONES[seccion.tipo].campos).map((campo) => ({
        clave: campo.clave,
        etiqueta: campo.etiqueta,
        largo: campo.tipo === "parrafo",
        max: "max" in campo ? campo.max : 200,
        valor:
          typeof seccion.props[campo.clave] === "string"
            ? (seccion.props[campo.clave] as string)
            : "",
      })),
    })),
  })
}

const cambiosSchema = z.object({
  /** El nombre de una paleta sugerida, o `plantilla` para volver a la base. */
  paleta: z.string().max(40).optional(),
  /** El nombre de una combinación de letra, o `plantilla`. */
  letra: z.string().max(40).optional(),
  logoUrl: z.url().max(600).nullable().optional(),
  /** Todas las secciones, en el orden en que tienen que quedar. */
  secciones: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        visible: z.boolean(),
        textos: z.record(z.string(), z.string().max(2000)).optional(),
      })
    )
    .max(40)
    .optional(),
})

/**
 * Publica los cambios de apariencia que se hicieron en la app.
 *
 * La app manda qué cambió, no un diseño entero: acá se parte de lo publicado,
 * se le aplican esos cambios y el resultado pasa por `publicarDiseno`, la
 * misma acción del editor. Así vale todo lo que ya vale allá —el permiso, el
 * contraste, que el logo sea de la tienda, la versión que se guarda antes— y
 * la app no puede publicar algo que el editor no dejaría.
 */
export async function PUT(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const cambios = cambiosSchema.safeParse(await cuerpo(peticion))
  if (!cambios.success) return fallo("No entendimos qué quieres cambiar.")

  const diseno = await leerDisenoParaEditar()
  if (!diseno) return fallo("Todavía no tienes una tienda.", 404)

  const borrador: Borrador = structuredClone(diseno.publicado)
  const { paleta, letra, logoUrl, secciones } = cambios.data

  if (paleta === DE_LA_PLANTILLA) {
    delete borrador.personalizacion.colores
  } else if (paleta) {
    const elegida = PALETAS.find((p) => p.nombre === paleta)
    if (!elegida) return fallo("Esa paleta ya no se ofrece.", 422)
    borrador.personalizacion.colores = elegida.colores
  }

  if (letra === DE_LA_PLANTILLA) {
    delete borrador.personalizacion.tipografia
  } else if (letra) {
    const elegida = COMBINACIONES.find((c) => c.nombre === letra)
    if (!elegida) return fallo("Esa letra ya no se ofrece.", 422)
    borrador.personalizacion.tipografia = elegida.tipografia
  }

  if (logoUrl !== undefined) borrador.logoUrl = logoUrl

  if (secciones) {
    const porId = new Map(borrador.secciones.map((s) => [s.id, s]))
    const ordenadas: Borrador["secciones"] = []

    for (const cambio of secciones) {
      const seccion = porId.get(cambio.id)
      if (!seccion) continue
      porId.delete(cambio.id)

      // Solo se aceptan los textos que esa sección tiene de verdad: cualquier
      // otra clave que llegue se ignora.
      const props = { ...seccion.props }
      for (const campo of camposDeTexto(SECCIONES[seccion.tipo].campos)) {
        const valor = cambio.textos?.[campo.clave]
        if (typeof valor === "string") props[campo.clave] = valor.trim()
      }

      ordenadas.push({ ...seccion, visible: cambio.visible, props })
    }

    // Una sección que la app no mandó no se pierde: queda al final, como estaba.
    borrador.secciones = [...ordenadas, ...porId.values()]
  }

  const resultado = await publicarDiseno(borrador)
  if (!resultado.ok) {
    const detalle = resultado.problemas?.slice(0, 2).join(" ")
    return fallo(
      detalle ? `${resultado.error} ${detalle}` : resultado.error,
      422
    )
  }

  return respuesta({ ok: true })
}
