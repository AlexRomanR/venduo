import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff } from "lucide-react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { CONDICIONES, descuento } from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type {
  PropsEncabezado,
  PropsPie,
  PropsTarjeta,
  PropsVacio,
} from "@/components/plantillas/kit"

/**
 * Las piezas de Pasarela.
 *
 * La gramática: reglas de 2 px en tinta que cierran cada sección, rótulos
 * pequeños en mayúsculas con aire, titulares condensados enormes, cero
 * esquinas redondeadas. El azul aparece solo donde se compra o se rebaja.
 */

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const segunda = producto.images[1]
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-tinta/[0.06]",
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
            className={cn(
              "object-cover transition-[opacity,transform] duration-500 motion-reduce:transition-none",
              segunda
                ? "group-hover:opacity-0"
                : "group-hover:scale-[1.03] motion-reduce:transform-none"
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-20" />
          </div>
        )}

        {/* La segunda foto aparece al pasar el cursor: en ropa, la espalda o
            el detalle deciden tanto como el frente. */}
        {segunda ? (
          <Image
            src={segunda}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 300px"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
          />
        ) : null}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {rebaja && !agotado ? (
            <span className="bg-senal px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
              −{rebaja}%
            </span>
          ) : null}
          {producto.condition !== "nuevo" ? (
            <span className="bg-papel px-2 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
              {CONDICIONES[producto.condition]}
            </span>
          ) : null}
        </div>

        {agotado ? (
          <span className="absolute inset-x-0 bottom-0 bg-tinta/85 py-2 text-center text-[11px] font-semibold tracking-[0.16em] text-papel uppercase">
            Agotado
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <h3 className="text-[13px] leading-snug font-medium tracking-[0.03em] uppercase transition-colors group-hover:text-senal">
          {producto.name}
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="tabular font-semibold">
            {formatMoney(producto.price_cents)}
          </span>
          {producto.compare_at_price_cents ? (
            <span className="tabular line-through opacity-45">
              {formatMoney(producto.compare_at_price_cents)}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}

/** El título de una sección: grande, a la izquierda, cerrado por una regla. */
export function TituloDeSeccion({
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
    <div className="flex items-end justify-between gap-4 border-b-2 border-tinta pb-3">
      <Etiqueta className="min-w-0 font-titular text-[clamp(1.75rem,6vw,3rem)] leading-[0.95]">
        {titulo}
      </Etiqueta>
      {enlace ? (
        <Link
          href={enlace.href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase transition-colors hover:text-senal"
        >
          {enlace.etiqueta}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
          />
        </Link>
      ) : null}
    </div>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="border-b-2 border-tinta pb-5">
      {antetitulo ? (
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-60">
          {antetitulo}
        </p>
      ) : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.25rem,8vw,4.5rem)] leading-[0.92]",
          antetitulo && "mt-2"
        )}
      >
        {titulo}
      </h1>
      {bajada ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-70">{bajada}</p>
      ) : null}
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className="border-y-2 border-tinta py-14 text-center md:py-20">
      <h2 className="font-titular text-[clamp(1.75rem,6vw,2.75rem)] leading-none">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-70">
        {texto}
      </p>
      {accion ? (
        <Link
          href={accion.href}
          className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-plantilla bg-tinta px-7 text-xs font-semibold tracking-[0.16em] text-papel uppercase transition-colors hover:bg-senal hover:text-white"
        >
          {accion.etiqueta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

export function Pie({ marco }: PropsPie) {
  return (
    <footer className="bg-tinta text-papel">
      <div className="mx-auto w-full max-w-7xl px-5 pt-14 pb-8">
        <p className="font-titular text-[clamp(2.5rem,12vw,7rem)] leading-[0.88]">
          {marco.nombre}
        </p>

        <div className="mt-10 grid gap-x-8 gap-y-6 border-t border-papel/20 pt-6 sm:grid-cols-3">
          <nav aria-label="Tienda" className="flex flex-col">
            <Link
              href={rutaDeTienda(marco.slug, "")}
              className="flex min-h-11 items-center text-xs font-semibold tracking-[0.16em] uppercase opacity-80 transition-opacity hover:opacity-100"
            >
              Inicio
            </Link>
            <Link
              href={rutaDeTienda(marco.slug, "/catalogo")}
              className="flex min-h-11 items-center text-xs font-semibold tracking-[0.16em] uppercase opacity-80 transition-opacity hover:opacity-100"
            >
              Catálogo
            </Link>
            {marco.whatsapp ? (
              <a
                href={`https://wa.me/${numeroDeWhatsApp(marco.whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-h-11 items-center text-xs font-semibold tracking-[0.16em] uppercase opacity-80 transition-opacity hover:opacity-100"
              >
                WhatsApp
              </a>
            ) : null}
          </nav>

          <p className="text-sm leading-relaxed opacity-60 sm:col-span-1">
            Los pedidos y el pago se acuerdan con la tienda por WhatsApp.
          </p>

          <Link
            href="/"
            className="flex min-h-11 items-center text-xs tracking-[0.16em] uppercase opacity-60 transition-opacity hover:opacity-100 sm:justify-end"
          >
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
