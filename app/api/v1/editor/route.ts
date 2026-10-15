import { publicarDiseno } from "@/app/editor/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { miniaturaDePlantilla } from "@/lib/api/miniaturas"
import { getAparienciaDeMiTienda } from "@/lib/data/apariencia"
import { leerDisenoParaEditar } from "@/lib/data/editor"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { BUCKET } from "@/lib/editor/imagenes"
import {
  GUIA_DE_AJUSTES,
  type GuiaDeAjuste,
} from "@/lib/editor/guia-de-ajustes"
import { COMBINACIONES, PALETAS } from "@/lib/editor/sugerencias"
import {
  NOMBRES_DE_AJUSTE,
  NOMBRES_DE_VALOR,
  RUTAS_DE_AJUSTE,
  type RutaDeAjuste,
} from "@/lib/plantillas/apariencia"
import { FUENTES } from "@/lib/plantillas/fuentes"
import { SECCIONES } from "@/lib/plantillas/secciones"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Ajuste = { ruta: RutaDeAjuste; nombre: string } & Partial<GuiaDeAjuste> &
  (
    | { tipo: "color" }
    | { tipo: "fuente" }
    | { tipo: "si-no" }
    | {
        tipo: "opciones"
        opciones: { valor: string | number | null; nombre: string }[]
      }
  )

/** Los valores cerrados de cada ajuste, con su nombre para la persona. */
const OPCIONES: Partial<Record<RutaDeAjuste, (string | number | null)[]>> = {
  "tipografia.pesoTitular": [null, 400, 500, 600, 700, 800],
  "tipografia.espaciadoTitular": [null, "apretado", "normal", "abierto"],
  "forma.radio": ["recto", "suave", "redondo"],
  "disposicion.tarjeta": ["cuadrada", "retrato"],
  "disposicion.columnas": [2, 3, 4],
  "ficha.diseno": ["dividida", "vitrina"],
  "carrito.diseno": ["columnas", "boleta", "pasos"],
}

const PESOS: Record<number, string> = {
  400: "Fino",
  500: "Medio",
  600: "Semi",
  700: "Grueso",
  800: "Extra",
}

function nombreDeValor(valor: string | number | null): string {
  if (valor === null) return "De tu plantilla"
  if (typeof valor === "number") return PESOS[valor] ?? `${valor} columnas`
  return NOMBRES_DE_VALOR[valor] ?? valor
}

/** Cada ajuste de la apariencia, con qué control se cambia. */
function ajustes(): Ajuste[] {
  return RUTAS_DE_AJUSTE.filter((ruta) => ruta !== "colores.senalAlta").map(
    (ruta): Ajuste => {
      // Qué cambia y en qué pantalla se nota: la app lo muestra junto a cada
      // opción y pasa su vista previa a esa pantalla.
      const base = {
        ruta,
        nombre: NOMBRES_DE_AJUSTE[ruta],
        ...GUIA_DE_AJUSTES[ruta],
      }
      if (ruta.startsWith("colores.")) return { ...base, tipo: "color" }
      if (ruta === "tipografia.titular" || ruta === "tipografia.cuerpo") {
        return { ...base, tipo: "fuente" }
      }
      const opciones = OPCIONES[ruta]
      if (!opciones) return { ...base, tipo: "si-no" }
      return {
        ...base,
        tipo: "opciones",
        opciones: opciones.map((valor) => ({
          valor,
          nombre:
            ruta === "disposicion.columnas"
              ? `${valor} por fila`
              : nombreDeValor(valor),
        })),
      }
    }
  )
}

/**
 * Lo que la app necesita para editar la tienda con sus propios controles.
 *
 * El borrador vive en `/editor/app`, que la app abre en su vista previa: acá
 * va lo que no cambia mientras se edita. Qué secciones existen y qué campos
 * tiene cada una —la misma tabla que arma los formularios de la web—, cada
 * ajuste con su control, las paletas y letras sugeridas, las fotos que se
 * pueden usar y el historial de versiones. Con esto, una sección o un ajuste
 * nuevo de la web aparece en la app sin tocarla.
 */
export async function GET() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const [diseno, apariencia, funciones, supabase] = await Promise.all([
    leerDisenoParaEditar(),
    getAparienciaDeMiTienda(),
    funcionesDeMiTienda(),
    createClient(),
  ])
  if (!diseno || !apariencia) return fallo("Todavía no tienes una tienda.", 404)
  if (funciones.editor !== "activa") {
    return fallo("El editor no está disponible para tu tienda.", 403)
  }

  const { tienda } = diseno
  const carpeta = `${tienda.id}/imagenes`
  const lista = supabase
    ? await supabase.storage.from(BUCKET).list(carpeta, {
        limit: 60,
        sortBy: { column: "created_at", order: "desc" },
      })
    : { data: [] }
  const biblioteca = (lista.data ?? [])
    .filter((archivo) => archivo.id && !archivo.name.startsWith("."))
    .map(
      (archivo) =>
        supabase?.storage
          .from(BUCKET)
          .getPublicUrl(`${carpeta}/${archivo.name}`).data.publicUrl
    )
    .filter((url): url is string => Boolean(url))

  return respuesta({
    tienda: {
      id: tienda.id,
      nombre: tienda.nombre,
      url: tienda.url,
      plantilla: tienda.plantilla,
      nombrePlantilla: tienda.nombrePlantilla,
      miniatura: miniaturaDePlantilla(tienda.plantilla),
    },
    base: diseno.base,
    secciones: Object.values(SECCIONES),
    ajustes: ajustes(),
    fuentes: Object.entries(FUENTES).map(([clave, fuente]) => ({
      clave,
      nombre: fuente.nombre,
    })),
    paletas: PALETAS,
    combinaciones: COMBINACIONES,
    // Las fotos se suben desde la app al bucket de la tienda, a estas carpetas.
    carpetas: { logo: `${tienda.id}/logo`, imagenes: carpeta },
    biblioteca,
    productos: diseno.productos,
    categorias: diseno.datos.categorias,
    versiones: apariencia.versiones,
    ia: funciones.ia_editor,
  })
}

/**
 * Publicar el borrador que la app armó.
 *
 * Es la misma `publicarDiseno` del editor de la web: el borrador no se cree,
 * se vuelve a validar entero contra lo que se lee de la base —las fotos y
 * categorías de la tienda, el contraste— antes de escribir nada.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const entrada = (await cuerpo(peticion)) as { borrador?: unknown } | null
  const resultado = await publicarDiseno(entrada?.borrador)
  if (!resultado.ok) {
    return respuesta(
      { error: resultado.error, problemas: resultado.problemas ?? [] },
      422
    )
  }
  return respuesta({ publicado: resultado.publicado })
}
