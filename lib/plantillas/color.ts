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
