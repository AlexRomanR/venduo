import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"
import type { ReactNode } from "react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { descuento } from "@/lib/plantillas/bloques"
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
 * Las piezas de Atelier.
 *
 * La gramática de una casa de marroquinería: cada pieza entera sobre su paño,
 * nunca recortada; reglas finas y dobles en lugar de marcos; la didona en
 * cursiva para los nombres y versalitas espaciadas para los datos. El burdeos
 * aparece en lo que se compra y en la rebaja, escrita y no en un sello.
 */

/** El paño: un tono apenas más hondo que el papel, donde se apoya la pieza. */
export const PANO = "bg-tinta/[0.045]"

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[calc(var(--radio)*0.5)]",
          PANO,
          retrato ? "aspect-[4/5]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 420px"
            className={cn(
              "object-contain p-[9%] transition-transform duration-700 ease-out group-hover:-translate-y-[2%] group-hover:scale-[1.03] motion-reduce:transform-none",
              agotado && "opacity-50"
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}

        {agotado ? (
          <span className="absolute inset-x-0 bottom-4 text-center text-[11px] tracking-[0.24em] uppercase">
            Agotada
          </span>
        ) : null}
      </div>

      <div className="mt-4 text-center">
        <h3 className="mt-1 font-titular text-lg leading-snug italic transition-colors group-hover:text-senal md:text-xl">
          {producto.name}
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2 text-[13px] tracking-[0.08em]">
          <span className="tabular">{formatMoney(producto.price_cents)}</span>
          {producto.compare_at_price_cents ? (
            <span className="tabular line-through opacity-55">
              {formatMoney(producto.compare_at_price_cents)}
            </span>
          ) : null}
          {rebaja && !agotado ? (
            <span className="text-senal">−{rebaja}%</span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}

export function grilla(columnas: number) {
  return cn(
    "grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** El título de una sección: la didona, y una regla fina que sigue hasta el borde. */
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
    <div className="flex items-end gap-4 md:gap-6">
      <Etiqueta className="min-w-0 font-titular text-[clamp(2rem,7vw,3.75rem)] leading-[1.02]">
        {titulo}
      </Etiqueta>
      <span
        aria-hidden="true"
        className="mb-[0.6em] hidden h-px flex-1 bg-tinta/30 sm:block"
      />
      {enlace ? (
        <Link
          href={enlace.href}
          className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 text-[11px] tracking-[0.22em] uppercase underline decoration-tinta/30 underline-offset-[6px] transition-colors hover:text-senal hover:decoration-senal sm:ml-0"
        >
          {enlace.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] tracking-[0.22em] uppercase">{children}</span>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="border-b-[3px] border-double border-tinta/40 pb-6">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.5rem,9vw,4.75rem)] leading-[1]",
          antetitulo && "mt-3"
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
    <div className="border-y-[3px] border-double border-tinta/40 py-16 text-center md:py-24">
      <h2 className="font-titular text-[clamp(2rem,7vw,3.25rem)] leading-tight italic">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Link
          href={accion.href}
          className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-plantilla bg-tinta px-8 text-[11px] tracking-[0.22em] text-papel uppercase transition-colors hover:bg-senal hover:text-white active:scale-[0.98]"
        >
          {accion.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}

/** La casa: quién está detrás y cómo se compra, con aire de tarjeta de visita. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="border-t-[3px] border-double border-tinta/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.3fr_1fr] md:gap-20 md:py-24">
        <div>
          <Rotulo>La casa</Rotulo>
          <h2 className="mt-4 font-titular text-[clamp(2.5rem,10vw,5.5rem)] leading-[0.98] italic">
            {tienda.nombre}
          </h2>
          {tienda.descripcion ? (
            <p className="mt-6 max-w-[50ch] text-lg leading-relaxed opacity-80">
              {tienda.descripcion}
            </p>
          ) : null}
          {tienda.productos.length > 0 ? (
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo")}
              className="group mt-8 inline-flex min-h-12 items-center gap-3 rounded-plantilla bg-tinta px-8 text-[11px] tracking-[0.22em] text-papel uppercase transition-colors hover:bg-senal hover:text-white active:scale-[0.98]"
            >
              Ver la colección
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
              />
            </Link>
          ) : null}
        </div>

        <dl className="self-end">
          <Dato titulo="Cómo comprar">
            Elige tus piezas y manda el pedido por WhatsApp. Ahí acordamos el
            pago y la entrega.
          </Dato>
          {tienda.whatsapp ? (
            <Dato titulo="De cerca">
              <a
                href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-senal hover:decoration-senal"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                ¿Quieres más fotos o las medidas? Escríbenos
              </a>
            </Dato>
          ) : null}
        </dl>
      </div>
    </section>
  )
}

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-t border-tinta/20 py-5">
      <dt>
        <Rotulo>{titulo}</Rotulo>
      </dt>
      <dd className="mt-2 leading-relaxed opacity-85">{children}</dd>
    </div>
  )
}

export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-[11px] tracking-[0.22em] uppercase opacity-75 transition-opacity hover:opacity-100"

  return (
    <footer className="bg-tinta text-papel">
      <div className="mx-auto w-full max-w-7xl px-5 pt-16 pb-8">
        <p className="font-titular text-[clamp(2.75rem,12vw,7.5rem)] leading-[0.95] italic">
          {marco.nombre}
        </p>

        <div className="mt-12 grid gap-x-8 gap-y-6 border-t border-papel/20 pt-6 sm:grid-cols-3">
          <nav aria-label="Tienda" className="flex flex-col">
            <Link href={rutaDeTienda(marco.slug, "")} className={enlace}>
              Inicio
            </Link>
            <Link
              href={rutaDeTienda(marco.slug, "/catalogo")}
              className={enlace}
            >
              Colección
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
            className="flex min-h-11 items-center text-[11px] tracking-[0.22em] uppercase opacity-70 transition-opacity hover:opacity-100 sm:justify-end"
          >
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
