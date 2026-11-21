import { PALETAS } from "@/lib/editor/sugerencias"
import {
  describirOperacion,
  type Borrador,
  type Operacion,
} from "@/lib/plantillas/borrador"

/**
 * Lo que cambia una propuesta de la IA, en palabras y con dónde se ve.
 *
 * Lo usan el editor de la web y la página que dibuja la vista previa de la
 * app, para que las dos digan lo mismo. Sin dependencias de React ni de
 * servidor.
 */

/** Dónde se ve un cambio en la tienda: una sección o un ajuste. */
export interface LugarDeCambio {
  seccion?: string
  ruta?: string
}

export interface CambioDeLaPropuesta {
  texto: string
  /** La muestra de un color, si es un color. */
  color?: string
  /** Dónde se ve. Colores y letras no tienen lugar: cambian toda la tienda. */
  lugar?: LugarDeCambio
}

/** Dónde se ve cada operación, en el mismo orden. */
export function lugaresDeLaPropuesta(
  operaciones: Operacion[],
  antes: Borrador,
  despues: Borrador
): Array<LugarDeCambio | undefined> {
  const nuevas = despues.secciones
    .map((seccion) => seccion.id)
    .filter((id) => !antes.secciones.some((s) => s.id === id))
  return operaciones.map((operacion) => {
    if (operacion.op === "agregar") {
      const seccion = nuevas.shift()
      return seccion ? { seccion } : undefined
    }
    if (operacion.op === "logo") return { ruta: "logo" }
    if ("seccion" in operacion) {
      return operacion.op === "quitar"
        ? undefined
        : { seccion: operacion.seccion }
    }
    if (
      "ruta" in operacion &&
      !operacion.ruta.startsWith("colores.") &&
      !operacion.ruta.startsWith("tipografia.")
    ) {
      return { ruta: operacion.ruta }
    }
    return undefined
  })
}

/**
 * Cada cambio en palabras. Si los colores son los de una paleta, se dice su
 * nombre: "Fondo: crema, Texto: casi negro" no le dice nada a nadie. El tono
 * al pasar el cursor sale solo del de los botones y no se cuenta.
 */
export function cambiosDeLaPropuesta(
  operaciones: Operacion[],
  antes: Borrador,
  despues: Borrador
): CambioDeLaPropuesta[] {
  const lugares = lugaresDeLaPropuesta(operaciones, antes, despues)
  const colores = Object.fromEntries(
    operaciones.flatMap((operacion) =>
      operacion.op === "apariencia" &&
      operacion.ruta.startsWith("colores.") &&
      typeof operacion.valor === "string"
        ? [[operacion.ruta.slice("colores.".length), operacion.valor]]
        : []
    )
  )
  const paleta = PALETAS.find(
    (candidata) =>
      colores.papel === candidata.colores.papel &&
      colores.tinta === candidata.colores.tinta &&
      colores.senal === candidata.colores.senal
  )
  const cambios: CambioDeLaPropuesta[] = operaciones.flatMap(
    (operacion, indice) =>
      "ruta" in operacion &&
      (operacion.ruta === "colores.senalAlta" ||
        (paleta && operacion.ruta.startsWith("colores.")))
        ? []
        : [
            {
              texto: describirOperacion(operacion, antes),
              color:
                operacion.op === "apariencia" &&
                operacion.ruta.startsWith("colores.") &&
                typeof operacion.valor === "string"
                  ? operacion.valor
                  : undefined,
              lugar: lugares[indice],
            },
          ]
  )
  if (paleta) {
    cambios.unshift({
      texto: `Colores: paleta ${paleta.nombre}`,
      color: paleta.colores.senal,
    })
  }
  return cambios
}
