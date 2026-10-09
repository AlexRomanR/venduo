/*
 * Las constantes del catálogo en PDF: hojas, plantillas, variantes y campos.
 *
 * Aparte de `modelo.ts` y sin zod a propósito: las lee el editor, que es de
 * cliente, y el esquema entero viajaría al navegador por una lista de nombres.
 * `modelo.ts` las vuelve a exportar, así que del lado del servidor da igual
 * de dónde se importen.
 */

/** Los tamaños de hoja, en puntos tipográficos (72 por pulgada). */
export const HOJAS = {
  a4: {
    nombre: "A4 vertical",
    detalle: "Para imprimir o mandar por WhatsApp.",
    ancho: 595.28,
    alto: 841.89,
  },
  historia: {
    nombre: "Historia 9:16",
    detalle: "Para verlo a pantalla completa en el celular.",
    ancho: 405,
    alto: 720,
  },
} as const

export type ClaveHoja = keyof typeof HOJAS
export const CLAVES_HOJA = Object.keys(HOJAS) as [ClaveHoja, ...ClaveHoja[]]

/** Las doce plantillas. Su definición está en `plantillas.ts`. */
export const CLAVES_PLANTILLA = [
  "minimal",
  "revista",
  "lookbook",
  "precios",
  "destacado",
  "lujo",
  "historia",
  "mayorista",
  "feria",
  "packs",
  "ofertas",
  "flyer",
] as const

export type ClavePlantilla = (typeof CLAVES_PLANTILLA)[number]

/**
 * Las variantes de cada tipo de bloque, con su nombre para la persona.
 *
 * Un bloque se puede cambiar de variante sin perder lo que tiene: todas las
 * variantes de un tipo leen los mismos campos.
 */
export const VARIANTES = {
  portada: {
    foto: "Foto completa",
    tipografica: "Solo letra",
    dividida: "Foto y texto",
    collage: "Mosaico de fotos",
    marco: "Con marco",
  },
  productos: {
    grilla: "Grilla",
    lista: "Lista con detalle",
    menu: "Lista de precios",
    tabla: "Tabla",
    destacado: "Uno por página",
    lookbook: "Lookbook",
    pedestal: "Vitrina",
    historia: "Historia",
    etiquetas: "Etiquetas de feria",
    flyer: "Flyer",
  },
  separador: {
    titulo: "Título grande",
    foto: "Con foto",
  },
  pack: {
    tarjeta: "Tarjeta",
    lista: "Lista",
  },
  oferta: {
    banner: "Página completa",
    cinta: "Franja",
  },
  contraportada: {
    contacto: "Contacto",
    qr: "QR grande",
  },
  texto: {
    libre: "Texto",
    cita: "Cita",
  },
} as const

export type TipoDeBloque = keyof typeof VARIANTES

/** Lo que cada tipo de bloque es, para el menú de agregar. */
export const TIPOS_DE_BLOQUE: Record<
  TipoDeBloque,
  { nombre: string; detalle: string }
> = {
  portada: {
    nombre: "Portada",
    detalle: "La primera página: tu marca y el título.",
  },
  productos: {
    nombre: "Productos",
    detalle: "Tus productos, todos o los de una categoría.",
  },
  separador: {
    nombre: "Separador",
    detalle: "Una página que abre una categoría o un tema.",
  },
  pack: {
    nombre: "Pack o combo",
    detalle: "Varios productos juntos, con su precio de pack.",
  },
  oferta: {
    nombre: "Oferta",
    detalle: "Un aviso grande: un descuento, una temporada.",
  },
  contraportada: {
    nombre: "Contraportada",
    detalle: "Cómo comprarte: WhatsApp, redes, QR y pago.",
  },
  texto: {
    nombre: "Texto",
    detalle: "Una página con tus palabras.",
  },
}

/** Lo que se puede mostrar de cada producto, con su nombre. */
export const CAMPOS = {
  precio: "Precio",
  precioAnterior: "Precio anterior",
  descripcion: "Descripción corta",
  categoria: "Categoría",
  stock: "Unidades disponibles",
  codigo: "Código",
} as const

export type Campo = keyof typeof CAMPOS

/** Qué campos muestra una página de productos. */
export type Campos = Record<Campo, boolean>

/** Lo que se muestra de un producto cuando nadie eligió otra cosa. */
export const CAMPOS_POR_DEFECTO: Campos = {
  precio: true,
  precioAnterior: true,
  descripcion: false,
  categoria: false,
  stock: false,
  codigo: false,
}

/** Un id corto para un bloque o un pack nuevo. No tiene que ser secreto. */
export function idNuevo(prefijo: string): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 10)}`
}
