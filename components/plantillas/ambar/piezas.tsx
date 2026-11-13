import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"
import { useId, type ReactNode } from "react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { descuento } from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { leerOpciones } from "@/lib/variantes"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import type {
  PropsEncabezado,
  PropsPie,
  PropsTarjeta,
  PropsVacio,
} from "@/components/plantillas/kit"
import { PrecioDeVitrina } from "@/components/tienda/precio"
import { SiRecibePedidos } from "@/components/tienda/carrito"

/**
 * Las piezas de Ámbar.
 *
 * Una perfumería de zoco de noche: bandas de tinta separadas por una regla de
 * estrellas de ocho puntas, y las tarjetas también de tinta —la única
 * plantilla con tarjetas oscuras—, como frascos en una vitrina iluminada. El
 * púrpura oud va en lo que se compra y en la rebaja.
 */

/** Una estrella de ocho puntas, centrada en (12, 6), para el patrón de la regla. */
const ESTRELLA = (() => {
  const puntos: string[] = []
  for (let i = 0; i < 16; i++) {
    const radio = i % 2 === 0 ? 4.6 : 1.9
    const angulo = (Math.PI / 8) * i - Math.PI / 2
    puntos.push(
      `${(12 + radio * Math.cos(angulo)).toFixed(2)},${(6 + radio * Math.sin(angulo)).toFixed(2)}`
    )
  }
  return `M${puntos.join("L")}Z`
})()

/** La regla de estrellas: una fila de ellas, del color del texto. */
export function ReglaDeEstrellas({ className }: { className?: string }) {
  const id = `estrellas-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  return (
    <svg aria-hidden="true" className={cn("block h-3 w-full", className)}>
      <defs>
        <pattern id={id} width="24" height="12" patternUnits="userSpaceOnUse">
          <path d={ESTRELLA} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** Una estrella sola, para abrir un título. */
export function Estrella({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="6 0 12 12"
      className={cn("inline-block size-3 shrink-0", className)}
    >
      <path d={ESTRELLA} fill="currentColor" />
    </svg>
  )
}

const BOTON_CLARO =
  "group inline-flex min-h-12 items-center justify-center gap-3 rounded-plantilla bg-papel px-7 text-sm font-medium text-tinta transition-colors hover:bg-senal hover:text-white active:scale-[0.98]"
const BOTON =
  "group inline-flex min-h-12 items-center justify-center gap-3 rounded-plantilla bg-tinta px-7 text-sm font-medium text-papel transition-colors hover:bg-senal active:scale-[0.98]"

/** El botón de Ámbar; `claro` va sobre las bandas de tinta. */
export function Boton({
  href,
  claro = false,
  className,
  children,
}: {
  href: string
  claro?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={cn(claro ? BOTON_CLARO : BOTON, className)}>
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
      />
    </Link>
  )
}

/** Si un producto se vende por mililitros: ahí sirve explicar el decant. */
export function seVendePorMl(producto: {
  name: string
  opciones: unknown
}): boolean {
  const valores = leerOpciones(producto.opciones).flatMap((o) => o.valores)
  return [producto.name, ...valores].some((t) => /\d\s*ml\b|decant/i.test(t))
}

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"
  const notas = producto.description?.split("\n")[0]?.trim()

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block rounded-plantilla bg-tinta p-1.5 text-papel"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[calc(var(--radio)*0.6)] bg-papel/10",
          retrato ? "aspect-[3/4]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
            className={cn(
              "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transform-none",
              agotado && "opacity-45"
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-30" />
          </div>
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ring-1 ring-papel/20 ring-inset"
        />
        {rebaja && !agotado ? (
          <span className="tabular absolute top-2 left-2 border border-papel bg-senal px-2 py-0.5 text-xs font-medium text-white">
            −{rebaja}%
          </span>
        ) : null}
        {agotado ? (
          <span className="absolute inset-x-0 bottom-3 text-center text-xs tracking-[0.18em] uppercase">
            Agotado
          </span>
        ) : null}
      </div>

      <div className="px-1.5 pt-3 pb-2">
        <h3 className="text-sm leading-snug font-medium">{producto.name}</h3>
        {notas ? (
          <p className="mt-0.5 truncate text-xs opacity-70">{notas}</p>
        ) : null}
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="tabular">
            <PrecioDeVitrina producto={producto} />
          </span>
          {producto.compare_at_price_cents ? (
            <span className="tabular text-xs line-through opacity-55">
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
    "grid grid-cols-2 gap-3 md:gap-5",
    columnas >= 3 && "md:grid-cols-3",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** El título de una sección: una estrella púrpura y el cúfico. */
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
      <div className="flex min-w-0 items-center gap-3">
        <Estrella className="size-4 text-senal" />
        <Etiqueta className="min-w-0 font-titular text-[clamp(1.625rem,6vw,2.5rem)] leading-[1.1]">
          {titulo}
        </Etiqueta>
      </div>
      {enlace ? (
        <Link
          href={enlace.href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm underline decoration-tinta/30 underline-offset-[6px] transition-colors hover:text-senal hover:decoration-senal"
        >
          {enlace.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-medium tracking-[0.16em] uppercase">
      {children}
    </span>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div>
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.25rem,9vw,4rem)] leading-[1.05]",
          antetitulo && "mt-3"
        )}
      >
        {titulo}
      </h1>
      {bajada ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-75">{bajada}</p>
      ) : null}
      <ReglaDeEstrellas className="mt-6 text-tinta/25" />
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className="bg-tinta px-6 py-16 text-center text-papel md:py-24">
      <ReglaDeEstrellas className="mx-auto max-w-xs text-papel/35" />
      <h2 className="mt-8 font-titular text-[clamp(1.75rem,7vw,2.75rem)] leading-tight">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Boton href={accion.href} claro className="mt-8">
          {accion.etiqueta}
        </Boton>
      ) : null}
    </div>
  )
}

/** La casa, sobre la arena: quién vende y cómo se compra. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-20 md:py-24">
      <div>
        <Rotulo>La casa</Rotulo>
        <h2 className="mt-4 font-titular text-[clamp(2.25rem,9vw,4.5rem)] leading-[1.02]">
          {tienda.nombre}
        </h2>
        {tienda.descripcion ? (
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed opacity-80">
            {tienda.descripcion}
          </p>
        ) : null}
      </div>

      <dl>
        <SiRecibePedidos>
          <Dato titulo="Cómo comprar">
            Elige tus perfumes, del decant al frasco, y envíanos el pedido por
            WhatsApp. Ahí coordinamos el pago y la entrega.
          </Dato>
        </SiRecibePedidos>
        {tienda.whatsapp ? (
          <Dato titulo="¿No sabes cuál elegir?">
            <a
              href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 items-center gap-2 underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-senal hover:decoration-senal"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Te asesoramos por WhatsApp
            </a>
          </Dato>
        ) : null}
      </dl>
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

/** El pie: una banda de tinta con la regla de estrellas y el nombre al centro. */
export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-sm opacity-75 transition-opacity hover:opacity-100"

  return (
    <footer className="bg-tinta text-papel">
      <ReglaDeEstrellas className="text-papel/35" />
      <div className="mx-auto w-full max-w-7xl px-5 pt-12 pb-8 text-center">
        <p className="font-titular text-3xl leading-tight md:text-4xl">
          {marco.nombre}
        </p>
        <nav
          aria-label="Tienda"
          className="mt-6 flex flex-wrap items-center justify-center gap-x-8"
        >
          <Link href={rutaDeTienda(marco.slug, "")} className={enlace}>
            Inicio
          </Link>
          <Link href={rutaDeTienda(marco.slug, "/catalogo")} className={enlace}>
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
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-papel/15 pt-6 text-sm sm:flex-row">
          <p className="opacity-70">
            Los pedidos y el pago los coordinamos por WhatsApp.
          </p>
          <Link href="/" className={enlace}>
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
