"use client"

import { useRef, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCheck,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Simbolo } from "@/components/marca/logo"
import { producto } from "@/components/portada/datos"
import { useAncho } from "@/components/portada/escala"
import estilos from "@/components/portada/portada.module.css"
import { LogoWhatsApp } from "@/components/portada/logos"
import {
  CON_MOVIMIENTO,
  gsap,
  ScrollTrigger,
  useGSAP,
} from "@/components/portada/gsap"

/** El dibujo: más angosto en el celular, para que los dos celulares se vean más grandes. */
const ANCHO = 580
const ANCHO_ANGOSTO = 480
const ALTO = 540

/** Los cuatro momentos del pedido, en el orden en que pasan en la escena. */
const BOTON =
  "inline-flex min-h-13 items-center gap-2 rounded-full bg-[var(--papel)] px-7 text-[15.5px] font-semibold text-[var(--tinta)] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-white"

const MOMENTOS = [
  "Arma el carrito",
  "Te escribe",
  "Lo marcas pagado",
  "El stock baja solo",
]

function Celular({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "absolute rounded-[2.3rem] bg-[#0e0e10] p-[7px] shadow-[0_60px_90px_-40px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.12)]",
        className
      )}
    >
      <div className="relative h-full overflow-hidden rounded-[1.9rem]">
        {children}
        <span className="absolute top-2 left-1/2 h-[18px] w-20 -translate-x-1/2 rounded-full bg-[#0e0e10]" />
      </div>
    </div>
  )
}

/** El carrito en la tienda, en el celular de quien compra. */
function Carrito() {
  const zapatillas = producto("zapatillas")
  return (
    <div className="flex h-full flex-col bg-[#f7f5f0] px-3.5 pt-9 pb-3.5 text-[var(--tinta)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.14em] uppercase">
          Rosa Deportes
        </span>
        <span className="relative">
          <ShoppingBag aria-hidden="true" className="size-4" />
          <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-[var(--tinta)] text-[8px] font-bold text-white">
            1
          </span>
        </span>
      </div>
      <p className={cn(estilos.titular, "mt-4 text-[22px]")}>Tu pedido</p>

      <div className="js-item mt-3 flex items-center gap-2.5 rounded-2xl bg-white p-2.5 shadow-[0_10px_24px_-18px_rgb(29_28_26/0.5)]">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#f1ece4]">
          <Image
            src={zapatillas.foto}
            alt=""
            width={zapatillas.ancho}
            height={zapatillas.alto}
            sizes="56px"
            className="h-auto w-12 -rotate-12"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold">
            Zapatillas rojas
          </span>
          <span className="block text-[10px] text-[var(--tinta)]/50">
            Talla 38
          </span>
          <span className="mt-1 flex items-center justify-between">
            <span className={cn(estilos.cifras, "text-[12px] font-semibold")}>
              Bs 450
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--regla)] px-1.5 py-0.5 text-[10px]">
              <Minus aria-hidden="true" className="size-2.5" />1
              <Plus aria-hidden="true" className="size-2.5" />
            </span>
          </span>
        </span>
      </div>

      <p className="mt-5 text-[10px] font-semibold tracking-[0.1em] text-[var(--tinta)]/45 uppercase">
        También te puede gustar
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[
          ["chamarra", "Chamarra de jean", "Bs 380"],
          ["audifonos", "Audífonos", "Bs 260"],
        ].map(([clave, nombre, precio]) => {
          const p = producto(clave)
          return (
            <span key={clave} className="rounded-xl bg-white p-1.5">
              <span className="flex h-14 items-center justify-center rounded-lg bg-[#f1ece4]">
                <Image
                  src={p.foto}
                  alt=""
                  width={p.ancho}
                  height={p.alto}
                  sizes="48px"
                  className="h-auto max-h-12 w-auto max-w-[70%] object-contain"
                />
              </span>
              <span className="mt-1 block truncate text-[9.5px] font-medium">
                {nombre}
              </span>
              <span
                className={cn(
                  estilos.cifras,
                  "block text-[9.5px] text-[var(--tinta)]/55"
                )}
              >
                {precio}
              </span>
            </span>
          )
        })}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between border-t border-dashed border-[var(--regla)] pt-3">
          <span className="text-[11px] text-[var(--tinta)]/55">Total</span>
          <span className={cn(estilos.titular, estilos.cifras, "text-[22px]")}>
            Bs 450
          </span>
        </div>
        <span className="js-pedir relative mt-3 flex items-center justify-center gap-1.5 rounded-full bg-[#25d366] py-2.5 text-[11.5px] font-semibold text-[#0b2e17]">
          <span className="rounded-full bg-[#0b2e17] p-[2px]">
            <LogoWhatsApp className="size-3.5" />
          </span>
          Enviar pedido por WhatsApp
          <span className="js-toque pointer-events-none absolute top-1/2 left-[86%] size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 opacity-0" />
        </span>
      </div>
    </div>
  )
}

/** Tu WhatsApp: llega el mensaje, y encima el aviso de Venduo. */
function Chat() {
  return (
    <div className="flex h-full flex-col bg-[#0b141a] text-[#e9edef]">
      <div className="flex items-center gap-2 bg-[#202c33] px-3 pt-8 pb-2.5">
        <ArrowLeft aria-hidden="true" className="size-3.5 text-white/70" />
        <span className="flex size-7 items-center justify-center rounded-full bg-[#6a7f8a] text-[11px] font-semibold">
          C
        </span>
        <span>
          <span className="block text-[12px] font-semibold">Carla</span>
          <span className="block text-[9.5px] text-white/50">en línea</span>
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-end gap-2 px-2.5 pb-3">
        <span className="mx-auto mt-3 mb-auto rounded-md bg-[#182229] px-2 py-0.5 text-[9px] text-white/50">
          HOY
        </span>
        <span className="js-escribiendo absolute bottom-3 left-2.5 flex gap-1 rounded-xl rounded-tl-[3px] bg-[#202c33] px-3 py-2.5 opacity-0">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="js-punto size-1.5 rounded-full bg-white/60"
            />
          ))}
        </span>
        <div className="js-mensaje w-[88%] origin-bottom-left rounded-xl rounded-tl-[3px] bg-[#202c33] px-3 py-2 text-[11px] leading-snug">
          <p>Hola Rosa Deportes, quiero hacer este pedido (#152):</p>
          <p className="mt-1.5">· 1× Zapatillas rojas (Talla 38) — Bs 450</p>
          <p className="mt-1 font-semibold">Total: Bs 450</p>
          <p className="mt-0.5 flex items-center justify-end gap-1 text-[9px] text-white/45">
            21:47
          </p>
        </div>
      </div>

      <div className="js-aviso absolute inset-x-2 top-8 rounded-2xl bg-white/95 p-2.5 text-[var(--tinta)] shadow-[0_18px_40px_-14px_rgb(0_0_0/0.8)] backdrop-blur">
        <div className="flex items-center gap-1.5 text-[9.5px] text-[var(--tinta)]/55">
          <span className="flex size-4 items-center justify-center rounded-[5px] bg-[var(--tinta)] text-white">
            <Simbolo className="size-2.5" />
          </span>
          Tu panel · Pedidos
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span>
            <span className="block text-[12px] font-semibold">Pedido #152</span>
            <span
              className={cn(
                estilos.cifras,
                "block text-[10.5px] text-[var(--tinta)]/60"
              )}
            >
              1× Zapatillas rojas · Bs 450
            </span>
          </span>
          <span className="grid text-[10px] font-semibold">
            <span className="js-por-cobrar relative rounded-full bg-[var(--boli)] px-2.5 py-1 text-white [grid-area:1/1]">
              Marcar pagado
              <span className="js-toque-2 pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 opacity-0" />
            </span>
            <span className="js-pagado flex items-center justify-center gap-1 rounded-full bg-[#e3f6e9] px-2.5 py-1 text-[#13753a] [grid-area:1/1]">
              <Check aria-hidden="true" className="size-3" /> Pagado
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

/** El stock de las zapatillas, que rueda de 3 a 2 cuando el pedido se paga. */
function Stock({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "js-stock absolute z-20 flex items-center gap-3 rounded-2xl bg-[var(--boli-claro)] px-4 py-2.5 text-[13.5px] font-semibold whitespace-nowrap text-[var(--tinta)] shadow-[0_20px_40px_-18px_rgb(0_0_0/0.9)]",
        className
      )}
    >
      <CheckCheck aria-hidden="true" className="size-4" />
      Zapatillas rojas · stock
      <span
        className={cn(
          estilos.cifras,
          "relative inline-block h-[22px] overflow-hidden text-[22px] leading-[22px]"
        )}
      >
        <span
          className="js-rodillo flex flex-col"
          style={{ transform: "translateY(-50%)" }}
        >
          <span>3</span>
          <span>2</span>
        </span>
      </span>
    </span>
  )
}

/**
 * "Pedidos por WhatsApp", contado de punta a punta: quien compra arma el
 * carrito y toca el botón, el pedido vuela a tu WhatsApp, te llega el aviso,
 * lo marcas pagado y el stock baja solo. Corre mientras la escena está a la
 * vista y vuelve a empezar al salir; sin movimiento, se ve el final.
 */
export function Pedidos() {
  const raiz = useRef<HTMLElement>(null)
  const caja = useRef<HTMLDivElement>(null)
  const anchoDeCaja = useAncho(caja)
  // En una pantalla angosta, un solo celular grande que pasa del carrito a tu
  // WhatsApp: con dos, el texto quedaba ilegible.
  const chico = anchoDeCaja > 0 && anchoDeCaja < 592
  const anchoDelDibujo = chico ? ANCHO_ANGOSTO : ANCHO
  const escala = anchoDeCaja ? Math.min(1.1, anchoDeCaja / anchoDelDibujo) : 1

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        const q = gsap.utils.selector(raiz)
        gsap.from(q(".js-sube"), {
          y: 30,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.07,
          scrollTrigger: { trigger: raiz.current, start: "top 78%" },
        })

        const lienzo = q(".js-lienzo")[0]
        const volador = q(".js-volador")[0]
        const unSoloCelular = !volador
        // Dónde está cada cosa, en las medidas del dibujo (sin la escala).
        const centro = (el: Element) => {
          const l = lienzo.getBoundingClientRect()
          const r = el.getBoundingClientRect()
          const s = l.width / (lienzo as HTMLElement).offsetWidth
          return {
            x: (r.left + r.width / 2 - l.left) / s,
            y: (r.top + r.height / 2 - l.top) / s,
          }
        }
        const desde = () => centro(q(".js-pedir")[0])
        const hasta = () => centro(q(".js-mensaje")[0])

        const marcar = (paso: number) => () =>
          q("[data-momento]").forEach((el) =>
            el.setAttribute(
              "data-activo",
              String(Number(el.getAttribute("data-momento")) === paso)
            )
          )

        // El principio: el carrito vacío, el chat sin mensajes, sin aviso.
        gsap.set(q(".js-item"), { autoAlpha: 0, y: 14 })
        gsap.set(q(".js-mensaje"), { autoAlpha: 0, scale: 0.85 })
        gsap.set(q(".js-aviso"), { yPercent: -160, autoAlpha: 0 })
        gsap.set(q(".js-pagado"), { autoAlpha: 0 })
        gsap.set(q(".js-por-cobrar"), { autoAlpha: 1 })
        gsap.set(q(".js-rodillo"), { y: 0, yPercent: 0 })
        if (volador) {
          gsap.set(volador, { autoAlpha: 0, xPercent: -50, yPercent: -50 })
        }
        if (unSoloCelular) {
          gsap.set(q(".js-stock-aviso"), { autoAlpha: 0, y: 16 })
          gsap.set(q(".js-pantalla-chat, .js-rotulo-tu"), { autoAlpha: 0 })
          gsap.set(q(".js-rotulo-compra"), { autoAlpha: 1 })
        }
        gsap.set(q("[data-barra]"), { scaleX: 0 })

        // Cuándo empieza cada momento, en segundos: unos tres para cada uno,
        // así da tiempo de leerlo. Lo que se mueve va a su ritmo dentro.
        const [P0, P1, P2, P3] = [0, 3, 6.4, 9.6]
        const FIN = 12.6

        const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.8 })
        tl.call(marcar(0), [], P0)
          .to(
            q('[data-barra="0"]'),
            { scaleX: 1, duration: P1 - P0, ease: "none" },
            P0
          )
          .to(
            q(".js-item"),
            { autoAlpha: 1, y: 0, duration: 0.6, ease: "back.out(1.8)" },
            P0 + 0.3
          )
          // Toca el botón.
          .fromTo(
            q(".js-toque"),
            { scale: 0.2, autoAlpha: 0.9 },
            { scale: 2.4, autoAlpha: 0, duration: 0.6, ease: "power2.out" },
            P1 - 0.4
          )
          .to(
            q(".js-pedir"),
            { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 },
            P1 - 0.4
          )
          // El pedido vuela a tu WhatsApp.
          .call(marcar(1), [], P1)
          .to(
            q('[data-barra="1"]'),
            { scaleX: 1, duration: P2 - P1, ease: "none" },
            P1
          )
        if (unSoloCelular) {
          tl.to(
            q(".js-pantalla-carrito, .js-rotulo-compra"),
            { autoAlpha: 0, duration: 0.35 },
            P1 + 0.1
          ).to(
            q(".js-pantalla-chat, .js-rotulo-tu"),
            { autoAlpha: 1, duration: 0.35 },
            P1 + 0.1
          )
        } else {
          tl.set(volador, { x: () => desde().x, y: () => desde().y }, P1 - 0.2)
            .to(volador, { autoAlpha: 1, scale: 1, duration: 0.2 }, P1 - 0.2)
            .to(
              volador,
              { x: () => hasta().x, duration: 0.9, ease: "power1.inOut" },
              P1 - 0.05
            )
            .to(
              volador,
              {
                keyframes: [
                  {
                    y: () => desde().y - 150,
                    duration: 0.45,
                    ease: "power2.out",
                  },
                  { y: () => hasta().y, duration: 0.45, ease: "power2.in" },
                ],
              },
              P1 - 0.05
            )
            .to(volador, { autoAlpha: 0, scale: 0.6, duration: 0.2 }, P1 + 0.75)
        }
        tl.to(q(".js-escribiendo"), { autoAlpha: 1, duration: 0.15 }, P1 + 0.8)
          .to(
            q(".js-punto"),
            {
              y: -3,
              duration: 0.25,
              yoyo: true,
              repeat: 5,
              stagger: 0.1,
              ease: "sine.inOut",
            },
            P1 + 0.8
          )
          .to(q(".js-escribiendo"), { autoAlpha: 0, duration: 0.1 }, P1 + 2)
          .to(
            q(".js-mensaje"),
            { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" },
            P1 + 2
          )
          // Te llega el aviso y lo marcas pagado.
          .call(marcar(2), [], P2)
          .to(
            q('[data-barra="2"]'),
            { scaleX: 1, duration: P3 - P2, ease: "none" },
            P2
          )
          .to(
            q(".js-aviso"),
            { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.4)" },
            P2 + 0.1
          )
          .fromTo(
            q(".js-toque-2"),
            { scale: 0.2, autoAlpha: 0.9 },
            { scale: 2.2, autoAlpha: 0, duration: 0.5, ease: "power2.out" },
            P2 + 1.6
          )
          .to(q(".js-por-cobrar"), { autoAlpha: 0, duration: 0.2 }, P2 + 1.75)
          .fromTo(
            q(".js-pagado"),
            { autoAlpha: 0, scale: 0.8 },
            { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(2)" },
            P2 + 1.75
          )
          // Y el stock baja solo.
          .call(marcar(3), [], P3)
          .to(
            q('[data-barra="3"]'),
            { scaleX: 1, duration: FIN - P3, ease: "none" },
            P3
          )
          .to(
            q(".js-rodillo"),
            { yPercent: -50, duration: 0.6, ease: "back.inOut(1.6)" },
            P3 + 0.4
          )
          .to(
            q(".js-stock"),
            { scale: 1.08, duration: 0.18, yoyo: true, repeat: 1 },
            P3 + 0.65
          )
          // Se despeja para volver a empezar.
          .to(
            q(".js-item, .js-mensaje, .js-aviso, .js-stock-aviso"),
            { autoAlpha: 0, duration: 0.4 },
            FIN
          )

        // Con un solo celular, el stock aparece como aviso cuando baja.
        if (unSoloCelular) {
          tl.to(
            q(".js-stock-aviso"),
            { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" },
            P3
          )
        }

        // Corre mientras la escena se ve, y vuelve al principio al salir.
        const escena = q(".js-escena-pedidos")[0]
        const arrancar = () => {
          tl.pause(0).invalidate().play()
        }
        ScrollTrigger.create({
          trigger: escena,
          start: "top 75%",
          end: "bottom 25%",
          onEnter: arrancar,
          onEnterBack: arrancar,
          onLeave: () => {
            tl.pause(0)
          },
          onLeaveBack: () => {
            tl.pause(0)
          },
        })
      })
    },
    { scope: raiz, dependencies: [chico], revertOnUpdate: true }
  )

  return (
    <section
      ref={raiz}
      id="pedidos"
      className="scroll-mt-20 overflow-x-clip bg-[var(--tinta)] text-[var(--papel)]"
    >
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 lg:px-10 lg:py-28">
        <div>
          <p className="js-sube text-[13px] font-semibold tracking-[0.1em] text-[var(--boli-claro)] uppercase">
            Pedidos por WhatsApp
          </p>
          <h2
            className={cn(
              estilos.titular,
              "js-sube mt-4 max-w-[18ch] text-[clamp(2.1rem,3.6vw,3.3rem)]"
            )}
          >
            Tu cliente arma el carrito. El pedido te llega por WhatsApp.
          </h2>
          <p className="js-sube mt-7 max-w-[52ch] text-[18px] leading-relaxed text-[var(--papel)]/72">
            Sin formularios ni cuentas: quien compra elige, ve el total y toca
            un botón. Te escribe con la lista de productos y el número del
            pedido, y acuerdan el pago en el mismo chat donde ya le vendías. El
            pedido queda en tu panel, y cuando te paga, el stock baja solo.
          </p>
          <Link
            href="/login?modo=registro"
            className={cn(BOTON, "js-sube mt-9 hidden lg:inline-flex")}
          >
            Crear mi tienda gratis
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div ref={caja} className="js-escena-pedidos">
          {chico ? (
            <div
              aria-hidden="true"
              className="js-lienzo relative mx-auto w-[270px]"
            >
              <span className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--boli-claro)_22%,transparent),transparent)]" />
              <p className="relative mb-3 h-4 text-center text-[12px] font-semibold tracking-[0.08em] text-[var(--papel)]/55 uppercase">
                <span className="js-rotulo-compra absolute inset-0 opacity-0">
                  Quien compra
                </span>
                <span className="js-rotulo-tu absolute inset-0">Tú</span>
              </p>
              <div className="relative h-[540px]">
                <Celular className="inset-0">
                  <div className="js-pantalla-carrito absolute inset-0">
                    <Carrito />
                  </div>
                  <div className="js-pantalla-chat absolute inset-0">
                    <Chat />
                  </div>
                </Celular>
                <Stock className="js-stock-aviso top-[140px] left-1/2 -translate-x-1/2" />
              </div>
            </div>
          ) : (
            <div
              className="relative"
              style={{ height: ALTO * escala }}
              aria-hidden="true"
            >
              <div
                className="js-lienzo absolute top-0 left-0 origin-top-left"
                style={{
                  width: anchoDelDibujo,
                  height: ALTO,
                  transform: `scale(${escala})`,
                }}
              >
                <span className="absolute inset-[6%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--boli-claro)_22%,transparent),transparent)]" />

                <span className="absolute top-[22px] left-[16px] -rotate-6 text-[12px] font-semibold tracking-[0.08em] text-[var(--papel)]/50 uppercase sm:left-[34px]">
                  Quien compra
                </span>
                <Celular className="top-[52px] left-[2px] h-[452px] w-[226px] -rotate-6 sm:left-[20px]">
                  <Carrito />
                </Celular>

                <span className="absolute top-[2px] right-[26px] rotate-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--papel)]/50 uppercase sm:right-[44px]">
                  Tú
                </span>
                <Celular className="top-[28px] right-[2px] z-10 h-[476px] w-[240px] rotate-3 sm:right-[20px]">
                  <Chat />
                </Celular>

                <span className="js-volador absolute top-0 left-0 z-30 flex items-center gap-1.5 rounded-full bg-[#25d366] px-3 py-1.5 text-[11.5px] font-semibold whitespace-nowrap text-[#0b2e17] opacity-0 shadow-[0_14px_30px_-10px_rgb(37_211_102/0.6)]">
                  <span className="rounded-full bg-[#0b2e17] p-[2px]">
                    <LogoWhatsApp className="size-3" />
                  </span>
                  Pedido #152
                </span>

                <Stock className="right-[26px] bottom-[6px]" />
              </div>
            </div>
          )}

          <ol className="mt-10 grid grid-cols-4 gap-3">
            {MOMENTOS.map((momento, i) => (
              <li
                key={momento}
                data-momento={i}
                data-activo={i === MOMENTOS.length - 1}
                className="group text-[13px] leading-snug text-[var(--papel)]/45 transition-colors duration-300 data-[activo=true]:text-[var(--papel)]"
              >
                <span className="mb-2.5 block h-[3px] overflow-hidden rounded-full bg-white/12">
                  <span
                    data-barra={i}
                    className="block h-full origin-left rounded-full bg-[var(--boli-claro)]"
                  />
                </span>
                {momento}
              </li>
            ))}
          </ol>
          <Link
            href="/login?modo=registro"
            className={cn(BOTON, "mt-10 w-full justify-center lg:hidden")}
          >
            Crear mi tienda gratis
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
