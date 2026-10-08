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
 * Las piezas de Calle.
 *
 * La gramática es la de un fanzine pegado en la pared: marcos de 2 px en
 * tinta, titulares de afiche que llenan el ancho, etiquetas torcidas como
 * calcomanías y una sombra dura, sin desenfoque, que aparece al tocar. El
 * naranja va solo en lo que rebaja o se compra.
 */

/** La sombra dura de un recorte pegado. Va en tinta para seguir a la plantilla. */
const SOMBRA_DURA =
  "transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--tinta)] active:translate-x-0 active:translate-y-0 active:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className={cn("group block border-2 border-tinta bg-papel", SOMBRA_DURA)}
    >
      <div
        className={cn(
          "relative overflow-hidden border-b-2 border-tinta bg-tinta/[0.07]",
          retrato ? "aspect-[3/4]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 400px"
            className={cn("object-cover", agotado && "grayscale")}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}

        {rebaja && !agotado ? (
          <span className="absolute top-2 right-2 -rotate-6 bg-senal px-2 py-1 font-titular text-base leading-none text-white">
            −{rebaja}%
          </span>
        ) : null}
        {producto.condition !== "nuevo" ? (
          <span className="absolute top-2 left-2 rotate-3 border-2 border-tinta bg-papel px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase">
            {CONDICIONES[producto.condition]}
          </span>
        ) : null}
        {agotado ? (
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-3 bg-tinta py-1.5 text-center font-titular text-lg tracking-[0.04em] text-papel">
            Agotado
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2 p-2.5 md:p-3">
        <h3 className="line-clamp-2 min-w-0 text-[12px] leading-tight font-bold tracking-[0.04em] uppercase md:text-[13px]">
          {producto.name}
        </h3>
        <p className="flex shrink-0 flex-col items-end">
          {producto.compare_at_price_cents ? (
            <span className="tabular text-[11px] line-through opacity-55">
              {formatMoney(producto.compare_at_price_cents)}
            </span>
          ) : null}
          <span
            className={cn(
              "tabular font-titular text-lg leading-none md:text-xl",
              rebaja && "text-senal"
            )}
          >
            {formatMoney(producto.price_cents)}
          </span>
        </p>
      </div>
    </Link>
  )
}

/** Dos de ancho en el celular, tres o cuatro en la computadora, pegadas. */
export function grilla(columnas: number) {
  return cn(
    "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** El título de una sección: un afiche, con una barra gruesa arriba. */
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
    <div className="flex items-end justify-between gap-4 border-t-[6px] border-tinta pt-3">
      <Etiqueta className="min-w-0 font-titular text-[clamp(2.25rem,9vw,4.5rem)] leading-[0.9]">
        {titulo}
      </Etiqueta>
      {enlace ? (
        <Link
          href={enlace.href}
          className="group mb-1 inline-flex min-h-11 shrink-0 items-center gap-2 border-2 border-tinta px-3 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors hover:bg-tinta hover:text-papel"
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
    <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
      <span aria-hidden="true" className="size-2 bg-senal" />
      {children}
    </span>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="border-b-[6px] border-tinta pb-5">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.75rem,11vw,5.5rem)] leading-[0.88]",
          antetitulo && "mt-2"
        )}
      >
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
    <div className="border-2 border-dashed border-tinta px-5 py-14 text-center md:py-20">
      <h2 className="font-titular text-[clamp(2.25rem,9vw,3.75rem)] leading-[0.9]">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Link
          href={accion.href}
          className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-plantilla border-2 border-tinta bg-tinta px-7 text-xs font-bold tracking-[0.14em] text-papel uppercase transition-colors hover:border-senal hover:bg-senal hover:text-white active:scale-[0.98]"
        >
          {accion.etiqueta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

/**
 * Cómo se cierra la portada: el catálogo como un afiche que ocupa todo el
 * ancho, y quién vende, con su WhatsApp.
 */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  const catalogo = rutaDeTienda(tienda.slug, "/catalogo")

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      {tienda.productos.length > 0 ? (
        <Link
          href={catalogo}
          className={cn(
            "group flex items-center justify-between gap-4 border-2 border-tinta bg-senal px-5 py-6 text-white md:px-8 md:py-10",
            SOMBRA_DURA
          )}
        >
          <span className="font-titular text-[clamp(2.75rem,13vw,8rem)] leading-[0.85]">
            Ver todo
          </span>
          <span className="flex flex-col items-end gap-2 text-right">
            <ArrowRight
              aria-hidden="true"
              className="size-8 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none md:size-12"
            />
            <span className="tabular text-[11px] font-bold tracking-[0.12em] uppercase">
              {tienda.productos.length}{" "}
              {tienda.productos.length === 1 ? "producto" : "productos"}
            </span>
          </span>
        </Link>
      ) : null}

      <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div>
          <Rotulo>Quién vende</Rotulo>
          <h2 className="mt-3 font-titular text-[clamp(2.25rem,9vw,4.5rem)] leading-[0.9]">
            {tienda.nombre}
          </h2>
          {tienda.descripcion ? (
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed opacity-80">
              {tienda.descripcion}
            </p>
          ) : null}
        </div>

        <div className="self-end border-2 border-tinta">
          <p className="border-b-2 border-tinta p-4 text-sm font-semibold">
            Arma tu pedido, mándalo por WhatsApp y lo cerramos en el chat:
            talla, pago y entrega.
          </p>
          {tienda.whatsapp ? (
            <a
              href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex min-h-14 items-center justify-between gap-3 px-4 text-xs font-bold tracking-[0.12em] uppercase transition-colors hover:bg-tinta hover:text-papel"
            >
              <span className="flex items-center gap-3">
                <MessageCircle aria-hidden="true" className="size-5" />
                ¿Dudas? Escríbenos
              </span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-xs font-bold tracking-[0.14em] uppercase opacity-80 transition-opacity hover:opacity-100"

  return (
    <footer className="border-t-[6px] border-senal bg-tinta text-papel">
      <div className="mx-auto w-full max-w-7xl px-5 pt-12 pb-8">
        <p className="font-titular text-[clamp(3rem,16vw,10rem)] leading-[0.82] break-words">
          {marco.nombre}
        </p>

        <div className="mt-10 grid gap-x-8 gap-y-6 border-t-2 border-papel/25 pt-6 sm:grid-cols-3">
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
            className="flex min-h-11 items-center text-xs tracking-[0.14em] uppercase opacity-70 transition-opacity hover:opacity-100 sm:justify-end"
          >
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
