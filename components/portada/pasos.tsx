"use client"

import { useRef, type ReactNode } from "react"
import Image from "next/image"
import {
  Check,
  Copy,
  FileSpreadsheet,
  Link2,
  MessageCircle,
  Plus,
  Sparkles,
  TriangleAlert,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { PASOS, producto } from "@/components/portada/datos"
import estilos from "@/components/portada/portada.module.css"
import { useAncho } from "@/components/portada/escala"
import {
  LogoFacebook,
  LogoInstagram,
  LogoTikTok,
  LogoWhatsApp,
} from "@/components/portada/logos"
import { useRotacion } from "@/components/portada/rotacion"
import { CON_MOVIMIENTO, gsap, useGSAP } from "@/components/portada/gsap"

const CADA = 5200
/** El tamaño al que se dibujan las escenas: grande, y angosto para el celular. */
const ESCENA_GRANDE = { ancho: 760, alto: 520 }
const ESCENA_ANGOSTA = { ancho: 380, alto: 700 }

function Foto({ clave, className }: { clave: string; className?: string }) {
  const p = producto(clave)
  return (
    <Image
      src={p.foto}
      alt=""
      width={p.ancho}
      height={p.alto}
      sizes="200px"
      className={cn("h-auto object-contain", className)}
    />
  )
}

const TARJETA =
  "rounded-2xl border border-[var(--regla)] bg-white shadow-[0_24px_50px_-28px_rgb(29_28_26/0.45)]"

/**
 * Lo que la IA lee de lo que subes. Son los mismos productos que aparecen en
 * la planilla, el cuaderno y las fotos de la izquierda.
 */
const LEIDOS = [
  ["zapatillas", "Zapatillas rojas", "Bs 450", "3"],
  ["chamarra", "Chamarra de jean", "Bs 280", "4"],
  ["perfume", "Perfume Energy", "Bs 320", "6"],
  ["labial", "Labial dorado", "Bs 95", "12"],
  ["audifonos", "Audífonos", "Bs 390", "2"],
]

const PIE_DE_FUENTE = "mt-1.5 text-[11.5px] text-[var(--tinta)]/55"

function Planilla() {
  return (
    <>
      <div className={cn(TARJETA, "overflow-hidden")}>
        <p className="flex items-center gap-1.5 border-b border-[var(--regla)] px-3 py-2 text-[11.5px] font-semibold">
          <FileSpreadsheet
            aria-hidden="true"
            className="size-3.5 text-[#1d7a45]"
          />
          productos.xlsx
        </p>
        <div className="grid grid-cols-[1.4fr_0.7fr_0.75fr] text-[10px]">
          {[
            ["Nombre", "Precio", "Stock"],
            ["Zapatillas rojas", "450", "3"],
            ["Chamarra de jean", "280", "4"],
          ].map((fila, i) =>
            fila.map((celda, j) => (
              <span
                key={`${i}-${j}`}
                className={cn(
                  "truncate border-r border-b border-[var(--regla)] px-1.5 py-1",
                  i === 0 && "bg-[var(--papel)] font-semibold"
                )}
              >
                {celda}
              </span>
            ))
          )}
        </div>
      </div>
      <p className={PIE_DE_FUENTE}>Excel o Google Sheets</p>
    </>
  )
}

function Cuaderno() {
  return (
    <>
      <div className="rounded-xl bg-white p-1.5 shadow-[0_24px_50px_-24px_rgb(29_28_26/0.5)]">
        <div
          className="rounded-lg px-3 pt-2 pb-3"
          style={{
            background:
              "repeating-linear-gradient(to bottom, #fbfaf5 0 21px, #d9e3f2 21px 22px)",
          }}
        >
          {["perfume energy — 320 (6)", "labial dorado — 95 (12)"].map(
            (linea) => (
              <p
                key={linea}
                className={cn(estilos.mano, "text-[15px] leading-[22px]")}
              >
                {linea}
              </p>
            )
          )}
        </div>
      </div>
      <p className={PIE_DE_FUENTE}>Foto de tu cuaderno</p>
    </>
  )
}

function FotosSueltas() {
  return (
    <>
      <div className="flex gap-1.5">
        {["audifonos", "cartera", "labial"].map((clave) => (
          <span
            key={clave}
            className="flex size-14 items-center justify-center rounded-xl bg-white p-1.5 shadow-[0_16px_30px_-16px_rgb(29_28_26/0.5)]"
          >
            <Foto clave={clave} className="max-h-full w-[86%]" />
          </span>
        ))}
      </div>
      <p className={PIE_DE_FUENTE}>Fotos de tus productos</p>
    </>
  )
}

function AMano() {
  return (
    <span
      className={cn(
        TARJETA,
        "flex items-center gap-2 px-3 py-2.5 text-[12.5px] font-medium"
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--tinta)] text-white">
        <Plus aria-hidden="true" className="size-3.5" />
      </span>
      O uno por uno, a mano
    </span>
  )
}

function Ia({ fila }: { fila?: boolean }) {
  return (
    <div
      className={cn(
        "js-ia flex items-center gap-2",
        fila ? "justify-center" : "flex-col"
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl bg-[var(--boli)] text-white shadow-[0_18px_40px_-14px_color-mix(in_srgb,var(--boli)_70%,transparent)]",
          fila ? "size-10" : "size-14"
        )}
      >
        <Sparkles aria-hidden="true" className={fila ? "size-5" : "size-6"} />
      </span>
      <span className="text-[12px] font-semibold text-[var(--boli)]">
        La IA lo lee
      </span>
    </div>
  )
}

function Resultado() {
  return (
    <div className={cn(TARJETA, "js-resultado p-4")}>
      <p className="text-[13px] font-semibold">Así leímos tus productos</p>
      <div className="mt-3 space-y-1.5">
        {LEIDOS.map(([clave, nombre, precio, stock]) => (
          <div
            key={clave}
            className="js-leido flex items-center gap-2.5 rounded-lg bg-[var(--papel)] px-2 py-1.5 text-[12px]"
          >
            <span className="flex size-4 items-center justify-center rounded-[4px] bg-[var(--boli)] text-white">
              <Check aria-hidden="true" className="size-3" strokeWidth={3} />
            </span>
            <span className="flex size-7 items-center justify-center rounded-md bg-white">
              <Foto clave={clave} className="max-h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {nombre}
            </span>
            <span className={estilos.cifras}>{precio}</span>
            <span
              className={cn(
                estilos.cifras,
                "w-5 text-right text-[var(--tinta)]/55"
              )}
            >
              {stock}
            </span>
          </div>
        ))}
      </div>
      <span className="mt-3 flex h-10 items-center justify-center rounded-full bg-[var(--tinta)] text-[13px] font-semibold text-white">
        Crear <span className="js-cuenta mx-1 tabular-nums">5</span> productos
      </span>
    </div>
  )
}

/**
 * 1. Subes tus productos: de una planilla, la foto del cuaderno, las fotos de
 * los productos o a mano, todo entra a la IA y sale el catálogo armado.
 */
function Subes({ chico }: { chico: boolean }) {
  if (chico) {
    return (
      <div className="absolute inset-0 flex flex-col justify-center gap-4 p-5">
        <div className="grid grid-cols-2 items-start gap-x-3 gap-y-4">
          <div className="js-fuente">
            <Planilla />
          </div>
          <div className="js-fuente">
            <Cuaderno />
          </div>
          <div className="js-fuente">
            <FotosSueltas />
          </div>
          <div className="js-fuente self-center">
            <AMano />
          </div>
        </div>
        <Ia fila />
        <Resultado />
      </div>
    )
  }
  return (
    <div className="absolute inset-0 grid grid-cols-[1fr_auto_1.05fr] items-center gap-4 px-8">
      <div className="relative h-[470px]">
        <div className="js-fuente absolute top-0 left-0 w-[200px] -rotate-3">
          <Planilla />
        </div>
        <div className="js-fuente absolute top-[150px] left-[52px] w-[190px] rotate-[4deg]">
          <Cuaderno />
        </div>
        <div className="js-fuente absolute top-[285px] left-0 w-[200px] -rotate-2">
          <FotosSueltas />
        </div>
        <div className="js-fuente absolute top-[400px] left-[30px] w-[190px] rotate-[2deg]">
          <AMano />
        </div>
      </div>
      <Ia />
      <Resultado />
    </div>
  )
}

function Enlace({ claro }: { claro?: boolean }) {
  return (
    <span
      className={cn(
        "flex w-fit max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold",
        claro
          ? "bg-white/15 text-white"
          : "bg-[var(--boli-suave)] text-[var(--boli)]"
      )}
    >
      <Link2 aria-hidden="true" className="size-3 shrink-0" />
      <span className="truncate">…/t/rosa-deportes</span>
    </span>
  )
}

/** Cabecera de cada destino: la marca de la red y dónde va el enlace. */
function Red({
  logo,
  red,
  donde,
}: {
  logo: ReactNode
  red: string
  donde?: string
}) {
  return (
    <p className="mb-2 flex items-center gap-2 px-1">
      {logo}
      <span className="text-[13px] font-semibold">{red}</span>
      {donde ? (
        <span className="text-[12px] text-[var(--tinta)]/55">· {donde}</span>
      ) : null}
    </p>
  )
}

/**
 * Las cuatro redes donde va el enlace, cada una con su pantalla. El cuerpo
 * llena la altura que le da quien lo pone: 160 en grande, 164 en el celular.
 */
const DESTINOS: {
  logo: ReactNode
  red: string
  donde: string
  cuerpo: (chico: boolean) => ReactNode
}[] = [
  {
    logo: <LogoTikTok className="rounded-md bg-black p-0.5" />,
    red: "TikTok",
    donde: "en tu bio",
    cuerpo: (chico) => (
      <div
        className={cn(
          "flex h-full flex-col rounded-2xl bg-[#121212] text-white shadow-[0_24px_50px_-24px_rgb(0_0_0/0.6)]",
          chico ? "p-3" : "p-4"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-[var(--boli)] text-[13px] font-bold",
              chico ? "size-8" : "size-10"
            )}
          >
            RD
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold">
              @rosadeportes
            </span>
            <span className="block text-[11px] text-white/60">
              1.284 seguidores
            </span>
          </span>
        </div>
        <p className="mt-3 text-[12px] leading-snug text-white/80">
          Ropa deportiva para ella. Pide aquí:
        </p>
        <div className="mt-auto">
          <Enlace claro />
        </div>
      </div>
    ),
  },
  {
    logo: <LogoInstagram />,
    red: "Instagram",
    donde: "en tu historia",
    cuerpo: (chico) => (
      <div
        className={cn(
          "relative flex h-full items-end overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#2a2a33,#121216)] shadow-[0_24px_50px_-24px_rgb(0_0_0/0.6)]",
          chico ? "p-3" : "p-3.5"
        )}
      >
        <span className="absolute top-3 left-3 flex items-center gap-2">
          <span className="rounded-full bg-[conic-gradient(#feda75,#d62976,#4f5bd5,#feda75)] p-[2px]">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#121216] text-[10px] font-bold text-white">
              RD
            </span>
          </span>
          <span className="text-[11.5px] font-semibold text-white">
            rosadeportes
          </span>
        </span>
        <Foto
          clave="zapatillas"
          className={cn(
            "absolute right-2 -rotate-12",
            chico ? "top-11 w-[96px]" : "top-8 w-[120px]"
          )}
        />
        <span className="relative flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#3b5bdb]">
          <Link2 aria-hidden="true" className="size-3.5" />
          ROSA-DEPORTES
        </span>
      </div>
    ),
  },
  {
    logo: <LogoWhatsApp />,
    red: "WhatsApp",
    donde: "en tu estado",
    cuerpo: (chico) => (
      <div
        className={cn(
          "flex h-full flex-col justify-between rounded-2xl bg-[#0b141a] shadow-[0_24px_50px_-24px_rgb(0_0_0/0.6)]",
          chico ? "p-3" : "p-3.5"
        )}
      >
        <div className="overflow-hidden rounded-xl bg-[#1f2c34]">
          <div className="flex items-center gap-2.5 p-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f4f0ea]">
              <Foto clave="chamarra" className="w-8" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold text-white">
                Rosa Deportes
              </span>
              <span className="block truncate text-[10.5px] text-white/60">
                …/t/rosa-deportes
              </span>
            </span>
          </div>
        </div>
        <p className="mt-2 px-1 text-[11.5px] text-[#e9edef]">
          Llegó lo nuevo. Mira todo y pide aquí.
        </p>
      </div>
    ),
  },
  {
    logo: <LogoFacebook />,
    red: "Facebook",
    donde: "en tu página",
    cuerpo: (chico) => (
      <div
        className={cn(
          "flex h-full flex-col rounded-2xl border border-[var(--regla)] bg-white shadow-[0_24px_50px_-24px_rgb(29_28_26/0.45)]",
          chico ? "p-3" : "p-3.5"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--boli)] text-[11px] font-bold text-white">
            RD
          </span>
          <span className="truncate text-[12px] font-semibold">
            Rosa Deportes
          </span>
        </div>
        <p className="mt-2 text-[11.5px] text-[var(--tinta)]/75">
          Llegaron las zapatillas rojas.
        </p>
        <div className="mt-auto overflow-hidden rounded-lg border border-[var(--regla)]">
          <div className="flex h-10 items-center justify-center bg-[var(--papel)]">
            <Foto clave="zapatillas" className="w-16 -rotate-6" />
          </div>
          <p className="truncate px-2 py-1.5 text-[10.5px] text-[var(--tinta)]/60">
            …/t/rosa-deportes
          </p>
        </div>
      </div>
    ),
  },
]

/** El enlace de la tienda, con el botón que lo copia. */
function EnlaceParaCopiar() {
  return (
    <div className={cn(TARJETA, "js-e flex items-center gap-3 py-3 pr-3 pl-5")}>
      <Link2 aria-hidden="true" className="size-5 text-[var(--boli)]" />
      <span className="text-[15px] font-semibold whitespace-nowrap">
        …/t/rosa-deportes
      </span>
      <span className="relative ml-1 flex h-9 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--tinta)] text-[12.5px] font-semibold text-white">
        <span className="js-copiar absolute inset-0 flex items-center justify-center gap-1.5">
          <Copy aria-hidden="true" className="size-3.5" /> Copiar
        </span>
        <span className="js-copiado absolute inset-0 flex translate-y-full items-center justify-center gap-1.5 bg-[var(--boli)]">
          <Check aria-hidden="true" className="size-3.5" /> Copiado
        </span>
      </span>
    </div>
  )
}

function Linea({ d }: { d: string }) {
  return (
    <path
      d={d}
      pathLength={1}
      className="js-linea"
      fill="none"
      stroke="var(--boli)"
      strokeOpacity="0.35"
      strokeWidth="1.5"
      strokeDasharray="1"
    />
  )
}

/** 2. Compartes tu enlace: se copia y llega a cada red, con su pantalla. */
function Compartes({ chico }: { chico: boolean }) {
  if (chico) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-5">
        <EnlaceParaCopiar />
        <svg
          aria-hidden="true"
          viewBox="0 0 340 36"
          className="h-9 w-full shrink-0"
        >
          <Linea d="M170 0 Q170 18 86 36" />
          <Linea d="M170 0 Q170 18 254 36" />
        </svg>
        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-4">
          {DESTINOS.map((destino) => (
            <div key={destino.red} className="js-destino min-w-0">
              <Red logo={destino.logo} red={destino.red} />
              <div className="h-[164px]">{destino.cuerpo(true)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const lugares = [
    "top-[20px] left-[20px]",
    "top-[20px] right-[20px]",
    "bottom-[20px] left-[20px]",
    "right-[20px] bottom-[20px]",
  ]
  return (
    <div className="absolute inset-0">
      <svg
        aria-hidden="true"
        viewBox="0 0 760 520"
        className="absolute inset-0 size-full"
      >
        {[
          "M217 260 Q156 260 156 220",
          "M543 260 Q604 260 604 220",
          "M217 260 Q156 260 156 300",
          "M543 260 Q604 260 604 300",
        ].map((d) => (
          <Linea key={d} d={d} />
        ))}
      </svg>

      {DESTINOS.map((destino, i) => (
        <div key={destino.red} className={cn("absolute w-[272px]", lugares[i])}>
          <div className="js-destino">
            <Red logo={destino.logo} red={destino.red} donde={destino.donde} />
            <div className="h-[160px]">{destino.cuerpo(false)}</div>
          </div>
        </div>
      ))}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <EnlaceParaCopiar />
      </div>
    </div>
  )
}

/** 3. Los pedidos llegan a tu WhatsApp: llega, se cobra y el stock baja. */
function Llegan({ chico }: { chico: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex justify-center",
        chico ? "flex-col gap-4 p-5" : "items-center gap-8"
      )}
    >
      <div
        className={cn(
          "js-e rounded-[22px] rounded-tl-[6px] bg-[#202c33] px-5 py-4 text-[15px] leading-snug text-[#e9edef] shadow-[0_30px_60px_-28px_rgb(0_0_0/0.6)]",
          !chico && "w-[320px]"
        )}
      >
        <p className="flex items-center gap-2 text-[12px] text-white/60">
          <MessageCircle aria-hidden="true" className="size-3.5" /> Carla ·
          WhatsApp
        </p>
        <p className="mt-2">
          Hola Rosa Deportes, quiero hacer este pedido (#152):
        </p>
        <p className="mt-2">· 1× Zapatillas rojas (Talla 38) — Bs 450</p>
        <p className="mt-1.5 font-semibold">Total: Bs 450</p>
      </div>

      <div className={cn("flex flex-col gap-3", !chico && "w-[290px]")}>
        <div className={cn(TARJETA, "js-e p-4")}>
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold">Pedido #152</p>
            <p className={cn(estilos.cifras, "text-[14px] font-semibold")}>
              Bs 450
            </p>
          </div>
          <span className="relative mt-3 flex h-10 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--tinta)] text-[13px] font-semibold">
            <span className="js-pagar absolute inset-0 flex items-center justify-center">
              Marcar como pagado
            </span>
            <span className="js-pagado absolute inset-0 flex translate-y-full items-center justify-center gap-1.5 bg-[var(--tinta)] text-white">
              <Check
                aria-hidden="true"
                className="size-4 text-[var(--boli-claro)]"
              />{" "}
              Pagado
            </span>
          </span>
        </div>
        <div className={cn(TARJETA, "js-e flex items-center gap-3 p-4")}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--papel)]">
            <Foto clave="zapatillas" className="w-[86%] -rotate-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">Zapatillas rojas</p>
            <p className="js-aviso flex items-center gap-1.5 text-[12.5px] text-[var(--boli)]">
              <TriangleAlert aria-hidden="true" className="size-3.5" /> Quedan 2
            </p>
          </div>
          <div className="relative h-9 w-7 overflow-hidden text-right">
            <span
              className={cn(
                estilos.titular,
                "js-tres absolute inset-0 text-[30px] leading-9"
              )}
            >
              3
            </span>
            <span
              className={cn(
                estilos.titular,
                "js-dos absolute inset-0 translate-y-full text-[30px] leading-9 text-[var(--boli)]"
              )}
            >
              2
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ESCENAS = [Subes, Compartes, Llegan]

/**
 * "Cómo funciona", interactivo: tres pestañas que avanzan solas —el relleno
 * color de la pestaña es el tiempo que queda— y se pueden tocar. Debajo, el
 * paso elegido en grande; a la derecha, su escena se arma pieza por pieza.
 */
export function ComoFunciona() {
  const raiz = useRef<HTMLElement>(null)
  const { actual, elegir, fijada } = useRotacion(raiz, PASOS.length, CADA)
  const caja = useRef<HTMLDivElement>(null)
  const anchoDeCaja = useAncho(caja)
  // En una caja angosta, la escena se dibuja en columna en vez de achicarse.
  const chico = anchoDeCaja > 0 && anchoDeCaja < 640
  const tamano = chico ? ESCENA_ANGOSTA : ESCENA_GRANDE
  const escala = anchoDeCaja ? Math.min(1.15, anchoDeCaja / tamano.ancho) : 1
  const paso = PASOS[actual]

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        gsap.from(raiz.current!.querySelectorAll(".js-sube"), {
          y: 30,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.07,
          scrollTrigger: { trigger: raiz.current, start: "top 78%" },
        })
      })
    },
    { scope: raiz }
  )

  // Cada vez que cambia el paso, su escena se arma de nuevo.
  useGSAP(
    () => {
      if (!window.matchMedia(CON_MOVIMIENTO).matches) return
      const raizEl = raiz.current!
      gsap.set(raizEl.querySelectorAll("[data-barra]"), { scaleX: 0 })
      gsap.fromTo(
        raizEl.querySelector(`[data-barra="${actual}"]`),
        { scaleX: 0 },
        { scaleX: 1, duration: fijada ? 0.4 : CADA / 1000, ease: "none" }
      )
      gsap.fromTo(
        raizEl.querySelectorAll(".js-texto-paso"),
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "expo.out", stagger: 0.06 }
      )

      const escena = raizEl.querySelector(`[data-escena="${actual}"]`)
      if (!escena) return
      const q = gsap.utils.selector(escena)
      const tl = gsap.timeline()
      if (actual === 0) {
        const cuenta = q(".js-cuenta")[0]
        const numero = { n: 0 }
        tl.from(q(".js-fuente"), {
          x: -40,
          opacity: 0,
          duration: 0.6,
          ease: "expo.out",
          stagger: 0.12,
        })
          .from(
            q(".js-ia"),
            { scale: 0.4, opacity: 0, duration: 0.5, ease: "back.out(2)" },
            0.5
          )
          .from(
            q(".js-resultado"),
            { x: 30, opacity: 0, duration: 0.6, ease: "expo.out" },
            1.0
          )
          .from(
            q(".js-leido"),
            { y: 10, opacity: 0, duration: 0.35, stagger: 0.12 },
            1.2
          )
          .to(
            numero,
            {
              n: 5,
              duration: 1,
              ease: "power2.out",
              onUpdate: () => {
                if (cuenta) cuenta.textContent = String(Math.round(numero.n))
              },
            },
            1.5
          )
      }
      if (actual === 1) {
        tl.from(q(".js-e"), {
          y: 40,
          opacity: 0,
          scale: 0.96,
          duration: 0.7,
          ease: "expo.out",
        })
          .fromTo(
            q(".js-copiar"),
            { yPercent: 0 },
            { yPercent: -100, duration: 0.25 },
            0.6
          )
          .fromTo(
            q(".js-copiado"),
            { yPercent: 0 },
            { yPercent: -100, duration: 0.25 },
            0.6
          )
          .fromTo(
            q(".js-linea"),
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 0.6, stagger: 0.08 },
            0.8
          )
          .from(
            q(".js-destino"),
            {
              scale: 0.6,
              opacity: 0,
              duration: 0.6,
              ease: "back.out(1.8)",
              stagger: 0.1,
            },
            1
          )
      }
      if (actual === 2) {
        tl.from(q(".js-e"), {
          y: 40,
          opacity: 0,
          scale: 0.96,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.08,
        })
          .fromTo(
            q(".js-pagar"),
            { yPercent: 0 },
            { yPercent: -100, duration: 0.25 },
            1.1
          )
          .fromTo(
            q(".js-pagado"),
            { yPercent: 0 },
            { yPercent: -100, duration: 0.25 },
            1.1
          )
          .fromTo(
            q(".js-tres"),
            { yPercent: 0 },
            { yPercent: -100, duration: 0.3 },
            1.6
          )
          .fromTo(
            q(".js-dos"),
            { yPercent: 0 },
            { yPercent: -100, duration: 0.3 },
            1.6
          )
          .from(q(".js-aviso"), { opacity: 0, x: -8, duration: 0.3 }, 1.8)
      }
    },
    { scope: raiz, dependencies: [actual, chico], revertOnUpdate: true }
  )

  return (
    <section
      ref={raiz}
      id="como-funciona"
      className="scroll-mt-20 border-y border-[var(--regla)] bg-[var(--hoja)]"
    >
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-12 lg:px-10 lg:py-24">
        <div>
          <p className="js-sube text-[13px] font-semibold tracking-[0.1em] text-[var(--boli)] uppercase">
            Cómo funciona
          </p>
          <h2
            className={cn(
              estilos.titular,
              "js-sube mt-4 max-w-[16ch] text-[clamp(2.1rem,3.6vw,3.3rem)]"
            )}
          >
            Tres pasos y tu tienda está andando.
          </h2>

          <div
            role="tablist"
            aria-label="Pasos"
            className="js-sube mt-10 inline-flex rounded-full border border-[var(--regla)] bg-white p-1"
          >
            {PASOS.map((p, i) => (
              <button
                key={p.n}
                type="button"
                role="tab"
                aria-selected={i === actual}
                onClick={() => elegir(i)}
                className={cn(
                  "relative overflow-hidden rounded-full px-3.5 py-2 text-[14px] font-semibold whitespace-nowrap transition-colors duration-300 sm:px-4 sm:text-[14.5px]",
                  i === actual
                    ? "text-white"
                    : "text-[var(--tinta)]/50 hover:text-[var(--tinta)]"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 rounded-full bg-[var(--tinta)] transition-opacity duration-300",
                    i === actual ? "opacity-100" : "opacity-0"
                  )}
                />
                <span
                  aria-hidden="true"
                  data-barra={i}
                  className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 rounded-full bg-[var(--boli)]"
                />
                <span className="relative">
                  {i + 1} · {p.corto}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 min-h-[12rem]" role="tabpanel">
            <h3
              className={cn(
                estilos.titular,
                "js-texto-paso text-[clamp(1.7rem,2.4vw,2.2rem)]"
              )}
            >
              {paso.titulo}
            </h3>
            <p className="js-texto-paso mt-3 max-w-[42ch] text-[17px] leading-relaxed text-[var(--tinta)]/68">
              {paso.detalle}
            </p>
          </div>
        </div>

        <div
          ref={caja}
          className="relative"
          style={{ height: tamano.alto * escala }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left rounded-[32px] border border-[var(--regla)] bg-[radial-gradient(80%_70%_at_50%_45%,#ffffff,var(--papel)_75%)]"
            style={{
              width: tamano.ancho,
              height: tamano.alto,
              transform: `scale(${escala})`,
            }}
          >
            {ESCENAS.map((Escena, i) => (
              <div
                key={i}
                data-escena={i}
                aria-hidden={i !== actual}
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  i === actual ? "opacity-100" : "pointer-events-none opacity-0"
                )}
              >
                <Escena key={chico ? "angosta" : "grande"} chico={chico} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
