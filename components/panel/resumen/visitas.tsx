"use client"

import { useRef, type ReactNode } from "react"
import Link from "next/link"
import { BookOpen, Globe, Link2, QrCode } from "lucide-react"

import { formatNumber } from "@/lib/format"
import type { Origen } from "@/lib/visitas"
import type { ResumenDeVisitas } from "@/lib/visitas-resumen"
import { cn } from "@/lib/utils"
import {
  LogoFacebook,
  LogoInstagram,
  LogoTikTok,
  LogoWhatsApp,
} from "@/components/portada/logos"
import portada from "@/components/portada/portada.module.css"
import { entra, contar, useEscena } from "@/components/panel/resumen/escena"
import {
  BAJADA,
  Mano,
  Rotulo,
  TITULAR,
} from "@/components/panel/resumen/piezas"
import estilos from "@/components/panel/resumen/resumen.module.css"

function IconoDeOrigen({ origen }: { origen: Origen }) {
  const iconos: Partial<Record<Origen, ReactNode>> = {
    whatsapp: <LogoWhatsApp className="size-6" />,
    tiktok: (
      <span className="flex size-6 items-center justify-center rounded-full bg-black">
        <LogoTikTok className="size-4" />
      </span>
    ),
    instagram: <LogoInstagram className="size-6" />,
    facebook: <LogoFacebook className="size-6" />,
    qr: <QrCode aria-hidden="true" className="size-5" />,
    catalogo: <BookOpen aria-hidden="true" className="size-5" />,
    directo: <Link2 aria-hidden="true" className="size-5" />,
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--regla)] bg-white">
      {iconos[origen] ?? <Globe aria-hidden="true" className="size-5" />}
    </span>
  )
}

/**
 * Quién visita la tienda, si Venduo le activó las visitas: de dónde llegan,
 * en barras que crecen, y el camino de la visita al pago, en un embudo que se
 * va angostando. Lo que se mira y no se compra, anotado al costado.
 */
export function Visitas({ visitas }: { visitas: ResumenDeVisitas }) {
  const raiz = useRef<HTMLElement>(null)
  const sinVisitas = visitas.visitas === 0 && visitas.visitantes === 0
  const origenes = visitas.origenes
    .filter((origen) => origen.visitas > 0)
    .sort((a, b) => b.visitas - a.visitas)
  const maximoDeOrigen = Math.max(...origenes.map((o) => o.visitas), 1)
  const recorrido = visitas.recorrido
  const tope = Math.max(recorrido[0]?.cantidad ?? 0, 1)
  const pedidos = recorrido[3]?.cantidad ?? 0
  const deCadaCien =
    visitas.visitantes > 0
      ? Math.round((pedidos / visitas.visitantes) * 100)
      : 0

  useEscena(raiz, (tl, piezas) => {
    contar(
      tl,
      piezas(".js-visitantes")[0],
      visitas.visitantes,
      formatNumber,
      0.1
    )
    entra(
      tl,
      piezas(".js-origen-barra"),
      {
        scaleX: 0,
        transformOrigin: "0% 50%",
        duration: 1,
        ease: "expo.out",
        stagger: 0.08,
      },
      0.35
    )
    entra(
      tl,
      piezas(".js-etapa"),
      {
        scaleX: 0,
        transformOrigin: "50% 50%",
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.16,
      },
      0.5
    )
  })

  return (
    <section
      ref={raiz}
      data-escena
      id="visitas"
      aria-labelledby="titulo-visitas"
      className="py-12 lg:py-20"
    >
      <Rotulo>Quién visita tu tienda</Rotulo>
      {sinVisitas ? (
        <>
          <h2 id="titulo-visitas" className={TITULAR}>
            Todavía sin visitas.
          </h2>
          <p className={BAJADA}>
            Cuando alguien abra tu tienda desde WhatsApp, TikTok, un QR o un
            catálogo, va a aparecer aquí.
          </p>
        </>
      ) : (
        <>
          <h2 id="titulo-visitas" className={TITULAR}>
            <span className={cn(portada.cifras, "js-visitantes")}>
              {formatNumber(visitas.visitantes)}
            </span>{" "}
            {visitas.visitantes === 1 ? "persona miró" : "personas miraron"}{" "}
            <span className={portada.resaltado}>tu tienda.</span>
          </h2>
          <p className={BAJADA}>
            En los últimos {visitas.dias} días, sin identificar a nadie.
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="js-sube">
              <h3 className="text-[12.5px] font-semibold tracking-[0.12em] text-[var(--tinta)]/55 uppercase">
                De dónde llegan
              </h3>
              <ul className="mt-5 flex flex-col gap-3.5">
                {origenes.map((origen) => (
                  <li
                    key={origen.origen}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                  >
                    <IconoDeOrigen origen={origen.origen} />
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold">
                        {origen.nombre}
                      </span>
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-[var(--tinta)]/[0.06]">
                        <span
                          className="js-origen-barra block h-full rounded-full bg-[var(--tinta)]"
                          style={{
                            width: `${(origen.visitas / maximoDeOrigen) * 100}%`,
                          }}
                        />
                      </span>
                    </span>
                    <span
                      className={cn(
                        portada.titular,
                        portada.cifras,
                        "text-[19px]"
                      )}
                    >
                      {formatNumber(origen.visitas)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="js-sube">
              <h3 className="text-[12.5px] font-semibold tracking-[0.12em] text-[var(--tinta)]/55 uppercase">
                De la visita al pago
              </h3>
              <ol className="mt-5 flex flex-col items-center gap-1.5">
                {recorrido.map((etapa, i) => {
                  const ancho = Math.max((etapa.cantidad / tope) * 100, 14)
                  return (
                    <li
                      key={etapa.etapa}
                      className="relative flex h-12 w-full items-center justify-center"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "js-etapa absolute inset-y-0 rounded-[10px]",
                          i === recorrido.length - 1
                            ? "bg-[var(--boli)]"
                            : "bg-[var(--tinta)]"
                        )}
                        style={{
                          width: `${ancho}%`,
                          opacity: 1 - i * 0.14,
                        }}
                      />
                      <span className="relative flex items-baseline gap-2 rounded-full bg-white/90 px-3 py-0.5 text-[13.5px] font-semibold">
                        <span className={cn(portada.cifras, "font-bold")}>
                          {formatNumber(etapa.cantidad)}
                        </span>
                        {etapa.etapa}
                      </span>
                    </li>
                  )
                })}
              </ol>
              {pedidos > 0 ? (
                <Mano className="mt-5 text-center text-[20px]">
                  de cada 100 que entran, {deCadaCien}{" "}
                  {deCadaCien === 1 ? "te pide" : "te piden"}
                </Mano>
              ) : null}
            </div>
          </div>

          {visitas.muyVistosPocoVendidos.length > 0 ? (
            <div
              className={cn(
                estilos.nota,
                "js-sube mt-12 rounded-[20px] p-5 sm:p-6"
              )}
            >
              <Mano className="text-[20px]">
                se miran mucho y se venden poco
              </Mano>
              <p className="mt-1 text-[15px] text-[var(--tinta)]/60">
                Revisa su precio, su foto o su descripción.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {visitas.muyVistosPocoVendidos.map((producto) => (
                  <li key={producto.id}>
                    <Link
                      href={`/panel/productos/${producto.id}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--regla)] px-4 text-[14px] font-semibold transition-colors hover:border-[var(--tinta)]"
                    >
                      {producto.nombre}
                      <span className="font-normal text-[var(--tinta)]/55 tabular-nums">
                        {formatNumber(producto.vistas)} vistas
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
