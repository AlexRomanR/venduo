"use client"

import { useRef, useState } from "react"
import { ArrowUpRight, Check, Copy, Share2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import { Subrayado } from "@/components/portada/trazos"
import portada from "@/components/portada/portada.module.css"
import {
  LogoFacebook,
  LogoInstagram,
  LogoTikTok,
  LogoWhatsApp,
} from "@/components/portada/logos"
import { entra, useEscena } from "@/components/panel/resumen/escena"
import { Mano } from "@/components/panel/resumen/piezas"
import estilos from "@/components/panel/resumen/resumen.module.css"

/**
 * El cierre del Resumen: lo que trae la próxima venta es el enlace de la
 * tienda, a la vista para copiarlo, y los lugares donde va, volando hacia él.
 */
export function Cierre({
  tienda,
}: {
  tienda: { nombre: string; slug: string; url: string; legible: string }
}) {
  const raiz = useRef<HTMLElement>(null)
  const [copiado, setCopiado] = useState(false)

  useEscena(raiz, (tl, piezas) => {
    entra(
      tl,
      piezas(".js-red"),
      {
        y: 60,
        x: (i) => (i - 1.5) * 60,
        rotate: (i) => (i % 2 ? 25 : -25),
        scale: 0.3,
        autoAlpha: 0,
        duration: 1,
        ease: "back.out(1.6)",
        stagger: 0.09,
      },
      0.3
    )
  })

  async function copiar() {
    try {
      await navigator.clipboard.writeText(tienda.url)
      setCopiado(true)
      toast.success("Enlace copiado.")
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("No pudimos copiarlo. Mantén presionado el enlace.")
    }
  }

  const redes = [
    { nombre: "WhatsApp", logo: <LogoWhatsApp className="size-7" /> },
    {
      nombre: "TikTok",
      logo: (
        <span className="flex size-7 items-center justify-center rounded-full bg-black">
          <LogoTikTok className="size-5" />
        </span>
      ),
    },
    { nombre: "Instagram", logo: <LogoInstagram className="size-7" /> },
    { nombre: "Facebook", logo: <LogoFacebook className="size-7" /> },
  ]

  return (
    <section
      ref={raiz}
      data-escena
      aria-labelledby="titulo-cierre"
      className="flex flex-col items-center border-t border-[var(--regla)] pt-16 pb-6 text-center lg:pt-24 lg:pb-10"
    >
      <ul aria-hidden="true" className="flex items-center gap-3">
        {redes.map((red, i) => (
          <li key={red.nombre} className="js-red">
            <span
              className={cn(
                estilos.nota,
                "flex size-14 items-center justify-center rounded-[16px]"
              )}
              style={{ rotate: `${(i % 2 ? 1 : -1) * (4 + i)}deg` }}
            >
              {red.logo}
            </span>
          </li>
        ))}
      </ul>

      <h2
        id="titulo-cierre"
        className={cn(
          portada.titular,
          "js-sube mt-8 max-w-[18ch] text-[clamp(2.2rem,5vw,3.8rem)] text-balance"
        )}
      >
        Cada venta empieza con{" "}
        <span className="relative inline-block whitespace-nowrap">
          tu enlace.
          <Subrayado
            grosor={3}
            className="absolute -bottom-[0.12em] left-0 h-[0.24em] w-full"
          />
        </span>
      </h2>
      <Mano className="js-sube mt-4 text-[20px]">
        pégalo en tu bio, en tus estados y en cada historia
      </Mano>

      <div className="js-sube mt-8 flex w-full max-w-md items-center gap-2 rounded-full border border-[var(--regla)] bg-hoja p-1.5 pl-5">
        <span className="min-w-0 flex-1 truncate text-left text-[15px] font-semibold">
          {tienda.legible}
        </span>
        <button
          type="button"
          onClick={() => void copiar()}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-[var(--tinta)]/[0.06] px-4 text-[14px] font-semibold transition-colors hover:bg-[var(--tinta)]/[0.1]"
        >
          {copiado ? (
            <Check aria-hidden="true" className="size-4 text-[#1fa855]" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>

      <div className="js-sube mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <CompartirTienda {...tienda}>
          <button type="button" className={portada.boton}>
            <Share2 aria-hidden="true" className="size-4" />
            Compartir con QR y mensaje
          </button>
        </CompartirTienda>
        <a
          href={tienda.url}
          target="_blank"
          rel="noreferrer noopener"
          className={portada.enlace}
        >
          Ver tienda
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      </div>
    </section>
  )
}
