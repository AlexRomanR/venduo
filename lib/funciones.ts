/**
 * Las funciones que Venduo puede activar, desactivar u ocultar en cada tienda.
 *
 * La lista es cerrada y vive acá; la base guarda el estado general de cada una
 * (`feature_states`) y el de cada tienda (`store_feature_states`), y lo
 * resuelve `funcion_de_tienda`: el de la tienda manda sobre el general.
 *
 * Sin dependencias de servidor: lo leen el panel del administrador, el del
 * emprendedor y los botones que se apagan.
 */

export const ESTADOS = ["activa", "desactivada", "oculta"] as const
export type EstadoDeFuncion = (typeof ESTADOS)[number]

export const NOMBRES_DE_ESTADO: Record<EstadoDeFuncion, string> = {
  activa: "Activa",
  desactivada: "Desactivada",
  oculta: "Desactivada y oculta",
}

export const DETALLE_DE_ESTADO: Record<EstadoDeFuncion, string> = {
  activa: "Todo normal.",
  desactivada:
    "Se ve, pero no responde. Al tocarla dice que no está disponible.",
  oculta: "No aparece.",
}

/** Lo único que ve el emprendedor, y solo si toca algo desactivado. */
export const AVISO_DE_NO_DISPONIBLE =
  "Esta función no está disponible por ahora."

export type GrupoDeFuncion = "IA" | "Herramientas" | "Tienda" | "Visitas"

export interface Funcion {
  clave: string
  nombre: string
  grupo: GrupoDeFuncion
  descripcion: string
}

export const FUNCIONES = [
  {
    clave: "ia_editor",
    nombre: "IA en el editor",
    grupo: "IA",
    descripcion: "Pedirle cambios a la IA y que escriba la portada.",
  },
  {
    clave: "ia_estadisticas",
    nombre: "IA en estadísticas",
    grupo: "IA",
    descripcion: "Preguntarle a sus números en palabras.",
  },
  {
    clave: "ia_catalogos",
    nombre: "IA en catálogos",
    grupo: "IA",
    descripcion: "Pedirle un catálogo en PDF a la IA.",
  },
  {
    clave: "catalogos",
    nombre: "Catálogos en PDF",
    grupo: "Herramientas",
    descripcion: "Armar, guardar y descargar catálogos.",
  },
  {
    clave: "canva",
    nombre: "Llevar a Canva",
    grupo: "Herramientas",
    descripcion: "Seguir un catálogo en Canva.",
  },
  {
    clave: "catalogo_compartido",
    nombre: "Enlace público de catálogo",
    grupo: "Herramientas",
    descripcion: "Mandar un catálogo como enlace que abre cualquiera.",
  },
  {
    clave: "estadisticas",
    nombre: "Estadísticas",
    grupo: "Herramientas",
    descripcion: "La pantalla de estadísticas y su informe en PDF.",
  },
  {
    clave: "editor",
    nombre: "Editor de la tienda",
    grupo: "Tienda",
    descripcion: "Cambiar colores, letra, portada y publicar.",
  },
  {
    clave: "cambiar_plantilla",
    nombre: "Cambiar de plantilla",
    grupo: "Tienda",
    descripcion: "Pasar a otra plantilla desde Apariencia.",
  },
  {
    clave: "visitas",
    nombre: "Ver sus visitas",
    grupo: "Visitas",
    descripcion:
      "Visitas de su tienda y sus productos, de dónde vienen y cuántas terminan en pedido.",
  },
] as const satisfies readonly Funcion[]

export type ClaveFuncion = (typeof FUNCIONES)[number]["clave"]

export type FuncionesDeTienda = Record<ClaveFuncion, EstadoDeFuncion>

export const CLAVES_DE_FUNCION = FUNCIONES.map((f) => f.clave) as [
  ClaveFuncion,
  ...ClaveFuncion[],
]

/** Todo activo: lo que ve el modo demo, que no tiene base. */
export const TODAS_ACTIVAS = Object.fromEntries(
  FUNCIONES.map((f) => [f.clave, "activa"])
) as FuncionesDeTienda

export function esEstado(valor: unknown): valor is EstadoDeFuncion {
  return (
    typeof valor === "string" && (ESTADOS as readonly string[]).includes(valor)
  )
}

/** Lo que devuelve la base, ya leído: una clave que falta se toma como activa. */
export function leerFunciones(crudo: unknown): FuncionesDeTienda {
  const datos =
    crudo && typeof crudo === "object" ? (crudo as Record<string, unknown>) : {}
  return Object.fromEntries(
    FUNCIONES.map((f) => [
      f.clave,
      esEstado(datos[f.clave]) ? datos[f.clave] : "activa",
    ])
  ) as FuncionesDeTienda
}
