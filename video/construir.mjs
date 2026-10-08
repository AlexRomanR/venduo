/*
 * Escribe las dos composiciones del lanzamiento desde las mismas escenas:
 *
 *   node --no-warnings construir.mjs vertical     1080 × 1920 (TikTok, Reels)
 *   node --no-warnings construir.mjs horizontal   1920 × 1080 (portada, YouTube)
 *
 * Las dos escriben index.html: HyperFrames admite una sola composición raíz.
 *
 * Se edita esto, no los HTML. Cómo debe verse y moverse está en MOTION.md.
 *
 * La música sale de assets/musica/upbeat-funk-original.mp3 (112 BPM, grilla desde
 * 0,026 s). Cada edición es el comienzo de la pista y su última frase, empalmados en
 * un tiempo fuerte para que el golpe final caiga sobre el enlace:
 *
 *   ffmpeg -i upbeat-funk-original.mp3 -filter_complex "[0:a]atrim=0.026:<FIN>,
 *     asetpts=PTS-STARTPTS,afade=t=in:d=0.02[a];[0:a]atrim=98.594:104.2,
 *     asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=0.04,loudnorm=I=-14:TP=-1.5[o]"
 *     -map "[o]" -ar 48000 -b:a 256k <salida>.mp3
 *
 *   <FIN> = 25.739 para la vertical y 38.595 para la horizontal.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { COLORES_DE_MARCA as C } from "../lib/marca.ts"

const RAIZ = path.dirname(fileURLToPath(import.meta.url))

/** Lo que se lee al final. Cambiarlo es esta línea y volver a exportar. */
const ENLACE = "venduo.vercel.app"

/** Un tiempo de la música, en segundos: 112 BPM. */
const T = 60 / 112
const b = (n) => Math.round(n * T * 1000) / 1000

/** El empalme de la música: de acá en adelante suena su última frase. */
const EMPALME = { vertical: 25.673, horizontal: 38.529 }
/** El golpe final de la pista, ya empalmada. */
const GOLPE = { vertical: 29.154, horizontal: 42.01 }

/* ---------------------------------------------------------------------------
 * El caos: lo que le escriben a quien vende por redes
 * ------------------------------------------------------------------------ */

const MENSAJES = [
  ["WhatsApp", "Valeria", "¿precio?"],
  ["TikTok", "@jhon.lpz", "¿hay en M?"],
  ["Instagram", "Mariela", "¿tienes catálogo?"],
  ["WhatsApp", "Luis", "¿todavía tienes?"],
  ["Facebook", "Daniela", "info"],
  ["TikTok", "@carla.scz", "¿precio por favor?"],
  ["Instagram", "Brayan", "¿cuánto la polera?"],
  ["WhatsApp", "Nicole", "¿hay en negro?"],
  ["Facebook", "Wilmer", "¿me lo guardas?"],
  ["TikTok", "@sofi_lp", "¿sigue disponible?"],
  ["WhatsApp", "Ronald", "¿precio??"],
  ["Instagram", "Fernanda", "pásame fotos"],
  ["TikTok", "@marco.cbba", "¿dónde veo todo?"],
  ["WhatsApp", "Valeria", "holaa ¿precio?"],
  ["Facebook", "Gabriela", "¿tienes en L?"],
  ["Instagram", "@andre.bo", "¿cuánto cuesta?"],
  ["WhatsApp", "Jhon", "¿me mandas el catálogo?"],
  ["TikTok", "@dayana", "¿precio?"],
  ["Instagram", "Kevin", "¿aún hay?"],
  ["WhatsApp", "Mariela", "¿y la gorra?"],
  ["Facebook", "Luis", "¿precio?"],
  ["TikTok", "@nico.sz", "info pls"],
  ["WhatsApp", "Daniela", "¿cuánto es?"],
  ["Instagram", "Carla", "¿precio?"],
  ["WhatsApp", "Wilmer", "¿todavía?"],
  ["TikTok", "@lu.mendez", "¿precio?"],
  ["Facebook", "Brayan", "¿hacen catálogo?"],
  ["WhatsApp", "Sofi", "¿tienes la mochila?"],
]

/** Cuándo aparece cada mensaje, en tiempos: primero de a uno, después en ráfaga. */
function tiemposDelCaos(n) {
  const t = [0, 0]
  let x = 1
  while (t.length < n) {
    t.push(x)
    x += x < 4 ? 1 : x < 12 ? 0.5 : 0.25
  }
  return t.filter((v) => v < 14).slice(0, n)
}

/** Generador con semilla: el caos se ve al azar y sale igual en cada render. */
function azar(semilla) {
  let s = semilla
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ubica los mensajes sin que se tapen, dentro de la zona dada. */
function ubicar(mensajes, zona, letra, semilla) {
  const r = azar(semilla)
  const puestos = []
  return mensajes.map(([red, quien, texto], i) => {
    // El nombre de arriba va en versalitas espaciadas: suele ser más ancho que el mensaje.
    const etiqueta = (red + " · " + quien).length * 0.8 * letra * 0.45
    const w = Math.round(Math.max(texto.length * 0.6 * letra, etiqueta) + 60)
    const h = Math.round(letra * 1.15 + letra * 0.45 * 1.3 + 44)
    let mejor = null
    for (let intento = 0; intento < 4000; intento++) {
      const x = Math.round(zona.x0 + r() * (zona.x1 - zona.x0 - w))
      const y = Math.round(zona.y0 + r() * (zona.y1 - zona.y0 - h))
      const choca = puestos.some(
        (p) =>
          x < p.x + p.w + 18 &&
          x + w + 18 > p.x &&
          y < p.y + p.h + 18 &&
          y + h + 18 > p.y
      )
      if (!choca || intento === 3999) {
        mejor = { x, y, w, h }
        break
      }
    }
    // Los dos primeros, los que se ven en el primer cuadro, van arriba y al medio.
    if (i === 0)
      Object.assign(mejor, {
        x: Math.round(zona.x0 + 40),
        y: Math.round(zona.y0 + 60),
      })
    puestos.push(mejor)
    return mejor
  })
}

/* ---------------------------------------------------------------------------
 * Las escenas: una pantalla y su frase, o su paso
 * ------------------------------------------------------------------------ */

// *Esto* va en rojo y lleva la regla trazada debajo.
// `frase`: el resultado, en el vertical. `num`, `titulo` y `sub`: el paso, en el horizontal.
const ESCENAS = {
  crear: {
    frase: ["Tu tienda online,", "lista en *minutos*."],
    num: 1,
    titulo: ["Crea tu *tienda*"],
    sub: "Eliges una plantilla y queda lista en minutos.",
  },
  precios: {
    frase: ["Tus precios,", "siempre *a la vista*."],
  },
  productos: {
    num: 2,
    titulo: ["Sube tus *productos*"],
    sub: "Con su foto, su precio y cuántas te quedan.",
  },
  catalogo: {
    frase: ["Tu catálogo,", "listo para *mandar*."],
    num: 3,
    titulo: ["Comparte tu *catálogo*"],
    sub: "Un PDF con tus precios de hoy, para mandar por WhatsApp.",
  },
  pedido: {
    frase: ["Los pedidos te llegan", "*ordenados*."],
    num: 4,
    titulo: ["Recibe pedidos", "por *WhatsApp*"],
    sub: "Tu cliente arma su carrito y te lo manda con el total.",
  },
  ventas: {
    num: 5,
    titulo: ["Mira qué *vendes* más"],
    sub: "Le preguntas a tus ventas y te responde con un gráfico.",
  },
  ia: {
    num: 6,
    titulo: ["Cámbiala cuando", "*quieras*"],
    sub: "A mano, o pidiéndoselo a la IA en tus palabras.",
  },
}

/* ---------------------------------------------------------------------------
 * Los dos formatos
 * ------------------------------------------------------------------------ */

const FORMATOS = {
  vertical: {
    archivo: "index.html",
    W: 1080,
    H: 1920,
    duracion: 30.6,
    musica: "assets/musica/lanzamiento-vertical.mp3",
    texto: "frase",
    escenas: [
      ["crear", 24, 30],
      ["precios", 30, 36],
      ["catalogo", 36, 42],
      ["pedido", 42, null],
    ],
    caos: { zona: { x0: 50, x1: 1030, y0: 150, y1: 1760 }, letra: 44, n: 26 },
    gancho: {
      size: 118,
      lineas: ["¿Y si tu tienda", "contestara", "*por ti*?"],
    },
    foto: { x: 190, y: 290, w: 700, h: 1050 },
    logo: { cx: 540, cy: 820, h: 330 },
    marcaS2: { top: 1030, size: 168, lema: 50, lemaTop: 1238 },
    equipo: { x: 300, y: 330, w: 480, h: 1010 },
    hojas: { h: 600, a: -300, b: 300 },
    pregunta: { top: 226, left: 90, width: 900, align: "center", size: 52 },
    respuesta: { top: 1392, left: 60, width: 960, align: "center", size: 66 },
    cierre: {
      logoH: 230,
      cy: 690,
      marca: 150,
      lemaTop: 860,
      lema: 78,
      lemaLineas: ["Tu tienda online,", "tu inventario", "y tus ventas."],
      enlaceTop: 1150,
      enlace: 62,
      notaTop: 1318,
    },
  },
  horizontal: {
    archivo: "index.html",
    W: 1920,
    H: 1080,
    duracion: 43.5,
    musica: "assets/musica/lanzamiento-horizontal.mp3",
    texto: "pasos",
    escenas: [
      ["crear", 24, 32],
      ["productos", 32, 40],
      ["catalogo", 40, 48],
      ["pedido", 48, 56],
      ["ventas", 56, 64],
      ["ia", 64, null],
    ],
    caos: { zona: { x0: 60, x1: 1860, y0: 60, y1: 1020 }, letra: 40, n: 28 },
    gancho: { size: 128, lineas: ["¿Y si tu tienda", "contestara *por ti*?"] },
    foto: { x: 660, y: 60, w: 600, h: 960 },
    logo: { cx: 960, cy: 360, h: 340 },
    marcaS2: { top: 568, size: 160, lema: 46, lemaTop: 770 },
    equipo: { x: 220, y: 90, w: 430, h: 900 },
    // En horizontal las dos hojas salen hacia la izquierda: a la derecha está el texto.
    hojas: { h: 500, a: -265, b: -150 },
    pregunta: { top: 210, left: 760, width: 1080, align: "left", size: 48 },
    respuesta: { top: 380, left: 760, width: 1100, align: "left", size: 92 },
    cierre: {
      logoH: 210,
      cy: 290,
      marca: 150,
      lemaTop: 438,
      lema: 80,
      lemaLineas: ["Tu tienda online,", "tu inventario y tus ventas."],
      enlaceTop: 680,
      enlace: 60,
      notaTop: 842,
    },
  },
}

/* ---------------------------------------------------------------------------
 * HTML
 * ------------------------------------------------------------------------ */

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")

/** Una línea de respuesta, con lo marcado en rojo y su regla. */
const linea = (texto) =>
  esc(texto).replace(
    /\*([^*]+)\*/g,
    '<span class="rojo">$1<i class="regla"></i></span>'
  )

/** Cada letra en su span, para que la pregunta se escriba. */
const letras = (texto) =>
  [...texto]
    .map((c) => `<span class="ch">${c === " " ? "&nbsp;" : esc(c)}</span>`)
    .join("")

/** El celular en estado de logo: las proporciones de lib/marca.ts. */
function estadoLogo(cx, cy, h) {
  const s = h / 216
  const w = 152 * s
  return {
    cuerpo: {
      left: cx - w / 2,
      top: cy - h / 2,
      width: w,
      height: h,
      borderRadius: 24 * s,
    },
    pantalla: {
      left: 14 * s,
      right: 14 * s,
      top: 26 * s,
      bottom: 26 * s,
      borderRadius: 10 * s,
    },
  }
}

function estadoEquipo({ x, y, w, h }) {
  return {
    cuerpo: { left: x, top: y, width: w, height: h, borderRadius: 58 },
    pantalla: { left: 14, right: 14, top: 14, bottom: 14, borderRadius: 44 },
  }
}

function pantallas(f) {
  const ids = f.escenas.map(([id]) => id)
  const html = {
    crear: `<div class="pant" id="p-crear">
        <img class="paso" id="crear-1" src="assets/pantallas/crear/2-elegida.jpg" alt="" />
        <img class="paso" id="crear-2" src="assets/pantallas/crear/4-negocio-lleno.jpg" alt="" />
        <img class="paso" id="crear-3" src="assets/pantallas/rosa-portada.jpg" alt="" />
        <i class="toque" id="toque-crear"></i>
      </div>`,
    catalogo: `<div class="pant" id="p-catalogo">
        <img class="paso" id="cat-1" src="assets/pantallas/catalogo-editor/2-elegidos.jpg" alt="" />
        <img class="paso" id="cat-2" src="assets/pantallas/catalogo-editor/3-estilos.jpg" alt="" />
        <img class="paso" id="cat-3" src="assets/pantallas/catalogo-editor/4-editor.jpg" alt="" />
        <div class="paso visor" id="cat-4">
          <div class="visor-cab"><span>temporada-rosa.pdf</span><span>5 hojas</span></div>
          <img class="visor-hoja" src="assets/pantallas/rosa-hoja-1.jpg" alt="" />
        </div>
        <i class="toque" id="toque-catalogo"></i>
      </div>`,
    precios: `<div class="pant" id="p-precios">
        <img class="llena" src="assets/pantallas/rosa-tienda.jpg" alt="" />
        <i class="subraya" id="p-precios-marca"></i>
      </div>`,
    productos: `<div class="pant" id="p-productos">
        <img class="paso" id="prod-1" src="assets/pantallas/productos/1-ficha.jpg" alt="" />
        <img class="paso" id="prod-2" src="assets/pantallas/productos/2-precio.jpg" alt="" />
        <img class="paso" id="prod-3" src="assets/pantallas/productos/3-lista.jpg" alt="" />
      </div>`,
    pedido: `<div class="pant chat" id="p-pedido">
        <div class="chat-cab"><span class="chat-av">RD</span><div><b>Rosa Deportes</b><small>en línea</small></div></div>
        <div class="chat-fondo">
          <div class="msj sale" id="msj-sale">
            <p class="ml">Hola Rosa Deportes, quiero hacer este pedido (#148):</p>
            <p class="ml">· 1× Top deportivo rosa — Bs 95</p>
            <p class="ml">· 1× Calza deportiva — Bs 150</p>
            <p class="ml"><b>Total: Bs 245</b></p>
            <span class="ml hora">10:42 ✓✓</span>
          </div>
          <div class="msj entra" id="msj-entra">¡Gracias! Ya te lo separo.</div>
        </div>
      </div>`,
    ventas: `<div class="pant graf" id="p-ventas">
        <p class="graf-preg">¿Qué se vendió más este mes?</p>
        ${[
          ["Top deportivo rosa", 18],
          ["Calza deportiva", 12],
          ["Zapatillas urbanas", 9],
          ["Kit de entrenamiento", 7],
        ]
          .map(
            ([n, v], i) => `<div class="fila"><span class="fila-n">${n}</span>
          <div class="fila-barra"><i class="barra" id="barra-${i}" style="width:${(v / 18) * 100}%"></i></div>
          <span class="fila-v" id="valor-${i}" data-v="${v}">0</span></div>`
          )
          .join("")}
        <p class="graf-nota">Pedidos pagados · octubre</p>
      </div>`,
    ia: `<div class="pant" id="p-ia">
        <img class="llena" src="assets/pantallas/ia-antes.jpg" alt="" />
        <img class="llena" id="p-ia-verano" src="assets/pantallas/ia-despues.jpg" alt="" />
        <div class="ia-pedido"><span class="ia-txt">${letras("Ponle colores de verano")}</span><span class="ia-ok" id="ia-ok">Aplicar</span></div>
      </div>`,
  }
  return ids.map((id) => html[id]).join("\n      ")
}

function escribir(nombre) {
  const f = FORMATOS[nombre]
  const id = nombre
  const empalme = EMPALME[nombre]
  const golpe = GOLPE[nombre]
  const tiempos = tiemposDelCaos(f.caos.n)
  const mensajes = MENSAJES.slice(0, tiempos.length)
  const lugares = ubicar(
    mensajes,
    f.caos.zona,
    f.caos.letra,
    nombre === "vertical" ? 11 : 23
  )
  const logo = estadoLogo(f.logo.cx, f.logo.cy, f.logo.h)
  const equipo = estadoEquipo(f.equipo)

  // El cierre: el logo con el nombre al lado, centrado.
  const cs = f.cierre.logoH / 216
  const anchoMarca = 3.72 * f.cierre.marca
  const anchoLockup = 152 * cs + 0.3 * f.cierre.marca + anchoMarca
  const xLockup = (f.W - anchoLockup) / 2
  const cierreLogo = estadoLogo(
    xLockup + (152 * cs) / 2,
    f.cierre.cy,
    f.cierre.logoH
  )
  const xMarcaCierre = xLockup + 152 * cs + 0.3 * f.cierre.marca

  const escenas = f.escenas.map(([clave, desde, hasta]) => ({
    clave,
    t0: b(desde),
    t1: hasta === null ? empalme : b(hasta),
    ...ESCENAS[clave],
  }))

  const css = `
      @font-face { font-family: "Archivo"; font-weight: 800; src: url("assets/fuentes/archivo-800.ttf") format("truetype"); }
      @font-face { font-family: "Geist"; font-weight: 400; src: url("assets/fuentes/geist-400.ttf") format("truetype"); }
      @font-face { font-family: "Geist"; font-weight: 600; src: url("assets/fuentes/geist-600.ttf") format("truetype"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${f.W}px; height: ${f.H}px; overflow: hidden; background: ${C.papel}; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${C.papel}; color: ${C.tinta}; font-family: "Geist", sans-serif; font-weight: 400; }
      .capa { position: absolute; inset: 0; }
      .titular { font-family: "Archivo", sans-serif; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }

      /* El caos */
      .burbuja { position: absolute; background: #fbfaf8; border: 2px solid ${C.tinta}; padding: 16px 26px 18px; }
      .burbuja .de { display: block; font-weight: 600; font-size: ${Math.round(f.caos.letra * 0.45)}px; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.6; margin-bottom: 6px; white-space: nowrap; }
      .burbuja .tx { display: block; font-weight: 600; font-size: ${f.caos.letra}px; line-height: 1.15; white-space: nowrap; }
      #vendedora { position: absolute; left: ${f.foto.x}px; top: ${f.foto.y}px; width: ${f.foto.w}px; height: ${f.foto.h}px; object-fit: cover; filter: grayscale(1); }
      #gancho { position: absolute; left: 0; right: 0; top: 50%; text-align: center; font-size: ${f.gancho.size}px; }
      #gancho .l { display: block; }
      /* El celular */
      #cuerpo { position: absolute; background: ${C.tinta}; overflow: hidden; }
      #pantalla { position: absolute; background: ${C.papel}; overflow: hidden; }
      .raya { position: absolute; top: 0; height: 30.5%; width: 20%; border-radius: 0 0 50% 50% / 0 0 24.8% 24.8%; transform-origin: 50% 0%; }
      .raya.s { background: ${C.senal}; }
      .raya.t { background: ${C.tinta}; }
      #mostrador { position: absolute; left: 11.3%; top: 73.2%; width: 77.4%; height: 9.76%; background: ${C.tinta}; transform-origin: 50% 50%; }
      .pant { position: absolute; inset: 0; background: ${C.papel}; overflow: hidden; }
      .llena { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #hojas { position: absolute; left: ${f.equipo.x + f.equipo.w / 2}px; top: ${f.equipo.y + f.equipo.h / 2}px; }
      .hoja { position: absolute; height: ${f.hojas.h}px; left: ${-f.hojas.h * 0.3535}px; top: ${-f.hojas.h / 2}px; border: 1px solid rgba(22, 23, 26, 0.25); }

      /* Las pantallas dibujadas */
      .visor { background: #e3e1dd; display: flex; flex-direction: column; align-items: center; }
      .visor-cab { width: 100%; display: flex; justify-content: space-between; padding: 56px 26px 18px; font-weight: 600; font-size: 17px; letter-spacing: 0.04em; background: ${C.tinta}; color: ${C.papel}; }
      .visor-hoja { width: 86%; margin-top: 40px; border: 1px solid rgba(22, 23, 26, 0.2); }
      .subraya { position: absolute; height: 4px; background: ${C.senal}; transform-origin: 0 50%; }
      .chat { background: #ebe8e3; }
      .chat-cab { display: flex; align-items: center; gap: 14px; padding: 58px 22px 18px; background: ${C.tinta}; color: ${C.papel}; }
      .chat-cab b { display: block; font-weight: 600; font-size: 25px; }
      .chat-cab small { display: block; font-size: 15px; opacity: 0.7; }
      .chat-av { width: 48px; height: 48px; border-radius: 50%; background: ${C.papel}; color: ${C.tinta}; display: grid; place-items: center; font-family: "Archivo", sans-serif; font-weight: 800; font-size: 18px; }
      .chat-fondo { padding: 36px 18px; display: flex; flex-direction: column; gap: 16px; }
      .msj { padding: 16px 18px; font-size: 24px; line-height: 1.35; border: 2px solid ${C.tinta}; }
      .msj.sale { align-self: flex-end; width: 88%; background: #fbfaf8; }
      .msj.entra { align-self: flex-start; background: ${C.papel}; font-weight: 600; }
      .msj .ml { display: block; }
      .msj .hora { text-align: right; font-size: 15px; opacity: 0.6; margin-top: 4px; }
      .graf { padding: 66px 26px 0; display: flex; flex-direction: column; gap: 22px; }
      .graf-preg { font-weight: 600; font-size: 22px; padding: 14px 16px; border: 2px solid ${C.tinta}; background: #fbfaf8; margin-bottom: 18px; }
      .fila { display: grid; grid-template-columns: 1fr auto; row-gap: 8px; align-items: end; }
      .fila-n { font-weight: 600; font-size: 19px; }
      .fila-v { font-family: "Archivo", sans-serif; font-weight: 800; font-size: 26px; font-variant-numeric: tabular-nums; }
      .fila-barra { grid-column: 1 / -1; height: 26px; border-bottom: 1px solid rgba(22, 23, 26, 0.12); }
      .barra { display: block; height: 100%; background: ${C.senal}; transform-origin: 0 50%; }
      .graf-nota { font-size: 16px; opacity: 0.65; margin-top: 8px; }
      .paso { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top; }
      .toque { position: absolute; width: 74px; height: 74px; margin: -37px 0 0 -37px; border-radius: 50%; border: 4px solid ${C.tinta}; background: rgba(22, 23, 26, 0.16); }
      .ia-pedido { position: absolute; left: 18px; right: 18px; bottom: 26px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px; background: ${C.papel}; border: 2px solid ${C.tinta}; font-weight: 600; font-size: 19px; }
      .ia-ok { background: ${C.tinta}; color: ${C.papel}; padding: 8px 12px; font-size: 16px; }

      /* Pregunta y respuesta */
      .resp { position: absolute; top: ${f.respuesta.top}px; left: ${f.respuesta.left}px; width: ${f.respuesta.width}px; text-align: ${f.respuesta.align}; font-size: ${f.respuesta.size}px; }
      .resp .l { display: block; white-space: nowrap; }
      .num { position: absolute; top: ${f.pregunta.top}px; left: ${f.pregunta.left}px; font-size: 140px; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
      .sub { position: absolute; left: ${f.pregunta.left}px; width: 900px; font-size: 38px; line-height: 1.3; opacity: 0.72; }
      .rojo { position: relative; color: ${C.senal}; }
      .regla { position: absolute; left: 0; right: 0; bottom: -0.06em; height: 0.075em; background: ${C.senal}; transform-origin: 0 50%; }

      /* Las marcas */
      .marca-s2 { position: absolute; left: 0; right: 0; text-align: center; }
      #marca-s2 { top: ${f.marcaS2.top}px; font-size: ${f.marcaS2.size}px; letter-spacing: -0.02em; }
      #lema-s2 { top: ${f.marcaS2.lemaTop}px; font-weight: 600; font-size: ${f.marcaS2.lema}px; line-height: 1.25; }
      #lema-s2 .l { display: block; }
      #marca-cierre { position: absolute; left: ${Math.round(xMarcaCierre)}px; top: ${Math.round(f.cierre.cy - f.cierre.marca * 0.52)}px; font-size: ${f.cierre.marca}px; letter-spacing: -0.02em; }
      #lema-cierre { position: absolute; left: 0; right: 0; top: ${f.cierre.lemaTop}px; text-align: center; font-size: ${f.cierre.lema}px; }
      #lema-cierre .l { display: block; }
      #enlace { position: absolute; left: 0; right: 0; top: ${f.cierre.enlaceTop}px; display: flex; justify-content: center; }
      #enlace-caja { background: ${C.senal}; color: #ffffff; padding: 26px 44px 30px; font-size: ${f.cierre.enlace}px; letter-spacing: -0.02em; transform-origin: 50% 50%; }
      #nota { position: absolute; left: 0; right: 0; top: ${f.cierre.notaTop}px; text-align: center; font-weight: 600; font-size: ${Math.round(f.cierre.enlace * 0.62)}px; opacity: 0.75; }
  `

  const caos = mensajes
    .map(
      ([red, quien, texto], i) =>
        `<div class="burbuja" id="m${i}" style="left:${lugares[i].x}px;top:${lugares[i].y}px"><span class="de">${esc(red)} · ${esc(quien)}</span><span class="tx">${esc(texto)}</span></div>`
    )
    .join("\n        ")

  const rayas = [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<i class="raya ${i % 2 === 0 ? "s" : "t"}" style="left:${i * 20}%"></i>`
    )
    .join("")

  const clipsEscenas = escenas
    .map((e) => {
      const lineas = f.texto === "frase" ? e.frase : e.titulo
      const subTop =
        f.respuesta.top + lineas.length * f.respuesta.size * 1.02 + 34
      const paso =
        f.texto === "pasos"
          ? `<div class="num titular" id="e-${e.clave}-n">0${e.num}</div>`
          : ""
      const sub =
        f.texto === "pasos"
          ? `<p class="sub" id="e-${e.clave}-sub" style="top:${Math.round(subTop)}px">${esc(e.sub)}</p>`
          : ""
      return `<section class="clip capa" id="e-${e.clave}" data-start="${e.t0}" data-duration="${Math.round((e.t1 - e.t0) * 1000) / 1000}" data-track-index="3">
        ${paso}
        <div class="resp titular" id="e-${e.clave}-resp">${lineas.map((l) => `<span class="l">${linea(l)}</span>`).join("")}</div>
        ${sub}
      </section>`
    })
    .join("\n      ")

  // Los datos que el timeline necesita, escritos en el HTML: nada se calcula al azar.
  const datos = {
    W: f.W,
    H: f.H,
    tiempos: tiempos.map(b),
    lugares,
    centro: { x: f.logo.cx, y: f.logo.cy },
    logo,
    equipo,
    cierreLogo,
    escenas: escenas.map(({ clave, t0, t1 }) => ({ clave, t0, t1 })),
    hojasA: f.hojas.a,
    hojasB: f.hojas.b,
    empalme,
    golpe,
    b: Object.fromEntries(
      [8, 13.5, 14, 16, 17.5, 18.5, 23, 23.25].map((n) => [n, b(n)])
    ),
  }

  const html = `<!doctype html>
<html lang="es" data-resolution="${nombre === "vertical" ? "portrait" : "landscape"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${f.W}, height=${f.H}" />
    <title>Venduo · lanzamiento ${nombre}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${css}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${id}" data-start="0" data-duration="${f.duracion}" data-width="${f.W}" data-height="${f.H}">
      <section class="clip capa" id="caos" data-start="0" data-duration="${b(16) + 0.1}" data-track-index="0">
        <div class="capa" id="lluvia">
        <img id="vendedora" src="assets/pantallas/vendedora.jpg" alt="" />
        ${caos}
        </div>
        <div class="titular" id="gancho">${f.gancho.lineas.map((l) => `<span class="l">${linea(l)}</span>`).join("")}</div>
      </section>

      <section class="clip capa" id="celular" data-start="${b(15)}" data-duration="${Math.round((f.duracion - b(15)) * 1000) / 1000}" data-track-index="1">
        <div id="hojas"><img class="hoja" id="hoja-a" src="assets/pantallas/rosa-hoja-2.jpg" alt="" /><img class="hoja" id="hoja-b" src="assets/pantallas/rosa-hoja-3.jpg" alt="" /></div>
        <div id="cuerpo">
          <div id="pantalla">
      ${pantallas(f)}
            <div class="capa" id="toldo">${rayas}<i id="mostrador"></i></div>
          </div>
        </div>
      </section>

      <section class="clip capa" id="presenta" data-start="${b(16)}" data-duration="${Math.round((b(24) - b(16)) * 1000) / 1000}" data-track-index="2">
        <div class="marca-s2 titular" id="marca-s2">Venduo</div>
        <div class="marca-s2" id="lema-s2"><span class="l">Tu puesto de siempre,</span><span class="l">ahora en tus redes.</span></div>
      </section>

      ${clipsEscenas}

      <section class="clip capa" id="cierre" data-start="${empalme}" data-duration="${Math.round((f.duracion - empalme) * 1000) / 1000}" data-track-index="4">
        <div class="titular" id="marca-cierre">Venduo</div>
        <div class="titular" id="lema-cierre">${f.cierre.lemaLineas.map((l) => `<span class="l">${esc(l)}</span>`).join("")}</div>
        <div id="enlace"><span class="titular" id="enlace-caja">${ENLACE}</span></div>
        <div id="nota">Crea tu tienda gratis.</div>
      </section>

      <audio id="musica" src="${f.musica}" data-start="0" data-duration="${f.duracion}" data-track-index="5" data-volume="1"></audio>
    </div>
    <script>
      const D = ${JSON.stringify(datos)};
${LINEA_COMPLETA.replace("__ID__", id)}
    </script>
  </body>
</html>
`
  fs.writeFileSync(path.join(RAIZ, f.archivo), html)
  return {
    archivo: f.archivo,
    escenas: escenas.length,
    mensajes: mensajes.length,
  }
}

/* ---------------------------------------------------------------------------
 * La línea de tiempo: la misma para los dos formatos
 * ------------------------------------------------------------------------ */

const LINEA_DE_TIEMPO = String.raw`
      const tl = gsap.timeline({ paused: true });
      const ENTRA = "expo.out";
      const $ = (s) => document.querySelector(s);
      const $$ = (s) => [...document.querySelectorAll(s)];
      // Toda animación después del estado inicial declara sus dos extremos y no se
      // aplica sola: así se puede saltar a cualquier cuadro y sale igual.
      const ft = (el, de, a, en) => tl.fromTo(el, de, { ...a, immediateRender: false }, en);

      /* Estado inicial, fuera del timeline: un set en el cero no se dibuja mientras
         el cabezal está justo en el cero, y HyperFrames lo marca. */
      D.lugares.forEach((_, i) => gsap.set("#m" + i, i < 2 ? { opacity: 1 } : { opacity: 0 }));
      gsap.set("#gancho", { yPercent: -50 });
      gsap.set("#gancho .l", { opacity: 0, y: 40 });
      gsap.set("#cuerpo", { ...D.logo.cuerpo, opacity: 0, scale: 0.4 });
      gsap.set("#pantalla", D.logo.pantalla);
      gsap.set(".raya", { scaleY: 0 });
      gsap.set("#mostrador", { scaleX: 0, opacity: 1 });
      gsap.set(".pant", { yPercent: 100 });
      gsap.set(".hoja", { x: 0, opacity: 0 });
      gsap.set(["#marca-s2", "#lema-s2 .l"], { opacity: 0, y: 40 });
      gsap.set([".num", ".resp .l", ".sub"], { opacity: 0, y: 40 });
      gsap.set(".regla", { scaleX: 0 });
      gsap.set(["#marca-cierre", "#lema-cierre .l", "#nota"], { opacity: 0, y: 40 });
      gsap.set("#enlace-caja", { opacity: 0, scale: 1.25 });

      /* 1. El caos: los mensajes llueven. */
      D.lugares.forEach((_, i) => {
        if (i < 2) return;
        ft("#m" + i, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: ENTRA }, D.tiempos[i]);
      });
      // La pregunta en el tiempo 8; los mensajes y la foto quedan detrás.
      ft("#lluvia", { opacity: 1 }, { opacity: 0.16, duration: 0.3, ease: "power2.out" }, D.b[8]);
      ft("#gancho .l", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: ENTRA, stagger: 0.12 }, D.b[8]);
      ft("#gancho .regla", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: ENTRA }, D.b[8] + 0.6);
      ft("#gancho .l", { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 0.25, ease: "power2.in" }, D.b[13.5]);
      ft("#lluvia", { opacity: 0.16 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, D.b[13.5]);
      ft("#vendedora", { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "power2.in" }, D.b[13.5]);
      // Del tiempo 14 al 16 los mensajes se juntan donde va a nacer el celular.
      const lejos = D.lugares
        .map((l, i) => ({ i, d: Math.hypot(l.x + l.w / 2 - D.centro.x, l.y + l.h / 2 - D.centro.y) }))
        .sort((a, z) => z.d - a.d);
      lejos.forEach(({ i }, k) => {
        const l = D.lugares[i];
        ft("#m" + i,
          { x: 0, y: 0, scale: 1, opacity: 1 },
          { x: D.centro.x - (l.x + l.w / 2), y: D.centro.y - (l.y + l.h / 2), scale: 0.08, opacity: 0, duration: 0.55, ease: "power3.in" },
          D.b[14] + k * (0.5 / lejos.length));
      });

      /* 2. El celular: nace en el tiempo 16 y se despliega el toldo. */
      ft("#cuerpo", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.5, ease: ENTRA }, D.b[16]);
      ft(".raya", { scaleY: 0 }, { scaleY: 0.1, duration: 0.25, ease: "power2.out" }, D.b[16] + 0.12);
      ft(".raya", { scaleY: 0.1 }, { scaleY: 1, duration: 0.8, ease: ENTRA, stagger: 0.035 }, D.b[16] + 0.42);
      ft("#mostrador", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: ENTRA }, D.b[16] + 0.95);
      ft("#marca-s2", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: ENTRA }, D.b[17.5]);
      ft("#lema-s2 .l", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: ENTRA, stagger: 0.09 }, D.b[18.5]);
      ft(["#marca-s2", "#lema-s2 .l"], { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 0.25, ease: "power2.in" }, D.b[23]);
      // El logo se vuelve el celular de la tienda: el toldo se enrolla.
      ft("#cuerpo", D.logo.cuerpo, { ...D.equipo.cuerpo, duration: 0.55, ease: "expo.inOut" }, D.b[23.25]);
      ft("#pantalla", D.logo.pantalla, { ...D.equipo.pantalla, duration: 0.55, ease: "expo.inOut" }, D.b[23.25]);
      ft(".raya", { scaleY: 1 }, { scaleY: 0, duration: 0.3, ease: "power2.in", stagger: { each: 0.03, from: "end" } }, D.b[23.25]);
      ft("#mostrador", { opacity: 1 }, { opacity: 0, duration: 0.2 }, D.b[23.25]);

      /* 3. Cada escena: su pantalla y su frase (o su paso). */
      D.escenas.forEach(({ clave, t0, t1 }) => {
        const p = "#e-" + clave;
        const textos = [p + "-n", p + "-resp .l", p + "-sub"].filter((x) => document.querySelector(x));
        ft("#p-" + clave, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: ENTRA }, t0 + 0.05);
        ft(textos, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: ENTRA, stagger: 0.09 }, t0 + 0.15);
        ft(p + "-resp .regla", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: ENTRA }, t0 + 0.7);
        ft(textos, { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 0.25, ease: "power2.in" }, t1 - 0.27);
        const extra = ESCENA[clave];
        if (extra) extra(t0, t1);
      });

      /* 4. El cierre: vuelve a ser el logo, y el enlace cae en el golpe final. */
      const c = D.empalme;
      ft(".pant", { opacity: 1 }, { opacity: 0, duration: 0.2 }, c);
      ft(".hoja", { opacity: 0 }, { opacity: 0, duration: 0.01 }, c);
      ft("#cuerpo", D.equipo.cuerpo, { ...D.cierreLogo.cuerpo, duration: 0.6, ease: "expo.inOut" }, c);
      ft("#pantalla", D.equipo.pantalla, { ...D.cierreLogo.pantalla, duration: 0.6, ease: "expo.inOut" }, c);
      ft("#mostrador", { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 0, duration: 0.01 }, c + 0.4);
      ft(".raya", { scaleY: 0 }, { scaleY: 0.1, duration: 0.2, ease: "power2.out" }, c + 0.4);
      ft(".raya", { scaleY: 0.1 }, { scaleY: 1, duration: 0.8, ease: ENTRA, stagger: 0.035 }, c + 0.62);
      ft("#mostrador", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: ENTRA }, c + 1.1);
      ft("#marca-cierre", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: ENTRA }, c + 0.6);
      ft("#lema-cierre .l", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: ENTRA, stagger: 0.09 }, c + 1.2);
      ft("#enlace-caja", { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, D.golpe);
      ft("#nota", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: ENTRA }, D.golpe + 0.3);

      window.__timelines["__ID__"] = tl;
`

// Lo que pasa dentro de la pantalla en cada escena. Va antes del timeline, en el HTML.
const ESCENAS_JS = String.raw`
      const toque = (sel, x, y, t) => {
        tl.set(sel, { left: x + "%", top: y + "%" }, t - 0.02);
        ft(sel, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: "power2.out" }, t);
        ft(sel, { scale: 1, opacity: 1 }, { scale: 1.5, opacity: 0, duration: 0.32, ease: "power2.in" }, t + 0.2);
      };
      const paso = (sel, t) => ft(sel, { yPercent: 100 }, { yPercent: 0, duration: 0.45, ease: ENTRA }, t);
      const ESCENA = {
        crear(t0, t1) {
          const d = t1 - t0;
          toque("#toque-crear", 76.7, 95.2, t0 + 0.17 * d);
          paso("#crear-2", t0 + 0.23 * d);
          paso("#crear-3", t0 + 0.5 * d);
        },
        productos(t0, t1) {
          const d = t1 - t0;
          paso("#prod-2", t0 + 0.33 * d);
          paso("#prod-3", t0 + 0.64 * d);
        },
        catalogo(t0, t1) {
          const d = t1 - t0;
          toque("#toque-catalogo", 50, 95.8, t0 + 0.16 * d);
          paso("#cat-2", t0 + 0.22 * d);
          toque("#toque-catalogo", 25, 60, t0 + 0.36 * d);
          paso("#cat-3", t0 + 0.42 * d);
          toque("#toque-catalogo", 60, 40.5, t0 + 0.55 * d);
          paso("#cat-4", t0 + 0.61 * d);
          ft("#hoja-a", { x: 0, opacity: 0 }, { x: D.hojasA, opacity: 1, duration: 0.6, ease: "expo.out" }, t0 + 0.66 * d);
          ft("#hoja-b", { x: 0, opacity: 0 }, { x: D.hojasB, opacity: 1, duration: 0.6, ease: "expo.out" }, t0 + 0.69 * d);
          ft(".hoja", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power2.in" }, t1 - 0.27);
        },
        pedido(t0) {
          ft("#msj-sale .ml", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: "expo.out", stagger: 0.1 }, t0 + 0.4);
          ft("#msj-entra", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "expo.out" }, t0 + 1.5);
        },
        ventas(t0) {
          [0, 1, 2, 3].forEach((i) => {
            const el = document.getElementById("valor-" + i);
            const fin = Number(el.dataset.v);
            const v = { n: 0 };
            ft("#barra-" + i, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "expo.out" }, t0 + 0.6 + i * 0.09);
            tl.fromTo(v, { n: 0 }, { n: fin, duration: 0.7, ease: "expo.out", immediateRender: false,
              onUpdate: () => { el.textContent = String(Math.round(v.n)); } }, t0 + 0.6 + i * 0.09);
          });
        },
        ia(t0, t1) {
          ft("#p-ia .ch", { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.03 }, t0 + 0.45);
          ft("#ia-ok", { opacity: 0.35 }, { opacity: 1, duration: 0.2 }, t0 + 1.25);
          ft("#p-ia-verano", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "expo.inOut" }, t0 + 1.5);
        },
      };
`

// Estados iniciales propios de las escenas dibujadas.
const INICIALES_JS = String.raw`
      gsap.set("#msj-sale .ml, #msj-entra", { opacity: 0 });
      gsap.set(".barra", { scaleX: 0 });
      gsap.set("#p-ia-verano", { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(".paso", { yPercent: 100 });
      ["#crear-1", "#cat-1", "#prod-1"].forEach((x) => { if (document.querySelector(x)) gsap.set(x, { yPercent: 0 }); });
      gsap.set(".toque", { opacity: 0, scale: 0.3 });
      gsap.set("#ia-ok", { opacity: 0.35 });
`

// El marcador del precio: debajo de "Bs 450", la primera ficha de la tienda.
const MARCA_PRECIO_JS = String.raw`
      if (document.getElementById("p-precios-marca")) {
        const pant = document.getElementById("pantalla");
        gsap.set("#p-precios-marca", { left: "5%", top: "57.6%", width: "10.2%", scaleX: 0 });
        const e = D.escenas.find((x) => x.clave === "precios");
        ft("#p-precios-marca", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.out" }, e.t0 + 0.9);
      }
`

/* Une las piezas del timeline en el orden en que tienen que correr. */
const LINEA_COMPLETA = LINEA_DE_TIEMPO.replace(
  "      /* 1. El caos",
  INICIALES_JS + ESCENAS_JS + MARCA_PRECIO_JS + "\n      /* 1. El caos"
)

// HyperFrames admite una sola composición raíz por proyecto: se escribe un formato por vez.
const pedido = process.argv[2] ?? "vertical"
if (!FORMATOS[pedido]) throw new Error("Formato: vertical u horizontal")
console.log(escribir(pedido))
