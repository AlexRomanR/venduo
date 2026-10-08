/**
 * Cuentas de color, sin dependencias.
 *
 * Viven aparte de `apariencia.ts` porque las usan componentes de cliente —el
 * editor de catálogos, las sugerencias de paleta— y aquel módulo trae zod
 * entero: importarlas desde allá sumaba el esquema a la pantalla.
 */

function luminancia(hex: string): number {
  const canales = [1, 3, 5].map((inicio) => {
    const valor = parseInt(hex.slice(inicio, inicio + 2), 16) / 255
    return valor <= 0.04045
      ? valor / 12.92
      : Math.pow((valor + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2]
}

/** El contraste WCAG entre dos colores `#rrggbb`. */
export function contraste(a: string, b: string): number {
  const [clara, oscura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (clara + 0.05) / (oscura + 0.05)
}

/** El tono de acento al pasar el cursor, derivado de la señal. */
export function senalAltaDe(senal: string): string {
  const [tono, saturacion, luz] = hexAHsl(senal)
  return hslAHex(tono, saturacion, Math.min(luz + 8, 92))
}

export function hexAHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map(
    (inicio) => parseInt(hex.slice(inicio, inicio + 2), 16) / 255
  )
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const luz = (max + min) / 2

  if (max === min) return [0, 0, Math.round(luz * 100)]

  const delta = max - min
  const saturacion = luz > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  const tono =
    max === r
      ? ((g - b) / delta + (g < b ? 6 : 0)) * 60
      : max === g
        ? ((b - r) / delta + 2) * 60
        : ((r - g) / delta + 4) * 60

  return [tono, saturacion * 100, Math.round(luz * 100)]
}

export function hslAHex(tono: number, saturacion: number, luz: number): string {
  const s = saturacion / 100
  const l = luz / 100
  const a = s * Math.min(l, 1 - l)
  const canal = (n: number) => {
    const k = (n + tono / 30) % 12
    const valor = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(valor * 255)
      .toString(16)
      .padStart(2, "0")
  }
  return `#${canal(0)}${canal(8)}${canal(4)}`
}

/**
 * Un color dicho en palabras: "crema", "verde oscuro", "café casi negro".
 *
 * Es para contarle a quien vende qué cambia —en el resumen de publicar y en la
 * propuesta de la IA—, donde un "#f6efe7" no dice nada. Es aproximado a
 * propósito: nombra la familia, y la muestra de color al lado dice el resto.
 */
export function nombreDeColor(hex: string): string {
  const [tono, saturacion, luz] = hexAHsl(hex)

  if (saturacion < 12) {
    if (luz >= 90) return "blanco"
    if (luz >= 70) return "gris claro"
    if (luz >= 35) return "gris"
    if (luz >= 15) return "gris oscuro"
    return "negro"
  }

  const familia =
    tono < 15 || tono >= 345
      ? "rojo"
      : tono < 40
        ? "naranja"
        : tono < 65
          ? "amarillo"
          : tono < 160
            ? "verde"
            : tono < 200
              ? "turquesa"
              : tono < 250
                ? "azul"
                : tono < 290
                  ? "violeta"
                  : "rosa"

  if (luz >= 88) {
    return familia === "naranja" || familia === "amarillo"
      ? "crema"
      : `${familia} muy claro`
  }
  // Un naranja, un rojo o un rosa oscuros ya no se ven así: son café, vino y
  // ciruela.
  const oscuro =
    familia === "naranja"
      ? "café"
      : familia === "rojo"
        ? "vino"
        : familia === "rosa"
          ? "ciruela"
          : familia
  if (luz < 15) return `${oscuro} casi negro`
  if (luz < 30) return familia === oscuro ? `${familia} oscuro` : oscuro
  // Un naranja apagado, entre el café y el naranja de verdad, es terracota.
  if (familia === "naranja" && luz < 45) return "terracota"
  if (luz >= 70) return `${familia} claro`
  return familia
}

/**
 * Cómo cambió un color, en palabras: "crema → verde claro", o, si los dos se
 * llaman igual, "crema más claro". Un "crema → crema" no cuenta nada.
 */
export function cambioDeColor(antes: string, despues: string): string {
  const nombreAntes = nombreDeColor(antes)
  const nombreDespues = nombreDeColor(despues)
  if (nombreAntes !== nombreDespues) return `${nombreAntes} → ${nombreDespues}`

  const diferencia = hexAHsl(despues)[2] - hexAHsl(antes)[2]
  if (diferencia >= 3) return `${nombreDespues}, más claro`
  if (diferencia <= -3) return `${nombreDespues}, más oscuro`
  return `${nombreDespues}, otro tono`
}
