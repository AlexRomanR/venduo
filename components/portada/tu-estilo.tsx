"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import Image from "next/image"
import { ArrowRight, FileText, MessageCircle, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { capaDelFundido, useAnterior } from "@/components/portada/rotacion"
import { PLANTILLAS, type ClavePlantilla } from "@/lib/plantillas"
import { familiaDe, type ClaveFuente } from "@/lib/plantillas/fuentes"
import { producto } from "@/components/portada/datos"
import estilos from "@/components/portada/portada.module.css"
import { prepararTrazos, Subrayado } from "@/components/portada/trazos"
import { CON_MOVIMIENTO, gsap, useGSAP } from "@/components/portada/gsap"

/** Las plantillas que se ofrecen hoy, en el orden en que se muestran. */
const CLAVES: ClavePlantilla[] = [
  "fashion",
  "perfume",
  "calle",
  "atelier",
  "pisada",
  "formula",
  "bazar",
]

const RADIOS = { recto: "3px", suave: "10px", redondo: "18px" } as const

/** Los colores, la letra y la forma de una plantilla, como variables CSS. */
function variablesDe(clave: ClavePlantilla): CSSProperties {
  const a = PLANTILLAS[clave].apariencia
  return {
    "--t-papel": a.colores.papel,
    "--t-tinta": a.colores.tinta,
    "--t-senal": a.colores.senal,
    "--t-titular": familiaDe(a.tipografia.titular as ClaveFuente),
    "--t-cuerpo": familiaDe(a.tipografia.cuerpo as ClaveFuente),
    "--t-peso": String(a.tipografia.pesoTitular),
    "--t-mayus": a.tipografia.mayusculas ? "uppercase" : "none",
    "--t-radio": RADIOS[(a.forma?.radio ?? "suave") as keyof typeof RADIOS],
  } as CSSProperties
}

/** Un titular con la letra de la plantilla elegida. */
const TITULAR =
  "[font-family:var(--t-titular)] [font-weight:var(--t-peso)] [text-transform:var(--t-mayus)] leading-[0.95] tracking-[-0.01em]"
const TRANSICION =
  "transition-[background-color,color,border-color] duration-500"

function Foto({ clave, className }: { clave: string; className?: string }) {
  const p = producto(clave)
  return (
    <Image
      src={p.foto}
      alt=""
      width={p.ancho}
      height={p.alto}
      sizes="160px"
      className={cn("h-auto object-contain", className)}
    />
  )
}

/**
 * La tienda de cada plantilla, en el celular: las capturas reales de
 * `public/plantillas/celular`, una encima de otra, y se ve la elegida. Así se
 * nota que cambia el diseño entero, no solo el color.
 */
function Tienda({ actual }: { actual: number }) {
  const anterior = useAnterior(actual)
  return (
    <div className="relative aspect-[1/2] w-full rounded-[2.4rem] bg-[#121215] p-[3.4%] shadow-[0_50px_90px_-40px_rgb(29_28_26/0.6),0_0_0_1px_rgb(29_28_26/0.08)]">
      <div className="relative h-full overflow-hidden rounded-[2rem] bg-white">
        {CLAVES.map((c, i) => (
          <Image
            key={c}
            src={`/plantillas/celular/${c}.webp`}
            alt={
              i === actual
                ? `Una tienda con la plantilla ${PLANTILLAS[c].nombre}`
                : ""
            }
            fill
            sizes="300px"
            className={cn(
              "object-cover object-top",
              capaDelFundido(i, actual, anterior)
            )}
          />
        ))}
        <span className="absolute top-[1.6%] left-1/2 h-[3%] w-[30%] -translate-x-1/2 rounded-full bg-[#121215]" />
      </div>
    </div>
  )
}

type DisenoDeCatalogo = "grilla" | "lista" | "destacado" | "revista"
type DisenoDePublicacion = "foto" | "color" | "oferta"

/** Cada plantilla arma su catálogo y su imagen para redes a su manera. */
const DISENOS: Record<
  ClavePlantilla,
  { catalogo: DisenoDeCatalogo; publicacion: DisenoDePublicacion }
> = {
  clasica: { catalogo: "grilla", publicacion: "color" },
  fashion: { catalogo: "destacado", publicacion: "foto" },
  perfume: { catalogo: "lista", publicacion: "color" },
  calle: { catalogo: "grilla", publicacion: "oferta" },
  atelier: { catalogo: "revista", publicacion: "color" },
  pisada: { catalogo: "destacado", publicacion: "foto" },
  formula: { catalogo: "lista", publicacion: "color" },
  bazar: { catalogo: "grilla", publicacion: "oferta" },
}

const PRODUCTOS_DEL_CATALOGO = ["zapatillas", "perfume", "labial", "cartera"]

function Catalogo({ diseno }: { diseno: DisenoDeCatalogo }) {
  return (
    <div className="relative">
      <div
        className={cn(
          "aspect-[1/1.414] w-full overflow-hidden rounded-[4px] bg-[var(--t-papel)] p-5 text-[var(--t-tinta)] shadow-[0_30px_60px_-30px_rgb(29_28_26/0.5)]",
          TRANSICION
        )}
      >
        <p className="text-[9px] tracking-[0.18em] uppercase opacity-60">
          Rosa Deportes · catálogo
        </p>

        {diseno === "revista" ? (
          <>
            <p
              className={cn(TITULAR, "js-titular-tema mt-2 text-[40px] italic")}
            >
              Lo nuevo
            </p>
            <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-[var(--t-radio)] bg-[var(--t-tinta)]/7">
              <Foto clave="cartera" className="w-[70%]" />
            </div>
            <div className="mt-3 space-y-1.5">
              {PRODUCTOS_DEL_CATALOGO.slice(0, 3).map((clave) => {
                const p = producto(clave)
                return (
                  <p
                    key={clave}
                    className="flex items-baseline gap-2 text-[10px]"
                  >
                    <span className="font-medium">{p.nombre}</span>
                    <span className="flex-1 border-b border-dotted border-current opacity-30" />
                    <span
                      className={cn(
                        "font-bold text-[var(--t-senal)]",
                        TRANSICION
                      )}
                    >
                      {p.precio}
                    </span>
                  </p>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <p className={cn(TITULAR, "js-titular-tema mt-2 text-[30px]")}>
              Lo nuevo
            </p>
            <div
              className={cn(
                "mt-2 h-[3px] w-10 bg-[var(--t-senal)]",
                TRANSICION
              )}
            />
          </>
        )}

        {diseno === "grilla" ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {PRODUCTOS_DEL_CATALOGO.map((clave) => {
              const p = producto(clave)
              return (
                <div key={clave}>
                  <div className="flex aspect-square items-center justify-center rounded-[var(--t-radio)] border-2 border-[var(--t-tinta)]/80 bg-white p-2">
                    <Foto clave={clave} className="max-h-full w-[80%]" />
                  </div>
                  <p className="mt-1 truncate text-[9.5px] font-medium">
                    {p.nombre}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] font-bold text-[var(--t-senal)]",
                      TRANSICION
                    )}
                  >
                    {p.precio}
                  </p>
                </div>
              )
            })}
          </div>
        ) : null}

        {diseno === "lista" ? (
          <div className="mt-4">
            {PRODUCTOS_DEL_CATALOGO.map((clave) => {
              const p = producto(clave)
              return (
                <div
                  key={clave}
                  className="flex items-center gap-3 border-b border-[var(--t-tinta)]/10 py-2 last:border-b-0"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--t-tinta)]/7">
                    <Foto clave={clave} className="max-h-8 w-8" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10.5px] font-medium">
                      {p.nombre}
                    </span>
                    <span className="block text-[9px] opacity-60">
                      {p.rubro}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-[10.5px] font-bold text-[var(--t-senal)]",
                      TRANSICION
                    )}
                  >
                    {p.precio}
                  </span>
                </div>
              )
            })}
          </div>
        ) : null}

        {diseno === "destacado" ? (
          <>
            <div className="relative mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--t-radio)] bg-[var(--t-tinta)]">
              <Foto clave="zapatillas" className="w-[78%] -rotate-12" />
              <span
                className={cn(
                  "absolute bottom-2 left-2 rounded-[var(--t-radio)] bg-[var(--t-senal)] px-2 py-0.5 text-[10px] font-bold text-white",
                  TRANSICION
                )}
              >
                Bs 450
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["perfume", "labial", "cartera"].map((clave) => (
                <div
                  key={clave}
                  className="flex aspect-square items-center justify-center rounded-[var(--t-radio)] bg-[var(--t-tinta)]/7 p-1.5"
                >
                  <Foto clave={clave} className="max-h-full w-[80%]" />
                </div>
              ))}
            </div>
          </>
        ) : null}

        <p className="mt-3 text-[9px] opacity-60">
          Pide por WhatsApp · 70000000
        </p>
      </div>
      <span className="absolute -right-4 -bottom-4 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-semibold shadow-[0_14px_30px_-12px_rgb(29_28_26/0.45)]">
        <FileText aria-hidden="true" className="size-3.5 text-[var(--boli)]" />
        Editar en Canva
      </span>
    </div>
  )
}

function Publicacion({ diseno }: { diseno: DisenoDePublicacion }) {
  const p = producto("zapatillas")
  return (
    <div className="relative">
      <div
        className={cn(
          "relative flex aspect-[9/16] w-full flex-col overflow-hidden rounded-[14px] p-4 shadow-[0_30px_60px_-28px_rgb(29_28_26/0.55)]",
          diseno === "foto" && "bg-[var(--t-tinta)] text-white",
          diseno === "color" && "bg-[var(--t-senal)] text-white",
          diseno === "oferta" && "bg-[var(--t-papel)] text-[var(--t-tinta)]",
          TRANSICION
        )}
      >
        <p className="text-[9px] tracking-[0.18em] uppercase opacity-80">
          Rosa Deportes
        </p>

        {diseno === "foto" ? (
          <>
            <div className="-mx-4 mt-2 flex flex-1 items-center justify-center bg-white/6">
              <Foto
                clave="zapatillas"
                className="w-[110%] -rotate-12 drop-shadow-[0_18px_18px_rgb(0_0_0/0.5)]"
              />
            </div>
            <p className={cn(TITULAR, "js-titular-tema mt-3 text-[24px]")}>
              {p.nombre}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[15px] font-bold">{p.precio}</span>
              <span
                className={cn(
                  "rounded-[var(--t-radio)] bg-[var(--t-senal)] px-2.5 py-1 text-[9.5px] font-semibold",
                  TRANSICION
                )}
              >
                Pide por WhatsApp
              </span>
            </div>
          </>
        ) : null}

        {diseno === "color" ? (
          <>
            <p className={cn(TITULAR, "js-titular-tema mt-1.5 text-[26px]")}>
              {p.nombre}
            </p>
            <div className="flex flex-1 items-center justify-center">
              <Foto
                clave="zapatillas"
                className="w-[96%] -rotate-12 drop-shadow-[0_14px_16px_rgb(0_0_0/0.35)]"
              />
            </div>
            <div className="flex items-end justify-between">
              <span className={cn(TITULAR, "text-[24px]")}>{p.precio}</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[9.5px] font-semibold text-[var(--t-tinta)]">
                Pide por WhatsApp
              </span>
            </div>
          </>
        ) : null}

        {diseno === "oferta" ? (
          <>
            <span
              className={cn(
                TITULAR,
                "mt-3 w-fit -rotate-6 rounded-[var(--t-radio)] bg-[var(--t-senal)] px-3 py-1.5 text-[30px] text-white",
                TRANSICION
              )}
            >
              −25%
            </span>
            <div className="flex flex-1 items-center justify-center">
              <Foto clave="zapatillas" className="w-[96%] -rotate-12" />
            </div>
            <p className={cn(TITULAR, "js-titular-tema text-[20px]")}>
              {p.nombre}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[11px] line-through opacity-50">
                Bs 600
              </span>
              <span
                className={cn(
                  TITULAR,
                  "text-[26px] text-[var(--t-senal)]",
                  TRANSICION
                )}
              >
                {p.precio}
              </span>
            </p>
          </>
        ) : null}
      </div>
      <p className="absolute top-[calc(100%+12px)] left-[18%] w-max max-w-[13rem] rounded-2xl rounded-tl-[4px] bg-white px-3 py-2 text-[11.5px] leading-snug shadow-[0_14px_30px_-12px_rgb(29_28_26/0.45)]">
        Llegaron las zapatillas rojas, a Bs 450. Pídelas aquí.
      </p>
    </div>
  )
}

const VENTAS = [
  { nombre: "Zapatillas rojas", valor: 92 },
  { nombre: "Chamarra de jean", valor: 64 },
  { nombre: "Perfume Energy", valor: 48 },
  { nombre: "Audífonos", valor: 31 },
]

function Estadisticas() {
  return (
    <div className="rounded-2xl border border-[var(--regla)] bg-white p-4 shadow-[0_30px_60px_-30px_rgb(29_28_26/0.45)]">
      <p className="ml-auto w-fit rounded-2xl rounded-br-[4px] bg-[var(--boli)] px-3.5 py-2 text-[12.5px] text-white">
        ¿Qué se vendió más este mes?
      </p>
      <div className="mt-3 space-y-2">
        {VENTAS.map((venta, i) => (
          <div key={venta.nombre} className="flex items-center gap-2.5">
            <span className="w-[6.5rem] shrink-0 truncate text-[11px] text-[var(--tinta)]/65">
              {venta.nombre}
            </span>
            <span className="h-3.5 flex-1 overflow-hidden rounded-full bg-[var(--tinta)]/6">
              <span
                className={cn(
                  "js-barra-tema block h-full origin-left rounded-full",
                  i === 0 ? "bg-[var(--t-senal)]" : "bg-[var(--t-senal)]/35",
                  TRANSICION
                )}
                style={{ width: `${venta.valor}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Las cuatro piezas de la franja del celular, en orden. */
const PIEZAS_DEL_CELULAR = [
  "Tu tienda",
  "Catálogo en PDF",
  "Publicar en redes",
  "Estadísticas",
]

/**
 * Lo que hace falta para avisar que una franja se desliza: si hay más a cada
 * lado, y cuál de sus hijos está más a la vista.
 */
function useFranja() {
  const ref = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState({
    antes: false,
    despues: false,
    cual: 0,
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const resto = el.scrollWidth - el.clientWidth
      const hijos = [...el.children] as HTMLElement[]
      let cual = 0
      hijos.forEach((hijo, i) => {
        if (hijo.offsetLeft - el.offsetLeft <= el.scrollLeft + 24) cual = i
      })
      if (el.scrollLeft >= resto - 4) cual = hijos.length - 1
      setEstado({
        antes: el.scrollLeft > 4,
        despues: el.scrollLeft < resto - 4,
        cual,
      })
    }
    medir()
    el.addEventListener("scroll", medir, { passive: true })
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => {
      el.removeEventListener("scroll", medir)
      observador.disconnect()
    }
  }, [])

  /** Se esfuman los bordes donde queda algo por ver. */
  const mascara = `linear-gradient(to right, ${estado.antes ? "transparent, #000 32px" : "#000, #000"}, ${estado.despues ? "#000 calc(100% - 48px), transparent" : "#000, #000"})`

  const irA = (i: number) => {
    const el = ref.current
    const hijo = el?.children[i] as HTMLElement | undefined
    if (!el || !hijo) return
    el.scrollTo({
      left: hijo.offsetLeft - el.offsetLeft - 24,
      behavior: "smooth",
    })
  }

  return { ref, ...estado, mascara, irA }
}

/**
 * "Por qué no es solo una tienda online": lo que Venduo arma solo —la tienda
 * en el editor, el catálogo en PDF, la imagen para redes y las estadísticas—
 * flotando en un escenario y vestido con la plantilla elegida. Las siete
 * plantillas rotan solas mientras la sección está a la vista; tocar una la deja.
 */
export function PorQue() {
  const raiz = useRef<HTMLElement>(null)
  const [actual, setActual] = useState(0)
  const [fijada, setFijada] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const observador = new IntersectionObserver(
      ([entrada]) => setVisible(entrada.isIntersecting),
      { threshold: 0.35 }
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    if (fijada || !visible) return
    if (!window.matchMedia(CON_MOVIMIENTO).matches) return
    const id = window.setInterval(
      () => setActual((i) => (i + 1) % CLAVES.length),
      2800
    )
    return () => window.clearInterval(id)
  }, [fijada, visible])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        const q = gsap.utils.selector(raiz)
        const trazos = prepararTrazos(raiz.current!)
        gsap.to(trazos, {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: raiz.current, start: "top 70%" },
        })
        gsap.from(q(".js-sube"), {
          y: 30,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.07,
          scrollTrigger: { trigger: raiz.current, start: "top 78%" },
        })
        gsap.from(q(".js-pieza"), {
          y: 120,
          opacity: 0,
          rotate: (i) => [-6, 5, -8, 6][i % 4],
          duration: 1.3,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: q(".js-escenario")[0], start: "top 75%" },
        })
        q(".js-vaiven").forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 ? 10 : -10,
            rotate: i % 2 ? 1.2 : -1.2,
            duration: 3 + (i % 3) * 0.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          })
        })
        q(".js-profundo").forEach((el) => {
          const vel = Number(el.dataset.vel ?? 1)
          gsap.fromTo(
            el,
            { y: 70 * vel },
            {
              y: -70 * vel,
              ease: "none",
              scrollTrigger: {
                trigger: raiz.current,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          )
        })
      })
    },
    { scope: raiz }
  )

  // Al cambiar de plantilla, los titulares se reacomodan con un golpe suave.
  useGSAP(
    () => {
      if (!window.matchMedia(CON_MOVIMIENTO).matches) return
      gsap.fromTo(
        raiz.current!.querySelectorAll(".js-titular-tema"),
        { y: 8, opacity: 0.4 },
        { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }
      )
      gsap.fromTo(
        raiz.current!.querySelectorAll(".js-barra-tema"),
        { scaleX: 0.2 },
        { scaleX: 1, duration: 0.8, ease: "expo.out", stagger: 0.05 }
      )
    },
    { scope: raiz, dependencies: [actual] }
  )

  const clave = CLAVES[actual]
  const fichas = useFranja()
  const piezas = useFranja()

  return (
    <section
      ref={raiz}
      id="por-que"
      className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16 lg:px-10 lg:py-24"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="js-sube text-[13px] font-semibold tracking-[0.1em] text-[var(--boli)] uppercase">
            Por qué no es solo una tienda online
          </p>
          <h2
            className={cn(
              estilos.titular,
              "js-sube mt-4 max-w-[20ch] text-[clamp(2.1rem,3.6vw,3.3rem)]"
            )}
          >
            Una tienda muestra tus productos.{" "}
            <span className="relative inline-block sm:whitespace-nowrap">
              Venduo maneja tu negocio.
              <Subrayado className="absolute -bottom-[0.16em] left-0 h-[0.26em] w-full" />
            </span>
          </h2>
        </div>
        <p className="js-sube max-w-[40ch] text-[17.5px] leading-relaxed text-[var(--tinta)]/65">
          Y todo lo que arma lleva tu estilo. Elige una de las {CLAVES.length}{" "}
          plantillas de tienda y mira cómo cambia todo a la vez.
        </p>
      </div>

      <div
        ref={fichas.ref}
        role="radiogroup"
        aria-label="Plantilla"
        className="js-sube mt-10 flex [scrollbar-width:none] gap-2 overflow-x-auto pb-2"
        style={{ maskImage: fichas.mascara }}
      >
        {CLAVES.map((c, i) => {
          const plantilla = PLANTILLAS[c]
          const elegida = i === actual
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={elegida}
              onClick={() => {
                setActual(i)
                setFijada(true)
              }}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-full border py-2 pr-4 pl-2 text-[14.5px] font-medium transition-[background-color,border-color,color,box-shadow] duration-300",
                elegida
                  ? "border-[var(--tinta)] bg-[var(--tinta)] text-white shadow-[0_10px_24px_-12px_rgb(29_28_26/0.6)]"
                  : "border-[var(--regla)] bg-white hover:border-[var(--tinta)]/30"
              )}
            >
              <span className="flex -space-x-1.5">
                {[
                  plantilla.apariencia.colores.papel,
                  plantilla.apariencia.colores.senal,
                ].map((color) => (
                  <span
                    key={color}
                    className="size-5 rounded-full border border-black/10"
                    style={{ background: color }}
                  />
                ))}
              </span>
              {plantilla.nombre}
            </button>
          )
        })}
      </div>

      <div
        ref={piezas.ref}
        className="-mx-6 mt-6 flex snap-x snap-mandatory scroll-px-6 [scrollbar-width:none] gap-5 overflow-x-auto px-6 pt-2 pb-6 lg:hidden"
        style={{ ...variablesDe(clave), maskImage: piezas.mascara }}
      >
        {[
          {
            rotulo: "Tu tienda · editor con IA",
            ancho: "w-[190px]",
            pieza: <Tienda actual={actual} />,
          },
          {
            rotulo: "Catálogo en PDF",
            ancho: "w-[230px]",
            pieza: <Catalogo diseno={DISENOS[clave].catalogo} />,
          },
          {
            rotulo: "Publicar en redes",
            ancho: "w-[220px]",
            pieza: <Publicacion diseno={DISENOS[clave].publicacion} />,
          },
          {
            rotulo: "Estadísticas en tus palabras",
            ancho: "w-[270px]",
            pieza: <Estadisticas />,
          },
        ].map(({ rotulo, ancho, pieza }) => (
          <div key={rotulo} className={cn("shrink-0 snap-start", ancho)}>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--tinta)]/55 uppercase">
              {rotulo}
            </p>
            {pieza}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 lg:hidden">
        <div className="flex items-center">
          {PIEZAS_DEL_CELULAR.map((nombre, i) => (
            <button
              key={nombre}
              type="button"
              onClick={() => piezas.irA(i)}
              aria-label={nombre}
              aria-current={i === piezas.cual}
              className="-mx-1.5 flex size-11 items-center justify-center"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-[width,background-color] duration-300",
                  i === piezas.cual
                    ? "w-6 bg-[var(--boli)]"
                    : "w-2 bg-[var(--tinta)]/20"
                )}
              />
            </button>
          ))}
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-medium text-[var(--tinta)]/60 transition-opacity duration-300",
            piezas.despues ? "opacity-100" : "opacity-0"
          )}
        >
          Desliza
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[13px] text-[var(--tinta)]/55 lg:hidden">
        <MessageCircle aria-hidden="true" className="size-3.5" />
        Rosa Deportes es una tienda de ejemplo.
      </p>

      <div
        className="js-escenario relative mt-8 hidden h-[640px] rounded-[32px] border border-[var(--regla)] bg-[radial-gradient(90%_70%_at_50%_40%,#ffffff,var(--hoja)_70%)] lg:block"
        style={variablesDe(clave)}
      >
        <div className="absolute top-[3%] left-[37%] w-[23%]">
          <div className="js-profundo" data-vel={0.5}>
            <p className="mb-3 pl-6 text-[12px] font-semibold tracking-[0.08em] text-[var(--tinta)]/45 uppercase">
              Tu tienda · editor con IA
            </p>
            <div className="js-pieza">
              <div className="js-vaiven">
                <Tienda actual={actual} />
                <span className="absolute top-[62%] -left-[34%] z-30 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-medium shadow-[0_14px_30px_-12px_rgb(29_28_26/0.45)]">
                  <Sparkles
                    aria-hidden="true"
                    className="size-3.5 text-[var(--boli)]"
                  />
                  «hazla más elegante»
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-[8%] right-[5%] w-[22%]">
          <div className="js-profundo" data-vel={1}>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--tinta)]/45 uppercase">
              Catálogo en PDF
            </p>
            <div className="js-pieza">
              <div className="js-vaiven" style={{ rotate: "4deg" }}>
                <Catalogo diseno={DISENOS[clave].catalogo} />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-[9%] left-[6%] w-[19%]">
          <div className="js-profundo" data-vel={1.3}>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--tinta)]/45 uppercase">
              Publicar en redes
            </p>
            <div className="js-pieza">
              <div className="js-vaiven" style={{ rotate: "-5deg" }}>
                <Publicacion diseno={DISENOS[clave].publicacion} />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-[19%] bottom-[5%] w-[29%]">
          <div className="js-profundo flex flex-col-reverse" data-vel={0.8}>
            <p className="mt-3 text-right text-[12px] font-semibold tracking-[0.08em] text-[var(--tinta)]/55 uppercase">
              Estadísticas en tus palabras
            </p>
            <div className="js-pieza">
              <div className="js-vaiven" style={{ rotate: "-2deg" }}>
                <Estadisticas />
              </div>
            </div>
          </div>
        </div>

        <p className="absolute bottom-6 left-8 flex items-center gap-2 text-[13px] text-[var(--tinta)]/45">
          <MessageCircle aria-hidden="true" className="size-3.5" />
          Rosa Deportes es una tienda de ejemplo
        </p>
      </div>
    </section>
  )
}
