import type { Apariencia } from "@/lib/plantillas/apariencia"
import { contraste, hexAHsl, hslAHex } from "@/lib/plantillas/color"
import type { ClaveFuente } from "@/lib/plantillas/fuentes"
import type { Estilo } from "@/lib/catalogos/modelo"

/*
 * El estilo de un catálogo, ya resuelto para dibujar.
 *
 * La persona elige tres colores, dos letras y las esquinas; de ahí salen los
 * tonos intermedios —el campo de un panel, una regla, el texto secundario— y
 * el color que lleva el texto sobre el acento. Se calculan en vez de pedirse
 * por la misma razón que en la tienda: elegir cinco colores que se lean juntos
 * es difícil, y elegir tres, no.
 *
 * Neutral a propósito: lo usan la vista previa en el navegador y el PDF en el
 * servidor, y los dos tienen que llegar a los mismos números.
 */

/** Los pesos que cada letra trae, iguales en `next/font` y en `public/fuentes`. */
export const PESOS: Record<ClaveFuente, number[]> = {
  archivo: [600, 700, 800],
  geist: [400, 600],
  oswald: [500, 600, 700],
  cormorant: [500, 600, 700],
  jost: [400, 500, 600],
}

/**
 * Cuánto sube y cuánto baja cada letra desde su línea de base, en eme.
 *
 * Son las métricas tipográficas de los archivos de `public/fuentes`, y todas
 * declaran que se usen así: el navegador y el PDF leen los mismos números. El
 * PDF las necesita para ubicar el renglón como el navegador (ver
 * `lib/catalogos/pdf.tsx`).
 */
export const METRICAS: Record<ClaveFuente, { sube: number; baja: number }> = {
  archivo: { sube: 0.878, baja: 0.21 },
  geist: { sube: 1.005, baja: 0.295 },
  oswald: { sube: 1.193, baja: 0.289 },
  cormorant: { sube: 0.924, baja: 0.287 },
  jost: { sube: 1.07, baja: 0.375 },
}

/**
 * El ancho promedio de cada clase de carácter en el peso de titular, en eme.
 *
 * Medido sobre los mismos archivos. Sirve para lo que no puede pasar de un
 * renglón —una etiqueta gigante, una cinta que repite "2x1"—: el PDF no dibuja
 * un texto que no entra en su caja, así que hay que saber de antemano cuánto
 * ocupa.
 */
const ANCHOS: Record<
  ClaveFuente,
  {
    mayuscula: number
    minuscula: number
    digito: number
    espacio: number
    signo: number
  }
> = {
  archivo: {
    mayuscula: 0.726,
    minuscula: 0.57,
    digito: 0.625,
    espacio: 0.189,
    signo: 0.45,
  },
  geist: {
    mayuscula: 0.672,
    minuscula: 0.559,
    digito: 0.61,
    espacio: 0.236,
    signo: 0.414,
  },
  oswald: {
    mayuscula: 0.527,
    minuscula: 0.452,
    digito: 0.503,
    espacio: 0.256,
    signo: 0.386,
  },
  cormorant: {
    mayuscula: 0.645,
    minuscula: 0.444,
    digito: 0.432,
    espacio: 0.234,
    signo: 0.314,
  },
  jost: {
    mayuscula: 0.657,
    minuscula: 0.506,
    digito: 0.61,
    espacio: 0.3,
    signo: 0.448,
  },
}

/** Cuánto ocupa un texto en una letra, en eme, sin contar el espaciado. */
export function anchoEnEme(fuente: ClaveFuente, texto: string): number {
  const anchos = ANCHOS[fuente]
  let total = 0
  for (const letra of texto) {
    if (letra === " ") total += anchos.espacio
    else if (/\d/.test(letra)) total += anchos.digito
    else if (/\p{Lu}/u.test(letra)) total += anchos.mayuscula
    else if (/\p{Ll}/u.test(letra)) total += anchos.minuscula
    else total += anchos.signo
  }
  return total
}

/** El peso disponible más cercano: pedir uno que no está lo inventa el lector. */
export function pesoDe(fuente: ClaveFuente, deseado: number): number {
  return PESOS[fuente].reduce((mejor, peso) =>
    Math.abs(peso - deseado) < Math.abs(mejor - deseado) ? peso : mejor
  )
}

/** Lo que pide cada par de colores, igual que en la tienda. */
const MINIMOS = {
  /** 7 y no 4,5: el texto secundario es tinta mezclada con el papel. */
  texto: 7,
  /** El acento lleva texto: las ofertas, las etiquetas, el precio rebajado. */
  acento: 4.5,
  sobreAcento: 4.5,
}

export interface EstiloResuelto {
  colores: {
    /** El fondo de las hojas. Con los colores invertidos, es la tinta. */
    papel: string
    /** El texto. */
    tinta: string
    acento: string
    /** El texto que va sobre el acento: el que más se lea. */
    sobreAcento: string
    /** Un campo apenas distinto del papel, para paneles y fotos vacías. */
    suave: string
    /** Las reglas que separan. */
    linea: string
    /** El texto secundario. */
    apagado: string
  }
  titular: { fuente: ClaveFuente; peso: number; mayusculas: boolean }
  cuerpo: { fuente: ClaveFuente; peso: number; pesoFuerte: number }
  /** El radio de fotos y etiquetas, en puntos. */
  radio: number
}

export function resolverEstilo(estilo: Estilo): EstiloResuelto {
  const { papel, tinta } = estilo.colores
  const fondo = estilo.invertido ? tinta : papel
  const texto = estilo.invertido ? papel : tinta

  // El acento se eligió para leerse sobre el papel. Invertido, el fondo es
  // otro, y en vez de obligar a elegir de nuevo se busca la luz más cercana
  // del mismo tono que se lea: el rojo de la tienda pasa a un rojo más claro.
  const acento = estilo.invertido
    ? (acentoLegible(estilo.colores.acento, fondo) ?? texto)
    : estilo.colores.acento

  return {
    colores: {
      papel: fondo,
      tinta: texto,
      acento,
      sobreAcento: textoSobre(acento, [fondo, texto]),
      suave: mezclar(fondo, texto, 0.06),
      linea: mezclar(fondo, texto, 0.2),
      apagado: mezclar(fondo, texto, 0.72),
    },
    titular: {
      fuente: estilo.letras.titular,
      peso: pesoDe(estilo.letras.titular, 800),
      mayusculas: estilo.letras.mayusculas,
    },
    cuerpo: {
      fuente: estilo.letras.cuerpo,
      peso: pesoDe(estilo.letras.cuerpo, 400),
      pesoFuerte: pesoDe(estilo.letras.cuerpo, 600),
    },
    radio: estilo.esquinas === "suaves" ? 6 : 0,
  }
}

/** El estilo que trae la tienda: sus colores, su letra y sus esquinas. */
export function estiloDeTienda(apariencia: Apariencia): Estilo {
  return {
    colores: {
      papel: apariencia.colores.papel,
      tinta: apariencia.colores.tinta,
      acento: apariencia.colores.senal,
    },
    letras: {
      titular: apariencia.tipografia.titular,
      cuerpo: apariencia.tipografia.cuerpo,
      mayusculas: apariencia.tipografia.mayusculas,
    },
    esquinas: apariencia.forma.radio === "recto" ? "rectas" : "suaves",
    invertido: false,
  }
}

/* ---------------------------------------------------------------------------
 * Contraste
 * ------------------------------------------------------------------------ */

export { contraste }

/**
 * Lo que no se lee de un estilo, dicho para una persona.
 *
 * Son las mismas exigencias que el editor de la tienda, medidas sobre lo que
 * se va a dibujar: con los colores invertidos, el fondo es la tinta. Un
 * catálogo con problemas no se descarga: un PDF que no se lee se manda igual
 * por WhatsApp, y ahí ya no hay arreglo.
 */
export function problemasDeEstilo(estilo: Estilo): string[] {
  const { colores } = resolverEstilo(estilo)
  const problemas: string[] = []

  if (contraste(colores.tinta, colores.papel) < MINIMOS.texto) {
    problemas.push(
      "El texto no se lee bien sobre el fondo. Oscurece el texto o aclara el fondo."
    )
  }
  if (contraste(colores.acento, colores.papel) < MINIMOS.acento) {
    problemas.push(
      "El color de acento se pierde sobre el fondo, y es el de las ofertas y las etiquetas."
    )
  }
  if (contraste(colores.sobreAcento, colores.acento) < MINIMOS.sobreAcento) {
    problemas.push(
      "Sobre el color de acento no se lee ningún texto. Elige uno más oscuro o más claro."
    )
  }

  return problemas
}

/**
 * El acento más parecido al elegido que sí se lee, o `null` si no hay.
 *
 * Es el arreglo de un toque que ofrece el editor: conserva el tono y mueve
 * solo la luz, así el rojo de la tienda sigue siendo rojo.
 */
export function acentoCercano(estilo: Estilo): string | null {
  const fondo = estilo.invertido ? estilo.colores.tinta : estilo.colores.papel
  const texto = estilo.invertido ? estilo.colores.papel : estilo.colores.tinta
  const [tono, saturacion, luz] = hexAHsl(estilo.colores.acento)

  for (let paso = 1; paso <= 100; paso++) {
    for (const candidata of [luz - paso, luz + paso]) {
      if (candidata < 0 || candidata > 100) continue
      const hex = hslAHex(tono, saturacion, candidata)
      if (
        contraste(hex, fondo) >= MINIMOS.acento &&
        contraste(textoSobre(hex, [fondo, texto]), hex) >= MINIMOS.sobreAcento
      ) {
        return hex
      }
    }
  }
  return null
}

/** El acento invertido: el mismo si se lee, o la luz más cercana que se lea. */
function acentoLegible(acento: string, fondo: string): string | null {
  if (contraste(acento, fondo) >= MINIMOS.acento) return acento
  const [tono, saturacion, luz] = hexAHsl(acento)
  for (let paso = 1; paso <= 100; paso++) {
    for (const candidata of [luz + paso, luz - paso]) {
      if (candidata < 0 || candidata > 100) continue
      const hex = hslAHex(tono, saturacion, candidata)
      if (contraste(hex, fondo) >= MINIMOS.acento) return hex
    }
  }
  return null
}

/** De los colores dados y el blanco, el que más se lee sobre `fondo`. */
function textoSobre(fondo: string, candidatos: string[]): string {
  return ["#ffffff", ...candidatos].reduce((mejor, color) =>
    contraste(color, fondo) > contraste(mejor, fondo) ? color : mejor
  )
}

/* ---------------------------------------------------------------------------
 * Mezclas
 * ------------------------------------------------------------------------ */

/** `t` de 0 a 1: cuánto de `b` sobre `a`. */
export function mezclar(a: string, b: string, t: number): string {
  const canal = (hex: string, inicio: number) =>
    parseInt(hex.slice(inicio, inicio + 2), 16)
  const mezcla = [1, 3, 5].map((inicio) =>
    Math.round(canal(a, inicio) * (1 - t) + canal(b, inicio) * t)
  )
  return `#${mezcla.map((valor) => valor.toString(16).padStart(2, "0")).join("")}`
}
