import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, ImageOff, MessageCircle } from "lucide-react"
import type { ReactNode } from "react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { CONDICIONES, descuento } from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import type {
  PropsEncabezado,
  PropsPie,
  PropsTarjeta,
  PropsVacio,
} from "@/components/plantillas/kit"

/**
 * Las piezas de Pisada.
 *
 * La gramática de la cancha: cada par sobre su placa redondeada, titulares
 * condensados en cursiva que se inclinan hacia adelante, una barra verde
 * sesgada que marca cada sección y los precios grandes, porque en calzado el
 * precio es lo segundo que se mira después del perfil.
 */

/** La placa: el fondo redondeado donde se apoya cada par. */
export const PLACA = "rounded-[1.25rem] bg-tinta/[0.06]"

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block active:scale-[0.985] motion-reduce:transform-none"
    >
      <div
        className={cn(
          "relative overflow-hidden",
          PLACA,
          retrato ? "aspect-[3/4]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 320px"
            className={cn(
              "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] group-hover:-rotate-2 motion-reduce:transform-none",
              agotado && "opacity-45 grayscale"
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {rebaja && !agotado ? (
            <span className="rounded-full bg-senal px-2.5 py-1 text-[11px] font-bold text-white">
              −{rebaja}%
            </span>
          ) : null}
          {producto.condition !== "nuevo" ? (
            <span className="rounded-full bg-papel px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase">
              {CONDICIONES[producto.condition]}
            </span>
          ) : null}
          {agotado ? (
            <span className="rounded-full bg-tinta px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-papel uppercase">
              Agotado
            </span>
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className="absolute right-2.5 bottom-2.5 flex size-9 items-center justify-center rounded-full bg-papel opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <div className="mt-3 px-0.5">
        <h3 className="line-clamp-2 font-titular text-lg leading-[0.95] italic md:text-xl">
          {producto.name}
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span
            className={cn(
              "tabular text-base font-semibold",
              rebaja && "text-senal"
            )}
          >
            {formatMoney(producto.price_cents)}
          </span>
          {producto.compare_at_price_cents ? (
            <span className="tabular text-sm line-through opacity-55">
              {formatMoney(producto.compare_at_price_cents)}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}

export function grilla(columnas: number) {
  return cn(
    "grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 md:gap-y-10",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** La barra sesgada que abre cada sección, como la línea de una pista. */
function Barra() {
  return (
    <span
      aria-hidden="true"
      className="mr-3 inline-block h-[0.72em] w-[0.28em] -skew-x-[14deg] bg-senal align-baseline"
    />
  )
}

export function Titulo({
  titulo,
  enlace,
  como = "h2",
}: {
  titulo: string
  enlace?: { etiqueta: string; href: string }
  como?: "h1" | "h2"
}) {
  const Etiqueta = como

  return (
    <div className="flex items-end justify-between gap-4">
      <Etiqueta className="min-w-0 font-titular text-[clamp(2.25rem,9vw,4.25rem)] leading-[0.9] italic">
        <Barra />
        {titulo}
      </Etiqueta>
      {enlace ? (
        <Link
          href={enlace.href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-[11px] font-bold tracking-[0.1em] uppercase transition-colors hover:bg-tinta hover:text-papel"
        >
          {enlace.etiqueta}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
          />
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[0.12em] uppercase">
      {children}
    </span>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="pb-4">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.75rem,11vw,5.5rem)] leading-[0.88] italic",
          antetitulo && "mt-2"
        )}
      >
        <Barra />
        {titulo}
      </h1>
      {bajada ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-75">{bajada}</p>
      ) : null}
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className={cn("px-5 py-14 text-center md:py-20", PLACA)}>
      <h2 className="font-titular text-[clamp(2.25rem,9vw,3.75rem)] leading-[0.9] italic">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Link
          href={accion.href}
          className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-plantilla bg-tinta px-7 text-xs font-bold tracking-[0.1em] text-papel uppercase transition-colors hover:bg-senal hover:text-white active:scale-[0.98]"
        >
          {accion.etiqueta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

/** El cierre: el catálogo entero en una placa verde, y cómo se compra. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      {tienda.productos.length > 0 ? (
        <Link
          href={rutaDeTienda(tienda.slug, "/catalogo")}
          className="group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-senal p-6 text-white active:scale-[0.99] md:min-h-64 md:p-10"
        >
          <span className="tabular text-xs font-bold tracking-[0.12em] uppercase">
            {tienda.productos.length}{" "}
            {tienda.productos.length === 1 ? "modelo" : "modelos"}
          </span>
          <span className="flex items-end justify-between gap-4">
            <span className="font-titular text-[clamp(3rem,14vw,8.5rem)] leading-[0.82] italic">
              Ver todo
            </span>
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-tinta transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none md:size-20">
              <ArrowRight aria-hidden="true" className="size-6 md:size-8" />
            </span>
          </span>
        </Link>
      ) : null}

      <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-[1.3fr_1fr] md:gap-16">
        <div>
          <Rotulo>La tienda</Rotulo>
          <h2 className="mt-3 font-titular text-[clamp(2.25rem,9vw,4.5rem)] leading-[0.9] italic">
            {tienda.nombre}
          </h2>
          {tienda.descripcion ? (
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed opacity-80">
              {tienda.descripcion}
            </p>
          ) : null}
        </div>
        <ul className="flex flex-col gap-2 self-end">
          <li className={cn("px-5 py-4 text-sm font-semibold", PLACA)}>
            Arma tu pedido y mándalo por WhatsApp: ahí se cierra el pago y la
            entrega.
          </li>
          {tienda.whatsapp ? (
            <li>
              <a
                href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-h-14 items-center justify-between gap-3 rounded-plantilla bg-tinta px-5 text-sm font-semibold text-papel transition-colors hover:bg-senal hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <MessageCircle aria-hidden="true" className="size-5" />
                  ¿No sabes tu talla? Pregúntanos
                </span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  )
}

export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-xs font-bold tracking-[0.1em] uppercase opacity-80 transition-opacity hover:opacity-100"

  return (
    <footer className="bg-tinta text-papel">
      <div className="mx-auto w-full max-w-7xl px-5 pt-14 pb-8">
        <p className="font-titular text-[clamp(3rem,15vw,9rem)] leading-[0.82] italic">
          {marco.nombre}
        </p>

        <div className="mt-10 grid gap-x-8 gap-y-6 border-t border-papel/20 pt-6 sm:grid-cols-3">
          <nav aria-label="Tienda" className="flex flex-col">
            <Link href={rutaDeTienda(marco.slug, "")} className={enlace}>
              Inicio
            </Link>
            <Link
              href={rutaDeTienda(marco.slug, "/catalogo")}
              className={enlace}
            >
              Catálogo
            </Link>
            {marco.whatsapp ? (
              <a
                href={`https://wa.me/${numeroDeWhatsApp(marco.whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className={enlace}
              >
                WhatsApp
              </a>
            ) : null}
          </nav>

          <p className="text-sm leading-relaxed opacity-70">
            Los pedidos y el pago se acuerdan con la tienda por WhatsApp.
          </p>

          <Link
            href="/"
            className="flex min-h-11 items-center text-xs tracking-[0.1em] uppercase opacity-70 transition-opacity hover:opacity-100 sm:justify-end"
          >
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
