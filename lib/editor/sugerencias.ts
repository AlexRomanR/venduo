import type { ClaveDePaso } from "@/lib/editor/pasos"
import type { Apariencia, Personalizacion } from "@/lib/plantillas/apariencia"
import { senalAltaDe } from "@/lib/plantillas/color"

/**
 * Los atajos del paso "Tu marca": paletas y combinaciones de letra listas
 * para tocar.
 *
 * Elegir cuatro colores que combinen y se lean es difícil; elegir entre diez
 * que ya combinan, no. Todas las paletas pasan `coloresLegibles` con margen —
 * se midieron al escribirlas—, así que tocar una nunca deja la tienda ilegible.
 *
 * No hay paletas oscuras, y no es un descuido: los botones llevan letra blanca,
 * y un acento que se lea sobre un fondo oscuro es demasiado claro para ella.
 */

export interface Paleta {
  nombre: string
  colores: Apariencia["colores"]
}

function paleta(
  nombre: string,
  papel: string,
  tinta: string,
  senal: string
): Paleta {
  return {
    nombre,
    colores: { papel, tinta, senal, senalAlta: senalAltaDe(senal) },
  }
}

export const PALETAS: Paleta[] = [
  paleta("Terracota", "#f6efe7", "#2a1d16", "#a8431f"),
  paleta("Bosque", "#eef1ea", "#14231a", "#2f6b3f"),
  paleta("Océano", "#edf3f6", "#0f1e2b", "#1d5f8c"),
  paleta("Vino", "#f7f0ee", "#25110f", "#7d1f2c"),
  paleta("Rosa", "#fbf1f3", "#2b1520", "#b4235a"),
  paleta("Lavanda", "#f3f1f8", "#1c1830", "#5b3fb0"),
  paleta("Mostaza", "#faf5e6", "#221d10", "#8a5a00"),
  paleta("Menta", "#edf6f2", "#10231d", "#0f6b55"),
  paleta("Cielo", "#f1f5fb", "#101828", "#2551c4"),
  paleta("Blanco y negro", "#f4f4f2", "#111111", "#111111"),
]

export interface CombinacionDeLetra {
  nombre: string
  /** Para quién queda bien, en pocas palabras. */
  ideal: string
  tipografia: Apariencia["tipografia"]
}

/**
 * Parejas de titular y cuerpo que funcionan juntas.
 *
 * Los pesos son los que cada fuente trae compilados en `lib/fuentes.ts`: pedir
 * un peso que no está hace que el navegador lo invente, y se nota.
 */
export const COMBINACIONES: CombinacionDeLetra[] = [
  {
    nombre: "Moderna",
    ideal: "Tecnología, servicios, todo rubro",
    tipografia: {
      titular: "archivo",
      cuerpo: "geist",
      pesoTitular: 800,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
  },
  {
    nombre: "Pasarela",
    ideal: "Ropa, calzado, deporte",
    tipografia: {
      titular: "oswald",
      cuerpo: "geist",
      pesoTitular: 600,
      espaciadoTitular: "abierto",
      mayusculas: true,
    },
  },
  {
    nombre: "Elegante",
    ideal: "Perfumes, joyas, regalos",
    tipografia: {
      titular: "cormorant",
      cuerpo: "jost",
      pesoTitular: 600,
      espaciadoTitular: "normal",
      mayusculas: false,
    },
  },
  {
    nombre: "Editorial",
    ideal: "Libros, decoración, arte",
    tipografia: {
      titular: "cormorant",
      cuerpo: "geist",
      pesoTitular: 700,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
  },
  {
    nombre: "Geométrica",
    ideal: "Cosmética, hogar, diseño",
    tipografia: {
      titular: "jost",
      cuerpo: "jost",
      pesoTitular: 500,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
  },
  {
    nombre: "Afiche",
    ideal: "Ropa urbana, gorras, tandas",
    tipografia: {
      titular: "anton",
      cuerpo: "geist",
      pesoTitular: 400,
      espaciadoTitular: "normal",
      mayusculas: true,
    },
  },
  {
    nombre: "Revista",
    ideal: "Carteras, joyas, accesorios",
    tipografia: {
      titular: "bodoni",
      cuerpo: "jost",
      pesoTitular: 500,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
  },
  {
    nombre: "Cancha",
    ideal: "Zapatillas, deporte, calzado",
    tipografia: {
      titular: "barlow",
      cuerpo: "geist",
      pesoTitular: 800,
      espaciadoTitular: "normal",
      mayusculas: true,
    },
  },
  {
    nombre: "Botica",
    ideal: "Perfumes de autor, velas, cosmética natural",
    tipografia: {
      titular: "instrument",
      cuerpo: "geist",
      pesoTitular: 400,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
  },
  {
    nombre: "Mostrador",
    ideal: "Bazar, regalos, de todo un poco",
    tipografia: {
      titular: "bricolage",
      cuerpo: "geist",
      pesoTitular: 800,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
  },
  {
    nombre: "Letrero",
    ideal: "Ferias, ofertas, segunda mano",
    tipografia: {
      titular: "oswald",
      cuerpo: "jost",
      pesoTitular: 700,
      espaciadoTitular: "normal",
      mayusculas: true,
    },
  },
]

/** Si la tipografía actual es exactamente la de una combinación. */
export function esLaCombinacion(
  actual: Apariencia["tipografia"],
  combinacion: CombinacionDeLetra
): boolean {
  const t = combinacion.tipografia
  return (
    actual.titular === t.titular &&
    actual.cuerpo === t.cuerpo &&
    actual.pesoTitular === t.pesoTitular &&
    actual.espaciadoTitular === t.espaciadoTitular &&
    actual.mayusculas === t.mayusculas
  )
}

/** Si los colores actuales son los de una paleta. */
export function esLaPaleta(
  actual: Apariencia["colores"],
  paleta: Paleta
): boolean {
  return (
    actual.papel === paleta.colores.papel &&
    actual.tinta === paleta.colores.tinta &&
    actual.senal === paleta.colores.senal
  )
}

/** Si la tienda no cambió nada de un grupo de la apariencia. */
export function sinCambios(
  personalizacion: Personalizacion,
  grupo: keyof Personalizacion
): boolean {
  const propio = personalizacion[grupo]
  return !propio || Object.keys(propio).length === 0
}

/**
 * Pedidos para tocar en la barra de la IA, según el paso. Son también la mejor
 * explicación de qué se le puede pedir: nadie sabe qué escribirle a un campo
 * vacío.
 */
export const PEDIDOS_SUGERIDOS: Record<ClaveDePaso, string[]> = {
  marca: [
    "Colores más cálidos",
    "Hazla más elegante",
    "Un estilo moderno y limpio",
    "Botones redondos",
  ],
  portada: [
    "Escribe los textos de mi portada",
    "Sube las preguntas frecuentes",
    "Agrega testimonios",
    "Portada para el Día de la Madre",
  ],
  catalogo: [
    "Fotos cuadradas en 4 columnas",
    "Que los productos se vean más grandes",
  ],
  producto: [
    "Ficha tipo vitrina, todo centrado",
    "Botón de compra siempre a la vista",
    "Sin productos parecidos al pie",
  ],
  carrito: ["Carrito tipo boleta", "Sugiere otros productos en el carrito"],
  publicar: [],
}
