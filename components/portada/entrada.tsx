"use client"

import { useRef, type CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { ADEMAS, producto } from "@/components/portada/datos"
import estilos from "@/components/portada/portada.module.css"
import { Telefono } from "@/components/portada/telefono"
import { prepararTrazos, Subrayado } from "@/components/portada/trazos"
import {
  CON_MOVIMIENTO,
  gsap,
  SplitText,
  useGSAP,
} from "@/components/portada/gsap"

/**
 * La entrada de la portada: todo cae al celular. A la derecha, el celular
 * en 3D flota y sigue al mouse; alrededor flotan los productos, las notas a
 * mano y las burbujas de "¿precio?". Al bajar, la escena se fija: las
 * preguntas se dispersan, los productos caen dentro del celular, que gira de
 * frente y pasa de la tienda al carrito, al pedido en WhatsApp y al panel.
 */

type Flotante =
  | {
      tipo: "producto"
      clave: string
      ancho: number
      /** Profundidad en px: más alto, más cerca y más se mueve. */
      z: number
      giro: number
      className: string
    }
  | {
      tipo: "nota" | "burbuja"
      texto: string
      z: number
      giro: number
      className: string
      color?: "amarilla" | "blanca"
    }

const FLOTANTES: Flotante[] = [
  {
    tipo: "producto",
    clave: "zapatillas",
    ancho: 230,
    z: 140,
    giro: -14,
    className: "top-[6%] -left-[14%]",
  },
  {
    tipo: "producto",
    clave: "audifonos",
    ancho: 200,
    z: 70,
    giro: 16,
    className: "top-[2%] -right-[12%]",
  },
  {
    tipo: "producto",
    clave: "perfume",
    ancho: 104,
    z: 170,
    giro: -8,
    className: "bottom-[20%] -left-[8%]",
  },
  {
    tipo: "producto",
    clave: "labial",
    ancho: 120,
    z: 110,
    giro: 12,
    className: "bottom-[6%] right-[-2%]",
  },
  {
    tipo: "producto",
    clave: "chamarra",
    ancho: 180,
    z: -90,
    giro: 10,
    className: "top-[40%] -right-[22%]",
  },
  {
    tipo: "nota",
    texto: "¿pagó?",
    z: 120,
    giro: -7,
    color: "amarilla",
    className: "top-[34%] -left-[22%]",
  },
  {
    tipo: "nota",
    texto: "quedan 3… ¿o 2?",
    z: 60,
    giro: 5,
    color: "blanca",
    className: "bottom-[30%] -right-[18%]",
  },
  {
    tipo: "burbuja",
    texto: "¿precio?",
    z: 90,
    giro: -4,
    className: "-top-[2%] left-[22%]",
  },
  {
    tipo: "burbuja",
    texto: "¿hay talla 38?",
    z: 40,
    giro: 3,
    className: "top-[60%] -left-[20%]",
  },
  {
    tipo: "burbuja",
    texto: "¿sigue disponible?",
    z: 130,
    giro: -3,
    className: "bottom-[0%] left-[26%]",
  },
  {
    tipo: "burbuja",
    texto: "¿precio?",
    z: 20,
    giro: 4,
    className: "top-[22%] -right-[24%]",
  },
]

function ContenidoFlotante({ f }: { f: Flotante }) {
  if (f.tipo === "producto") {
    const p = producto(f.clave)
    return (
      <Image
        src={p.foto}
        alt=""
        width={p.ancho}
        height={p.alto}
        sizes={`${f.ancho}px`}
        priority={f.clave === "zapatillas"}
        className={cn(
          estilos.producto,
          "h-auto w-[calc(var(--ancho)*0.56)] lg:w-[var(--ancho)]"
        )}
        style={{ "--ancho": `${f.ancho}px` } as CSSProperties}
      />
    )
  }
  if (f.tipo === "nota") {
    return (
      <span
        className={cn(
          estilos.mano,
          "block px-4 pt-3 pb-4 text-[22px] whitespace-nowrap shadow-[0_14px_28px_-12px_rgb(29_28_26/0.35)]",
          f.color === "amarilla" ? "bg-[var(--resaltador)]" : "bg-white"
        )}
      >
        {f.texto}
      </span>
    )
  }
  return (
    <span className="relative block rounded-2xl rounded-bl-[4px] bg-white px-4 py-2.5 text-[15px] whitespace-nowrap text-[var(--tinta)]/80 shadow-[0_12px_30px_-14px_rgb(29_28_26/0.4)]">
      {f.texto}
    </span>
  )
}

export function Entrada() {
  const raiz = useRef<HTMLElement>(null)

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
          if (!movimiento) return
          const q = gsap.utils.selector(raiz)
          const trazos = prepararTrazos(raiz.current!)

          const division = SplitText.create(q(".js-titular"), {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 105,
                duration: 1.1,
                ease: "expo.out",
                stagger: 0.08,
                delay: 0.15,
              }),
          })

          // Entrada: el celular sube y las cosas aparecen alrededor.
          gsap
            .timeline({ delay: 0.25 })
            .from(q(".js-aparece"), {
              y: 16,
              opacity: 0,
              duration: 0.9,
              ease: "expo.out",
              stagger: 0.07,
            })
            .from(
              q(".js-telefono"),
              {
                y: 120,
                opacity: 0,
                rotateY: -50,
                duration: 1.4,
                ease: "expo.out",
              },
              0.1
            )
            .from(
              q(".js-aparicion"),
              {
                scale: 0.4,
                opacity: 0,
                duration: 1.1,
                ease: "back.out(1.6)",
                stagger: { each: 0.06, from: "random" },
              },
              0.5
            )
            .to(
              trazos,
              {
                strokeDashoffset: 0,
                duration: 0.6,
                ease: "power2.out",
                stagger: 0.2,
              },
              1
            )

          // El vaivén de todo lo que flota, cada cosa a su ritmo.
          q(".js-vaiven").forEach((el, i) => {
            gsap.to(el, {
              y: i % 2 ? 14 : -14,
              rotate: i % 2 ? 2.5 : -2.5,
              duration: 2.6 + (i % 4) * 0.55,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            })
          })
          gsap.to(q(".js-rebote"), {
            y: 5,
            duration: 0.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          })
          gsap.to(q(".js-vaiven-cel"), {
            y: -12,
            duration: 3.2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          })

          if (!ancho) return () => division.revert()

          // El mouse inclina el celular y mueve cada capa según su profundidad.
          const inclinarX = gsap.quickTo(q(".js-inclina")[0], "rotateX", {
            duration: 0.9,
            ease: "power3.out",
          })
          const inclinarY = gsap.quickTo(q(".js-inclina")[0], "rotateY", {
            duration: 0.9,
            ease: "power3.out",
          })
          const capas = q(".js-capa").map((el) => {
            const z = Number(el.dataset.z) / 140
            return {
              z,
              x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
              y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
            }
          })
          const mover = (evento: PointerEvent) => {
            const dx = evento.clientX / window.innerWidth - 0.5
            const dy = evento.clientY / window.innerHeight - 0.5
            inclinarY(dx * 18)
            inclinarX(-dy * 12)
            for (const capa of capas) {
              capa.x(dx * 60 * capa.z)
              capa.y(dy * 40 * capa.z)
            }
          }
          window.addEventListener("pointermove", mover)

          // El scroll: todo cae al celular.
          const pantallas = q(".js-pantalla")
          const centroDelCelular = () => {
            const r = q(".js-telefono")[0].getBoundingClientRect()
            return { x: r.left + r.width / 2, y: r.top + r.height * 0.42 }
          }
          const hacia = (el: Element, eje: "x" | "y") => () => {
            const c = centroDelCelular()
            const r = el.getBoundingClientRect()
            return eje === "x"
              ? c.x - (r.left + r.width / 2)
              : c.y - (r.top + r.height / 2)
          }

          const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: q(".js-escena")[0],
              start: "top top",
              end: "+=70%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })

          // 1. Las preguntas y las notas se dispersan.
          q(
            ".js-flotante[data-tipo='burbuja'], .js-flotante[data-tipo='nota']"
          ).forEach((el, i) => {
            tl.to(
              el,
              {
                x: (i % 2 ? 1 : -1) * (180 + i * 30),
                y: -160 - i * 20,
                rotate: (i % 2 ? 1 : -1) * 25,
                opacity: 0,
                duration: 0.8,
                ease: "power2.in",
              },
              i * 0.06
            )
          })
          tl.to(q(".js-pista"), { opacity: 0, y: 10, duration: 0.2 }, 0)

          // 2. Los productos caen dentro del celular.
          q(".js-flotante[data-tipo='producto']").forEach((el, i) => {
            tl.to(
              el,
              {
                x: hacia(el, "x"),
                y: hacia(el, "y"),
                scale: 0.12,
                rotate: 0,
                opacity: 0,
                duration: 0.7,
                ease: "power3.in",
              },
              0.7 + i * 0.12
            ).to(
              q(".js-golpe")[0],
              { scale: 1.035, duration: 0.06, yoyo: true, repeat: 1 },
              1.32 + i * 0.12
            )
          })
          tl.to(
            q(".js-telefono"),
            {
              rotateY: 0,
              rotateZ: 0,
              rotateX: 0,
              duration: 1,
              ease: "power2.inOut",
            },
            0.9
          )

          // 3. Tienda → carrito.
          tl.to(q(".js-dedo"), { opacity: 1, scale: 0.8, duration: 0.15 }, 1.7)
            .to(q(".js-tocado"), { scale: 0.94, duration: 0.12 }, 1.8)
            .to(q(".js-dedo"), { opacity: 0, duration: 0.1 }, 1.95)
            .to(pantallas[1], { opacity: 1, duration: 0.25 }, 2.0)
            .set(pantallas[0], { opacity: 0 }, 2.26)
            .to(q(".js-agregar-a"), { yPercent: -100, duration: 0.15 }, 2.35)
            .to(q(".js-agregar-b"), { yPercent: -100, duration: 0.15 }, 2.35)
            .to(
              q(".js-insignia"),
              { scale: 1, duration: 0.2, ease: "back.out(3)" },
              2.45
            )
            .to(
              q(".js-hoja"),
              { yPercent: -100, duration: 0.25, ease: "power3.out" },
              2.55
            )
            .to({}, { duration: 0.3 })

          return () => {
            window.removeEventListener("pointermove", mover)
            division.revert()
          }
        }
      )
    },
    { scope: raiz }
  )

  return (
    <section ref={raiz}>
      <div className="js-escena mx-auto grid min-h-[100svh] max-w-[1280px] items-center gap-14 overflow-x-clip px-6 pt-32 pb-16 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:px-10 lg:pt-24 lg:pb-10 [&>*]:min-w-0">
        <div className="relative z-20">
          <div className="js-copia">
            <p className="js-aparece flex items-center gap-2 text-[14.5px] text-[var(--tinta)]/60">
              <span className="size-1.5 rounded-full bg-[var(--boli)]" />
              Para quien vende por TikTok, Facebook, Instagram y WhatsApp
            </p>
            <h1
              className={cn(
                estilos.titular,
                "js-titular mt-5 text-[clamp(2.6rem,4.3vw,4rem)]"
              )}
            >
              Tu tienda online, tu inventario y tus ventas.{" "}
              <span className="relative inline-block whitespace-nowrap">
                Lista en minutos.
                <Subrayado className="absolute -bottom-[0.18em] left-0 h-[0.28em] w-full" />
              </span>
            </h1>
            <p className="js-aparece mt-6 max-w-[44ch] text-[18.5px] leading-relaxed text-[var(--tinta)]/70">
              Elige una plantilla y tu tienda queda armada. Subes tus productos
              desde el celular y un panel te muestra lo que vendes cada día.
            </p>
            <ul className="js-aparece mt-6 grid max-w-[34rem] gap-x-6 sm:grid-cols-2">
              {ADEMAS.map(({ icono: Icono, texto }) => (
                <li
                  key={texto}
                  className="flex items-start gap-2.5 border-t border-[var(--regla)] py-2.5 text-[14.5px] leading-snug font-medium"
                >
                  <Icono
                    aria-hidden="true"
                    className="mt-px size-4 shrink-0 text-[var(--boli)]"
                  />
                  {texto}
                </li>
              ))}
            </ul>
            <div className="js-aparece relative mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/login?modo=registro" className={estilos.boton}>
                Crear mi tienda gratis
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              <a href="#como-funciona" className={estilos.enlace}>
                Mira cómo funciona
                <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            </div>
            <p className="js-aparece mt-4 text-[14.5px] text-[var(--tinta)]/60">
              No pedimos tarjeta.
            </p>
          </div>
        </div>

        <div className="relative mx-auto h-[min(68svh,560px)] w-[min(86vw,420px)] [perspective:1600px] lg:h-[min(80svh,700px)] lg:w-[420px]">
          {FLOTANTES.map((f, i) => (
            <div
              key={i}
              data-tipo={f.tipo}
              className={cn(
                "js-flotante pointer-events-none absolute",
                f.z < 0 ? "z-0" : "z-20",
                f.className,
                (f.tipo !== "producto" || f.clave === "chamarra") &&
                  "max-lg:hidden"
              )}
            >
              <div className="js-capa" data-z={f.z}>
                <div className="js-aparicion">
                  <div className="js-vaiven" style={{ rotate: `${f.giro}deg` }}>
                    <ContenidoFlotante f={f} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute inset-0 z-10 flex items-center justify-center [transform-style:preserve-3d]">
            <div
              className="js-telefono [transform-style:preserve-3d]"
              style={{
                transform: "rotateY(-24deg) rotateX(9deg) rotateZ(-4deg)",
              }}
            >
              <div className="js-inclina [transform-style:preserve-3d]">
                <div className="js-vaiven-cel relative [transform-style:preserve-3d]">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 [transform:translateZ(-14px)] rounded-[14%/6.6%] bg-[#2a2a2e]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 [transform:translateZ(-7px)] rounded-[14%/6.6%] bg-[#3a3a40]"
                  />
                  <div className="js-golpe relative">
                    <Telefono className="h-[min(60svh,480px)] lg:h-[min(72svh,620px)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute -bottom-6 left-1/2 h-10 w-[70%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(29_28_26/0.22),transparent)] blur-md"
          />

          <div className="js-pista absolute bottom-[6%] left-1/2 z-30 hidden -translate-x-1/2 lg:block">
            <span className="flex items-center gap-2.5 rounded-full bg-[var(--tinta)] py-2 pr-2 pl-5 text-[14.5px] font-semibold whitespace-nowrap text-white shadow-[0_16px_40px_-14px_rgb(29_28_26/0.7)]">
              Baja y mira tu tienda
              <span className="js-rebote flex size-8 items-center justify-center rounded-full bg-[var(--boli)]">
                <ArrowDown aria-hidden="true" className="size-4" />
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
