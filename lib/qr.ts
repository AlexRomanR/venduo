import QRCode from "qrcode"

export interface QROptions {
  /** Tamaño del lado en píxeles (para PNG). */
  size?: number
  margin?: number
  dark?: string
  light?: string
}

const DEFAULTS: Required<QROptions> = {
  size: 512,
  margin: 2,
  dark: "#0a0a0a",
  light: "#ffffff",
}

function toQRCodeOptions(options: QROptions = {}) {
  const merged = { ...DEFAULTS, ...options }
  return {
    width: merged.size,
    margin: merged.margin,
    color: { dark: merged.dark, light: merged.light },
    errorCorrectionLevel: "M" as const,
  }
}

/** QR como data URL PNG (sirve directo en un <img src>). */
export function toDataURL(text: string, options?: QROptions): Promise<string> {
  return QRCode.toDataURL(text, toQRCodeOptions(options))
}

/** QR como string SVG (escala sin perder nitidez, ideal para imprimir). */
export function toSVG(text: string, options?: QROptions): Promise<string> {
  return QRCode.toString(text, { ...toQRCodeOptions(options), type: "svg" })
}

/** QR como Buffer PNG, para responder desde un Route Handler. */
export function toPNGBuffer(
  text: string,
  options?: QROptions
): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    ...toQRCodeOptions(options),
    type: "png",
  })
}
