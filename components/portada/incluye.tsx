"use client"

import { useRef, useState, type ReactNode, type TouchEvent } from "react"
import Image from "next/image"
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as Imagen,
  MessageCircle,
  NotebookPen,
  Sheet,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { INCLUYE, producto } from "@/components/portada/datos"
import estilos from "@/components/portada/portada.module.css"
import { useRotacion } from "@/components/portada/rotacion"
import {
  CON_MOVIMIENTO,
  gsap,
  ScrollTrigger,
  useGSAP,
} from "@/components/portada/gsap"

/** Las cinco apps de antes, sueltas a los lados del celular. */
const APPS: { icono: LucideIcon; nombre: string; className: string }[] = [
  { icono: NotebookPen, nombre: "Cuaderno", className: "top-[4%] left-[10%]" },
  { icono: Sheet, nombre: "Planilla", className: "top-[8%] right-[12%]" },
  { icono: MessageCircle, nombre: "Chats", className: "top-[42%] left-[22%]" },
  { icono: Imagen, nombre: "Diseños", className: "bottom-[4%] left-[6%]" },
  {
    icono: Calculator,
    nombre: "Calculadora",
    className: "bottom-[12%] right-[18%]",
  },
]

function Mini({ clave, className }: { clave: string; className?: string }) {
  const p = producto(clave)
  return (
    <Image
      src={p.foto}
      alt=""
      width={p.ancho}
      height={p.alto}
      sizes="64px"
      className={cn("h-auto object-contain", className)}
    />
  )
}

/** La pantalla de la app de Venduo, con su título. */
function Pantalla({
  titulo,
  children,
}: {
  titulo: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col bg-[#f7f5f0] px-3.5 pt-9 pb-4">
      <p className="text-[10px] text-[var(--tinta)]/45">Rosa Deportes</p>
      <p className={cn(estilos.titular, "text-[20px]")}>{titulo}</p>
      <div className="mt-3 flex flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}

const FILA =
  "flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[11px]"

const PANTALLAS: ReactNode[] = [
  <div key="tienda" className="relative h-full">
    <Image
      src="/plantillas/celular/fashion.webp"
      alt=""
      fill
      sizes="260px"
      className="object-cover object-top"
    />
  </div>,
  <Pantalla key="stock" titulo="Productos">
    {[
      ["zapatillas", "Zapatillas rojas", "2"],
      ["chamarra", "Chamarra de jean", "4"],
      ["perfume", "Perfume Energy", "6"],
      ["labial", "Labial dorado", "12"],
    ].map(([clave, nombre, stock], i) => (
      <div key={clave} className={FILA}>
        <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--papel)]">
          <Mini clave={clave} className="w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{nombre}</span>
          {i === 0 ? (
            <span className="flex items-center gap-1 text-[10px] text-[var(--boli)]">
              <TriangleAlert aria-hidden="true" className="size-2.5" /> Quedan 2
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            estilos.titular,
            estilos.cifras,
            "text-[16px]",
            i === 0 && "text-[var(--boli)]"
          )}
        >
          {stock}
        </span>
      </div>
    ))}
  </Pantalla>,
  <Pantalla key="pedidos" titulo="Pedidos">
    {[
      ["#152", "1× Zapatillas rojas", "Bs 450", "Pendiente"],
      ["#151", "2× Labial dorado", "Bs 240", "Pagado"],
      ["#150", "Chamarra de jean y 1 más", "Bs 390", "Pagado"],
    ].map(([numero, quien, total, estado], i) => (
      <div key={numero} className={FILA}>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            {numero} · {quien}
          </span>
          <span className="block text-[10px] text-[var(--tinta)]/50">
            {total}
          </span>
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9.5px] font-semibold",
            i === 0
              ? "bg-[var(--boli)] text-white"
              : "bg-[var(--papel)] text-[var(--tinta)]/60"
          )}
        >
          {estado}
        </span>
      </div>
    ))}
    <div className="mt-auto rounded-2xl rounded-tl-[4px] bg-[#202c33] px-3 py-2 text-[10.5px] leading-snug text-[#e9edef]">
      Hola Rosa Deportes, quiero hacer este pedido (#152):
      <br />· 1× Zapatillas rojas (Talla 38) — Bs 450
    </div>
  </Pantalla>,
  <Pantalla key="catalogos" titulo="Catálogos">
    <div className="mx-auto w-[78%] rotate-2 rounded-[4px] bg-white p-2.5 shadow-[0_14px_28px_-16px_rgb(29_28_26/0.5)]">
      <p className="text-[7px] tracking-[0.16em] text-[var(--tinta)]/50 uppercase">
        Catálogo
      </p>
      <p className={cn(estilos.titular, "text-[14px]")}>Lo nuevo</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1">
        {["zapatillas", "perfume", "labial", "cartera"].map((clave) => (
          <span
            key={clave}
            className="flex aspect-square items-center justify-center rounded-[3px] bg-[var(--papel)]"
          >
            <Mini clave={clave} className="max-h-[80%] w-[72%]" />
          </span>
        ))}
      </div>
    </div>
    <div className="mt-auto grid grid-cols-2 gap-1.5 text-[10px] font-semibold">
      <span className="flex items-center justify-center gap-1 rounded-full bg-[var(--tinta)] py-2 text-white">
        <FileText aria-hidden="true" className="size-3" /> Descargar PDF
      </span>
      <span className="flex items-center justify-center rounded-full border border-[var(--regla)] bg-white py-2">
        Editar en Canva
      </span>
    </div>
  </Pantalla>,
  <Pantalla key="panel" titulo="Hoy">
    <div className="grid grid-cols-2 gap-1.5">
      {[
        ["Ventas de hoy", "Bs 450"],
        ["Por cobrar", "2"],
        ["Para reponer", "1"],
        ["Visitas", "86"],
      ].map(([rotulo, valor]) => (
        <span key={rotulo} className="rounded-xl bg-white px-2.5 py-2">
          <span className="block text-[9.5px] text-[var(--tinta)]/50">
            {rotulo}
          </span>
          <span
            className={cn(estilos.titular, estilos.cifras, "block text-[17px]")}
          >
            {valor}
          </span>
        </span>
      ))}
    </div>
    <div className="flex flex-1 items-end gap-1.5 rounded-xl bg-white px-3 pt-3 pb-2.5">
      {[38, 52, 44, 70, 58, 86, 64].map((alto, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 rounded-t-[3px]",
            i === 5 ? "bg-[var(--boli)]" : "bg-[var(--boli)]/25"
          )}
          style={{ height: `${alto}%` }}
        />
      ))}
    </div>
  </Pantalla>,
  <Pantalla key="estadisticas" titulo="Estadísticas">
    <p className="ml-auto w-fit rounded-2xl rounded-br-[4px] bg-[var(--boli)] px-3 py-1.5 text-[10.5px] text-white">
      ¿Qué se vendió más este mes?
    </p>
    <div className="rounded-xl bg-white p-2.5">
      {[
        ["Zapatillas rojas", 92],
        ["Chamarra de jean", 64],
        ["Perfume Energy", 48],
        ["Audífonos", 31],
      ].map(([nombre, valor], i) => (
        <div key={nombre} className="mb-1.5 last:mb-0">
          <span className="block text-[9.5px] text-[var(--tinta)]/60">
            {nombre}
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-[var(--papel)]">
            <span
              className={cn(
                "block h-full rounded-full",
                i === 0 ? "bg-[var(--boli)]" : "bg-[var(--boli)]/35"
              )}
              style={{ width: `${valor}%` }}
            />
          </span>
        </div>
      ))}
    </div>
    <p className="text-[10.5px] leading-snug text-[var(--tinta)]/65">
      Las zapatillas rojas, con 12 ventas este mes.
    </p>
  </Pantalla>,
]

/** Las tres filas que comparten los dos lados, para que queden a la par. */
const FILAS = ["row-start-1", "row-start-2", "row-start-3"]

/** Una de las seis cosas que incluye, a un lado del celular y unida a él. */
function Cosa({
  i,
  lado,
  activa,
  onElegir,
}: {
  i: number
  lado: "izquierda" | "derecha"
  activa: boolean
  onElegir: () => void
}) {
  const cosa = INCLUYE[i]
  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={activa}
      className={cn(
        "js-cosa group relative w-full rounded-2xl border px-5 py-4 text-left transition-[background-color,border-color,box-shadow] duration-300",
        activa
          ? "border-[var(--regla)] bg-white shadow-[0_24px_50px_-30px_rgb(29_28_26/0.5)]"
          : "border-transparent hover:bg-white/60"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "js-conector absolute top-1/2 h-px w-16 transition-colors duration-300",
          lado === "izquierda"
            ? "left-full origin-right"
            : "right-full origin-left",
          activa ? "bg-[var(--boli)]" : "bg-[var(--regla)]"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-2 -translate-y-1/2 rounded-full transition-colors duration-300",
            lado === "izquierda" ? "right-0" : "left-0",
            activa ? "bg-[var(--boli)]" : "bg-[var(--regla)]"
          )}
        />
      </span>
      <span
        className={cn(
          "flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] transition-colors",
          activa ? "text-[var(--tinta)]" : "text-[var(--tinta)]/70"
        )}
      >
        {cosa.titulo}
        {"nuevo" in cosa && cosa.nuevo ? (
          <span className="rounded-full bg-[var(--boli)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-white uppercase">
            Nuevo
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "mt-1.5 block text-[14.5px] leading-relaxed transition-colors",
          activa ? "text-[var(--tinta)]/72" : "text-[var(--tinta)]/58"
        )}
      >
        {cosa.detalle}
      </span>
    </button>
  )
}

/**
 * "Qué incluye": cuando la sección está entera a la vista, las cinco apps de
 * antes entran al celular, y del celular salen las seis cosas que incluye, tres
 * a cada lado. Después la pantalla pasa sola por cada una y se marca cuál está
 * mostrando; se puede tocar cualquiera.
 */
export function Incluye() {
  const raiz = useRef<HTMLElement>(null)
  const [adentro, setAdentro] = useState(false)
  const { actual, elegir, reiniciar } = useRotacion(
    raiz,
    INCLUYE.length,
    3200,
    adentro
  )
  const anterior = () => elegir((actual - 1 + INCLUYE.length) % INCLUYE.length)
  const siguiente = () => elegir((actual + 1) % INCLUYE.length)

  // En el celular se pasa de una función a otra deslizando el dedo. Si el
  // gesto es más vertical que horizontal, es scroll y no cuenta.
  const toque = useRef<{ x: number; y: number } | null>(null)
  const alTocar = (evento: TouchEvent) => {
    const dedo = evento.touches[0]
    toque.current = { x: dedo.clientX, y: dedo.clientY }
  }
  const alSoltar = (evento: TouchEvent) => {
    const inicio = toque.current
    toque.current = null
    if (!inicio) return
    const dedo = evento.changedTouches[0]
    const dx = dedo.clientX - inicio.x
    const dy = dedo.clientY - inicio.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) siguiente()
    else anterior()
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(
        { movimiento: CON_MOVIMIENTO, ancho: "(min-width: 1024px)" },
        (contexto) => {
          const { movimiento, ancho } = contexto.conditions as {
            movimiento: boolean
            ancho: boolean
          }
          if (!movimiento || !ancho) {
            setAdentro(true)
            return
          }
          const q = gsap.utils.selector(raiz)
          gsap.from(q(".js-sube"), {
            y: 30,
            opacity: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.07,
            scrollTrigger: { trigger: raiz.current, start: "top 78%" },
          })

          const celular = q(".js-celular-incluye")[0]
          const hacia = (el: Element, eje: "x" | "y") => () => {
            const c = celular.getBoundingClientRect()
            const r = el.getBoundingClientRect()
            return eje === "x"
              ? c.left + c.width / 2 - (r.left + r.width / 2)
              : c.top + c.height / 2 - (r.top + r.height / 2)
          }

          // Antes de entrar: las apps a la vista, lo que incluye guardado.
          gsap.set(q(".js-app"), { autoAlpha: 1 })
          gsap.set(q(".js-cosa"), { autoAlpha: 0 })
          gsap.set(q(".js-conector"), { scaleX: 0 })

          const entrada = gsap.timeline({
            paused: true,
            onComplete: () => setAdentro(true),
          })
          q(".js-app").forEach((app, i) => {
            entrada
              .to(
                app,
                {
                  x: hacia(app, "x"),
                  y: hacia(app, "y"),
                  scale: 0.2,
                  rotate: (i % 2 ? 1 : -1) * 20,
                  autoAlpha: 0,
                  duration: 0.75,
                  ease: "power3.in",
                },
                0.2 + i * 0.12
              )
              .to(
                celular,
                { scale: 1.03, duration: 0.08, yoyo: true, repeat: 1 },
                0.9 + i * 0.12
              )
          })
          q(".js-cosa").forEach((cosa, i) => {
            const izquierda = i < 3
            entrada
              .fromTo(
                cosa,
                { x: izquierda ? 90 : -90, scale: 0.92, autoAlpha: 0 },
                {
                  x: 0,
                  scale: 1,
                  autoAlpha: 1,
                  duration: 0.7,
                  ease: "expo.out",
                },
                1.6 + (i % 3) * 0.1 + (izquierda ? 0 : 0.05)
              )
              .to(
                cosa.querySelector(".js-conector"),
                { scaleX: 1, duration: 0.5, ease: "power2.out" },
                "<0.25"
              )
          })

          // Arranca cuando la sección está entera en pantalla, llegando desde
          // arriba o desde abajo, y vuelve al principio en cuanto sale del todo.
          const escenario = q(".js-escenario-incluye")[0]
          const arrancar = () => {
            if (entrada.progress() === 0) entrada.play()
          }
          ScrollTrigger.create({
            trigger: escenario,
            start: "bottom bottom",
            end: "top top",
            onEnter: arrancar,
            onEnterBack: arrancar,
          })
          ScrollTrigger.create({
            trigger: escenario,
            start: "top bottom",
            end: "bottom top",
            onLeave: () => {
              entrada.pause(0).invalidate()
              setAdentro(false)
              reiniciar()
            },
            onLeaveBack: () => {
              entrada.pause(0).invalidate()
              setAdentro(false)
              reiniciar()
            },
          })
        }
      )
    },
    { scope: raiz }
  )

  return (
    <section
      ref={raiz}
      id="incluye"
      className="mx-auto max-w-[1280px] scroll-mt-20 overflow-x-clip px-6 py-16 lg:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[44rem] text-center">
        <p className="js-sube text-[13px] font-semibold tracking-[0.1em] text-[var(--boli)] uppercase">
          Qué incluye
        </p>
        <h2
          className={cn(
            estilos.titular,
            "js-sube mt-4 text-[clamp(2.1rem,3.6vw,3.3rem)]"
          )}
        >
          Todo lo que antes hacías en{" "}
          <span className={estilos.resaltado}>cinco apps distintas.</span>
        </h2>
      </div>

      <div className="js-escenario-incluye relative mt-14 hidden h-[540px] grid-cols-[1fr_270px_1fr] grid-rows-3 gap-x-16 lg:grid">
        {APPS.map(({ icono: Icono, nombre, className }) => (
          <div
            key={nombre}
            className={cn("js-app invisible absolute z-20", className)}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="flex size-[72px] items-center justify-center rounded-[20px] border border-[var(--regla)] bg-white text-[var(--tinta)]/60 shadow-[0_18px_36px_-20px_rgb(29_28_26/0.45)]">
                <Icono
                  aria-hidden="true"
                  className="size-7"
                  strokeWidth={1.6}
                />
              </span>
              <span className="text-[13px] font-medium text-[var(--tinta)]/55">
                {nombre}
              </span>
            </div>
          </div>
        ))}

        {INCLUYE.map((cosa, i) => (
          <div
            key={cosa.titulo}
            className={cn(
              "self-center",
              i < 3 ? "col-start-1" : "col-start-3",
              FILAS[i % 3]
            )}
          >
            <Cosa
              i={i}
              lado={i < 3 ? "izquierda" : "derecha"}
              activa={i === actual}
              onElegir={() => elegir(i)}
            />
          </div>
        ))}

        <div className="js-celular-incluye relative z-10 col-start-2 row-span-3 row-start-1 h-[540px] w-[270px] rounded-[2.4rem] bg-[#121215] p-[9px] shadow-[0_50px_90px_-40px_rgb(29_28_26/0.6)]">
          <div className="relative h-full overflow-hidden rounded-[2rem] bg-white">
            {PANTALLAS.map((pantalla, i) => (
              <div
                key={i}
                aria-hidden={i !== actual}
                className={cn(
                  "absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  i === actual
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0"
                )}
              >
                {pantalla}
              </div>
            ))}
            <span className="absolute top-2.5 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#121215]" />
          </div>
        </div>
      </div>

      {/*
        En el celular: el celular de muestra y, justo debajo, un carrusel para
        pasar de una función a otra. Lo que se toca y lo que cambia quedan en
        la misma pantalla.
      */}
      <div
        className="mt-8 touch-pan-y lg:hidden"
        onTouchStart={alTocar}
        onTouchEnd={alSoltar}
      >
        <div className="mx-auto h-[389px] w-[194px]">
          <div className="h-[540px] w-[270px] origin-top-left scale-[0.72] rounded-[2.4rem] bg-[#121215] p-[9px] shadow-[0_40px_70px_-36px_rgb(29_28_26/0.6)]">
            <div className="relative h-full overflow-hidden rounded-[2rem] bg-white">
              {PANTALLAS.map((pantalla, i) => (
                <div
                  key={i}
                  aria-hidden={i !== actual}
                  className={cn(
                    "absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    i === actual
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0"
                  )}
                >
                  {pantalla}
                </div>
              ))}
              <span className="absolute top-2.5 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#121215]" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3">
          <button
            type="button"
            onClick={anterior}
            aria-label="Anterior"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--regla)] bg-white transition-transform active:scale-95"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <div
            className="min-h-[11.5rem] min-w-0 flex-1 text-center"
            aria-live="polite"
          >
            <p className="flex items-center justify-center gap-2 text-[17px] font-semibold tracking-[-0.01em]">
              {INCLUYE[actual].titulo}
              {"nuevo" in INCLUYE[actual] && INCLUYE[actual].nuevo ? (
                <span className="rounded-full bg-[var(--boli)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-white uppercase">
                  Nuevo
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--tinta)]/70">
              {INCLUYE[actual].detalle}
            </p>
          </div>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Siguiente"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--regla)] bg-white transition-transform active:scale-95"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="mt-3 flex justify-center gap-1">
          {INCLUYE.map((cosa, i) => (
            <button
              key={cosa.titulo}
              type="button"
              onClick={() => elegir(i)}
              aria-label={cosa.titulo}
              aria-pressed={i === actual}
              className="-mx-1.5 flex size-11 items-center justify-center"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-[width,background-color] duration-300",
                  i === actual
                    ? "w-6 bg-[var(--boli)]"
                    : "w-2 bg-[var(--tinta)]/20"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
