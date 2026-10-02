/*
 * Genera todos los archivos de la marca desde `lib/marca.ts`.
 *
 *   npm run marca                      los que usa la app: app/ y public/marca/
 *   npm run marca -- --paquete <dir>   además, el paquete completo para descargar
 *
 * Las letras se convierten a trazos con `fontkit` —llega con @react-pdf— desde
 * las mismas fuentes que lee el PDF (`public/fuentes`): un SVG con texto vivo se
 * vería con otra letra en una computadora que no tenga Archivo. Los PNG los
 * dibuja `sharp`.
 */

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

import {
  CAJA,
  CAJA_JUSTA,
  CELULAR,
  COLORES_DE_MARCA as C,
  MOSTRADOR,
  RAYAS,
} from "../lib/marca.ts"

const require = createRequire(import.meta.url)
const fontkit = require("fontkit")

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const indice = process.argv.indexOf("--paquete")
const PAQUETE = indice > -1 ? path.resolve(process.argv[indice + 1]) : null

/* ---------------------------------------------------------------------------
 * El símbolo
 * ------------------------------------------------------------------------ */

/**
 * El símbolo en uno de sus cuatro trajes.
 *   color: tinta y rojo           oscuro: papel y rojo, para fondo oscuro
 *   tinta: todo en un color       blanco: todo en papel, para fondo oscuro
 * En un solo color, las rayas de tinta se calan: si se pintaran, el toldo
 * sería una mancha.
 */
function simbolo(traje) {
  const base = {
    color: C.tinta,
    oscuro: C.papel,
    tinta: C.tinta,
    blanco: C.papel,
  }[traje]
  const unColor = traje === "tinta" || traje === "blanco"
  const rayas = RAYAS.filter((r) => r.senal || !unColor)
    .map(
      (r) => `<path fill="${r.senal && !unColor ? C.senal : base}" d="${r.d}"/>`
    )
    .join("")
  return `<path fill="${base}" fill-rule="evenodd" d="${CELULAR}"/>${rayas}<path fill="${base}" d="${MOSTRADOR}"/>`
}

const svg = (viewBox, cuerpo, ancho, alto) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${
    ancho ? ` width="${ancho}" height="${alto ?? ancho}"` : ""
  }>${cuerpo}</svg>`

/* ---------------------------------------------------------------------------
 * Las letras, a trazos
 * ------------------------------------------------------------------------ */

function aTrazos(archivo, texto, tracking) {
  const fuente = fontkit.openSync(path.join(RAIZ, "public/fuentes", archivo))
  const escala = 1000 / fuente.unitsPerEm
  const corrida = fuente.layout(texto)
  let x = 0
  let d = ""
  const caja = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }
  corrida.glyphs.forEach((glifo, i) => {
    const trazo = glifo.path.scale(escala, -escala).translate(x, 0)
    d += trazo.toSVG()
    const b = trazo.bbox
    if (Number.isFinite(b.minX)) {
      caja.x1 = Math.min(caja.x1, b.minX)
      caja.x2 = Math.max(caja.x2, b.maxX)
      caja.y1 = Math.min(caja.y1, b.minY)
      caja.y2 = Math.max(caja.y2, b.maxY)
    }
    x += corrida.positions[i].xAdvance * escala + tracking * 1000
  })
  return { d, caja, alturaDeMayuscula: fuente.capHeight * escala }
}

// Archivo extrabold con tracking -0.02em, como la cabecera de la app.
const PALABRA = aTrazos("archivo-800.ttf", "Venduo", -0.02)
const LEMA = aTrazos(
  "geist-600.ttf",
  "Tu tienda online, y todo lo que hay detrás.",
  -0.01
)

/* ---------------------------------------------------------------------------
 * Las composiciones
 * ------------------------------------------------------------------------ */

const r = (n) => Math.round(n * 10) / 10

/** El símbolo a la izquierda, del alto de 1,4 mayúsculas, centrado en ellas. */
function horizontal(traje) {
  const cap = PALABRA.alturaDeMayuscula
  const k = (cap * 1.4) / 216
  const tx = -52 * k
  const ty = -cap / 2 - 132 * k
  const xPalabra = 152 * k + cap * 0.32 - PALABRA.caja.x1
  const arriba = Math.min(ty + 24 * k, PALABRA.caja.y1)
  const abajo = Math.max(ty + 240 * k, PALABRA.caja.y2)
  const ancho = xPalabra + PALABRA.caja.x2
  const tinta = traje === "color" || traje === "tinta" ? C.tinta : C.papel
  const cuerpo = `<g transform="translate(${r(tx)} ${r(ty)}) scale(${k.toFixed(4)})">${simbolo(traje)}</g><path fill="${tinta}" transform="translate(${r(xPalabra)} 0)" d="${PALABRA.d}"/>`
  return {
    cuerpo,
    viewBox: `0 ${r(arriba)} ${r(ancho)} ${r(abajo - arriba)}`,
    ancho,
    alto: abajo - arriba,
  }
}

/** El símbolo arriba, del alto de 2,6 mayúsculas, y el nombre debajo. */
function vertical(traje) {
  const cap = PALABRA.alturaDeMayuscula
  const anchoPalabra = PALABRA.caja.x2 - PALABRA.caja.x1
  const k = (cap * 2.6) / 216
  const pie = PALABRA.caja.y1 - cap * 0.5
  const tx = anchoPalabra / 2 - 128 * k
  const ty = pie - 240 * k
  const tinta = traje === "color" || traje === "tinta" ? C.tinta : C.papel
  const cuerpo = `<g transform="translate(${r(tx)} ${r(ty)}) scale(${k.toFixed(4)})">${simbolo(traje)}</g><path fill="${tinta}" transform="translate(${r(-PALABRA.caja.x1)} 0)" d="${PALABRA.d}"/>`
  const arriba = ty + 24 * k
  return {
    cuerpo,
    viewBox: `0 ${r(arriba)} ${r(anchoPalabra)} ${r(PALABRA.caja.y2 - arriba)}`,
    ancho: anchoPalabra,
    alto: PALABRA.caja.y2 - arriba,
  }
}

/** Un lienzo de color con el símbolo al centro, ocupando `fraccion` del alto. */
function lienzo(lado, fondo, traje, fraccion, esquina = 0) {
  const k = (lado * fraccion) / 216
  const tx = lado / 2 - 128 * k
  const ty = lado / 2 - 132 * k
  return svg(
    `0 0 ${lado} ${lado}`,
    `<rect width="${lado}" height="${lado}" rx="${esquina}" fill="${fondo}"/><g transform="translate(${r(tx)} ${r(ty)}) scale(${k.toFixed(4)})">${simbolo(traje)}</g>`,
    lado
  )
}

/** La tarjeta que se ve al pegar el enlace de Venduo en WhatsApp. */
function compartir() {
  const W = 1200
  const H = 630
  const h = horizontal("color")
  const escala = 640 / h.ancho
  const altoLogo = h.alto * escala
  const capLema = LEMA.alturaDeMayuscula
  const escalaLema = 30 / capLema
  const anchoLema = (LEMA.caja.x2 - LEMA.caja.x1) * escalaLema
  const yLogo = (H - altoLogo - 70) / 2
  const [vx, vy] = h.viewBox.split(" ").map(Number)
  const cuerpo = `<rect width="${W}" height="${H}" fill="${C.papel}"/><rect y="${H - 14}" width="${W}" height="14" fill="${C.senal}"/>
<g transform="translate(${r((W - 640) / 2 - vx * escala)} ${r(yLogo - vy * escala)}) scale(${escala.toFixed(5)})">${h.cuerpo}</g>
<path fill="${C.tinta}" fill-opacity="0.72" transform="translate(${r((W - anchoLema) / 2 - LEMA.caja.x1 * escalaLema)} ${r(yLogo + altoLogo + 70)}) scale(${escalaLema.toFixed(5)})" d="${LEMA.d}"/>`
  return svg(`0 0 ${W} ${H}`, cuerpo, W, H)
}

/* ---------------------------------------------------------------------------
 * Escribir
 * ------------------------------------------------------------------------ */

function escribir(destino, contenido) {
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  fs.writeFileSync(destino, contenido)
}

async function png(destino, codigoSvg, ancho, alto) {
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  await sharp(Buffer.from(codigoSvg), { density: 72 })
    .resize(ancho, alto ?? ancho, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(destino)
}

/** Un .ico con PNG adentro, que todos los navegadores leen. */
async function ico(destino, tamanos) {
  const imagenes = await Promise.all(
    tamanos.map((t) =>
      sharp(Buffer.from(svg(CAJA_JUSTA, simbolo("color"), t)))
        .png()
        .toBuffer()
    )
  )
  const cabecera = Buffer.alloc(6 + 16 * imagenes.length)
  cabecera.writeUInt16LE(0, 0)
  cabecera.writeUInt16LE(1, 2)
  cabecera.writeUInt16LE(imagenes.length, 4)
  let desplazamiento = cabecera.length
  imagenes.forEach((img, i) => {
    const t = tamanos[i]
    const o = 6 + 16 * i
    cabecera.writeUInt8(t >= 256 ? 0 : t, o)
    cabecera.writeUInt8(t >= 256 ? 0 : t, o + 1)
    cabecera.writeUInt16LE(1, o + 4)
    cabecera.writeUInt16LE(32, o + 6)
    cabecera.writeUInt32LE(img.length, o + 8)
    cabecera.writeUInt32LE(desplazamiento, o + 12)
    desplazamiento += img.length
  })
  escribir(destino, Buffer.concat([cabecera, ...imagenes]))
}

// El favicon en SVG cambia de color con el tema del navegador: un celular
// en tinta sobre una pestaña oscura desaparecía.
const iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CAJA_JUSTA}"><style>.b{fill:${C.tinta}}@media (prefers-color-scheme:dark){.b{fill:${C.papel}}}</style><path class="b" fill-rule="evenodd" d="${CELULAR}"/>${RAYAS.map(
  (r) => `<path ${r.senal ? `fill="${C.senal}"` : 'class="b"'} d="${r.d}"/>`
).join("")}<path class="b" d="${MOSTRADOR}"/></svg>`

async function paraLaApp() {
  const app = path.join(RAIZ, "app")
  const pub = path.join(RAIZ, "public/marca")
  escribir(path.join(app, "icon.svg"), iconoSvg)
  await ico(path.join(app, "favicon.ico"), [16, 32, 48])
  await png(
    path.join(app, "apple-icon.png"),
    lienzo(180, C.papel, "color", 0.66),
    180
  )
  await png(
    path.join(pub, "icono-192.png"),
    lienzo(192, C.papel, "color", 0.66),
    192
  )
  await png(
    path.join(pub, "icono-512.png"),
    lienzo(512, C.papel, "color", 0.66),
    512
  )
  await png(
    path.join(pub, "icono-adaptable-512.png"),
    lienzo(512, C.papel, "color", 0.56),
    512
  )
  await png(path.join(pub, "compartir.png"), compartir(), 1200, 630)
  const h = horizontal("color")
  escribir(path.join(pub, "venduo-horizontal.svg"), svg(h.viewBox, h.cuerpo))
  escribir(
    path.join(pub, "simbolo.svg"),
    svg(`0 0 ${CAJA} ${CAJA}`, simbolo("color"))
  )
}

async function paquete(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  const trajes = {
    color: "",
    oscuro: "-sobre-oscuro",
    tinta: "-un-color",
    blanco: "-blanco",
  }

  for (const [traje, sufijo] of Object.entries(trajes)) {
    const s = svg(`0 0 ${CAJA} ${CAJA}`, simbolo(traje))
    const h = horizontal(traje)
    const v = vertical(traje)
    escribir(path.join(dir, "SVG", `simbolo${sufijo}.svg`), s)
    escribir(
      path.join(dir, "SVG", `logo-horizontal${sufijo}.svg`),
      svg(h.viewBox, h.cuerpo)
    )
    escribir(
      path.join(dir, "SVG", `logo-vertical${sufijo}.svg`),
      svg(v.viewBox, v.cuerpo)
    )

    for (const t of [16, 32, 48, 64, 128, 256, 512, 1024]) {
      const chico = t <= 48 ? CAJA_JUSTA : `0 0 ${CAJA} ${CAJA}`
      await png(
        path.join(dir, "PNG", "simbolo", `simbolo${sufijo}-${t}.png`),
        svg(chico, simbolo(traje), t),
        t
      )
    }
    for (const ancho of [600, 1200, 2400]) {
      await png(
        path.join(
          dir,
          "PNG",
          "logo-horizontal",
          `logo-horizontal${sufijo}-${ancho}.png`
        ),
        svg(h.viewBox, h.cuerpo, ancho, Math.round((ancho * h.alto) / h.ancho)),
        ancho,
        Math.round((ancho * h.alto) / h.ancho)
      )
    }
    for (const alto of [400, 1000]) {
      const ancho = Math.round((alto * v.ancho) / v.alto)
      await png(
        path.join(
          dir,
          "PNG",
          "logo-vertical",
          `logo-vertical${sufijo}-${alto}.png`
        ),
        svg(v.viewBox, v.cuerpo, ancho, alto),
        ancho,
        alto
      )
    }
  }
  escribir(
    path.join(dir, "SVG", "palabra.svg"),
    svg(
      `${r(PALABRA.caja.x1)} ${r(PALABRA.caja.y1)} ${r(PALABRA.caja.x2 - PALABRA.caja.x1)} ${r(PALABRA.caja.y2 - PALABRA.caja.y1)}`,
      `<path fill="${C.tinta}" d="${PALABRA.d}"/>`
    )
  )

  const iconos = path.join(dir, "Iconos")
  escribir(path.join(iconos, "icon.svg"), iconoSvg)
  await ico(path.join(iconos, "favicon.ico"), [16, 32, 48])
  await png(
    path.join(iconos, "favicon-16.png"),
    svg(CAJA_JUSTA, simbolo("color"), 16),
    16
  )
  await png(
    path.join(iconos, "favicon-32.png"),
    svg(CAJA_JUSTA, simbolo("color"), 32),
    32
  )
  await png(
    path.join(iconos, "apple-touch-icon-180.png"),
    lienzo(180, C.papel, "color", 0.66),
    180
  )
  await png(
    path.join(iconos, "icono-app-192.png"),
    lienzo(192, C.papel, "color", 0.66),
    192
  )
  await png(
    path.join(iconos, "icono-app-512.png"),
    lienzo(512, C.papel, "color", 0.66),
    512
  )
  await png(
    path.join(iconos, "icono-app-adaptable-512.png"),
    lienzo(512, C.papel, "color", 0.56),
    512
  )
  await png(
    path.join(iconos, "icono-app-oscuro-512.png"),
    lienzo(512, C.tinta, "oscuro", 0.66),
    512
  )

  const redes = path.join(dir, "Redes sociales")
  await png(
    path.join(redes, "foto-de-perfil-1080.png"),
    lienzo(1080, C.papel, "color", 0.56),
    1080
  )
  await png(
    path.join(redes, "foto-de-perfil-oscura-1080.png"),
    lienzo(1080, C.tinta, "oscuro", 0.56),
    1080
  )
  await png(
    path.join(redes, "tarjeta-para-compartir-1200x630.png"),
    compartir(),
    1200,
    630
  )
}

await paraLaApp()
if (PAQUETE) await paquete(PAQUETE)
console.log(`Marca generada${PAQUETE ? ` y paquete en ${PAQUETE}` : ""}.`)
