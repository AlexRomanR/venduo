import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"
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
 * Las piezas de Bazar.
 *
 * La gramática de un mostrador de feria: todo redondeado, el precio en una
 * etiqueta torcida pegada sobre la foto como en una góndola, un subrayado a
 * mano bajo cada título y mucho a la vista. La etiqueta va en fucsia solo
 * cuando hay rebaja: si todas lo fueran, ninguna se notaría.
 */

/** El marco redondeado de una foto. */
export const MARCO = "rounded-[1.1rem]"

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block rounded-[1.4rem] border-2 border-tinta/10 bg-papel p-1.5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-tinta active:translate-y-0 motion-reduce:transform-none"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-tinta/[0.06]",
          MARCO,
          retrato ? "aspect-[3/4]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 300px"
            className={cn("object-cover", agotado && "opacity-50 grayscale")}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}

        {producto.condition !== "nuevo" ? (
          <span className="absolute top-2 left-2 rounded-full bg-papel px-2.5 py-1 text-[10px] font-semibold">
            {CONDICIONES[producto.condition]}
          </span>
        ) : null}

        {/* La etiqueta de precio, pegada y torcida como en una góndola. */}
        <span
          className={cn(
            "tabular absolute right-2 bottom-2 -rotate-6 rounded-full px-3 py-1.5 font-titular text-[15px] leading-none transition-transform duration-300 group-hover:rotate-0 motion-reduce:transition-none",
            agotado
              ? "bg-tinta text-papel"
              : rebaja
                ? "bg-senal text-white"
                : "border-2 border-tinta bg-papel"
          )}
        >
          {agotado ? "Agotado" : formatMoney(producto.price_cents)}
        </span>
      </div>

      <div className="px-2 pt-2.5 pb-2">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
          {producto.name}
        </h3>
        {producto.compare_at_price_cents && !agotado ? (
          <p className="mt-1 flex items-baseline gap-2 text-xs">
            <span className="tabular line-through opacity-60">
              {formatMoney(producto.compare_at_price_cents)}
            </span>
            {rebaja ? (
              <span className="font-semibold text-senal">−{rebaja}%</span>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  )
}

export function grilla(columnas: number) {
  return cn(
    "grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** El subrayado a mano, en fucsia: ondulado, como hecho con marcador. */
function Subrayado({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 10"
      preserveAspectRatio="none"
      className={cn("h-2.5 w-24 text-senal md:h-3 md:w-32", className)}
    >
      <path
        d="M2 6 C 14 1, 22 9, 34 5 S 56 1, 68 5 S 92 9, 104 4 S 116 3, 118 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
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
      <div className="min-w-0">
        <Etiqueta className="font-titular text-[clamp(2rem,7.5vw,3.5rem)] leading-[0.98]">
          {titulo}
        </Etiqueta>
        <Subrayado className="mt-1.5" />
      </div>
      {enlace ? (
        <Link
          href={enlace.href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-plantilla bg-tinta/[0.07] px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
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
    <span className="inline-flex items-center gap-2 text-xs font-semibold">
      <span aria-hidden="true" className="size-2 rounded-full bg-senal" />
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
          "font-titular text-[clamp(2.5rem,10vw,4.75rem)] leading-[0.95]",
          antetitulo && "mt-2"
        )}
      >
        {titulo}
      </h1>
      <Subrayado className="mt-2" />
      {bajada ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-75">{bajada}</p>
      ) : null}
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className="rounded-[1.75rem] border-2 border-dashed border-tinta/25 px-5 py-14 text-center md:py-20">
      <h2 className="font-titular text-[clamp(2rem,8vw,3.25rem)] leading-tight">
        {titulo}
      </h2>
      <p className="mx-auto mt-3 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Link
          href={accion.href}
          className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-plantilla bg-tinta px-7 text-sm font-semibold text-papel transition-colors hover:bg-senal hover:text-white active:scale-[0.98]"
        >
          {accion.etiqueta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

/**
 * El cierre: el mostrador. Lo que no está a la vista se pide por WhatsApp, y
 * en un bazar eso es la mitad de las ventas.
 */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-12 md:px-5 md:py-16">
      <div className="grid gap-8 rounded-[2rem] bg-tinta px-6 py-10 text-papel md:grid-cols-[1.3fr_1fr] md:gap-14 md:px-12 md:py-14">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-senal-alta"
            />
            {tienda.nombre}
          </p>
          <h2 className="mt-4 font-titular text-[clamp(2.25rem,9vw,4.25rem)] leading-[0.98]">
            ¿Buscas algo que no ves?
          </h2>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed opacity-85">
            {tienda.descripcion ??
              "Escríbenos: si lo tenemos o lo conseguimos, te avisamos por WhatsApp."}
          </p>
        </div>

        <div className="flex flex-col justify-end gap-2.5">
          {tienda.whatsapp ? (
            <a
              href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex min-h-14 items-center justify-between gap-3 rounded-plantilla bg-senal px-6 font-semibold text-white transition-transform active:scale-[0.98]"
            >
              <span className="flex items-center gap-3">
                <MessageCircle aria-hidden="true" className="size-5" />
                Pregúntanos por WhatsApp
              </span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          ) : null}
          {tienda.productos.length > 0 ? (
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo")}
              className="flex min-h-14 items-center justify-between gap-3 rounded-plantilla bg-papel px-6 font-semibold text-tinta transition-transform active:scale-[0.98]"
            >
              <span>
                Ver todo{" "}
                <span className="tabular opacity-65">
                  ({tienda.productos.length})
                </span>
              </span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
          <p className="pt-2 text-sm opacity-70">
            Los pedidos y el pago se acuerdan por WhatsApp.
          </p>
        </div>
      </div>
    </section>
  )
}

export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-sm font-semibold opacity-80 transition-opacity hover:opacity-100"

  return (
    <footer className="mx-auto w-full max-w-7xl px-3 pb-3 md:px-5 md:pb-5">
      <div className="rounded-[2rem] border-2 border-tinta/10 px-6 pt-10 pb-6 md:px-12">
        <p className="font-titular text-[clamp(2.5rem,12vw,6.5rem)] leading-[0.95]">
          {marco.nombre}
        </p>

        <div className="mt-8 grid gap-x-8 gap-y-4 border-t-2 border-tinta/10 pt-5 sm:grid-cols-3">
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

          <p className="text-sm leading-relaxed opacity-75">
            Los pedidos y el pago se acuerdan con la tienda por WhatsApp.
          </p>

          <Link href="/" className={cn(enlace, "font-normal sm:justify-end")}>
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
