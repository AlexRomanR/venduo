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
import { OpcionesDeVitrina } from "@/components/tienda/opciones-de-vitrina"
import { PrecioDeVitrina } from "@/components/tienda/precio"
import { SiRecibePedidos } from "@/components/tienda/carrito"

/**
 * Las piezas de Crayón.
 *
 * Ropa de bebés y de niñas y niños: todo redondito, un garabato de crayón
 * verde bajo los títulos y, en cada tarjeta, la talla o la edad en una
 * etiqueta. Es la única plantilla de papel frío, un celeste nube.
 */

/** El zigzag del garabato, en un renglón de 12 de alto. */
const ZIGZAG = (() => {
  const puntos: string[] = []
  for (let x = 0, arriba = true; x <= 96; x += 8, arriba = !arriba) {
    puntos.push(`${x},${arriba ? 3 : 9}`)
  }
  return puntos.join(" ")
})()

/**
 * El garabato: un zigzag de crayón verde. Dos trazos casi encima, el segundo
 * más tenue, para que parezca hecho a mano.
 */
export function Garabato({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 12"
      className={cn("block h-3 w-24 text-senal", className)}
    >
      <polyline
        points={ZIGZAG}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={ZIGZAG}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45}
        transform="translate(0.8 -0.9)"
      />
    </svg>
  )
}

/** El radio de las tarjetas: muy redondo. */
export const RADIO = "rounded-[1.75rem]"

/** El botón de Crayón: una píldora verde, o con borde. */
export function Boton({
  href,
  externo = false,
  lleno = true,
  className,
  children,
}: {
  href: string
  externo?: boolean
  lleno?: boolean
  className?: string
  children: ReactNode
}) {
  const clases = cn(
    "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-7 text-sm font-semibold transition-[background-color,color,transform] active:scale-[0.98]",
    lleno
      ? "bg-senal text-white hover:bg-senal-alta"
      : "border-2 border-tinta bg-papel hover:bg-tinta hover:text-papel",
    className
  )
  if (externo) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={clases}
      >
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={clases}>
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
      />
    </Link>
  )
}

const ETIQUETA =
  "absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-papel px-3 py-1 text-xs font-semibold"

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
          "relative overflow-hidden bg-tinta/[0.06] transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:-rotate-1 motion-reduce:transform-none",
          RADIO,
          retrato ? "aspect-[4/5]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
            className={cn("object-cover", agotado && "opacity-45")}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}
        {/* La talla en la etiqueta; sin tallas, la edad de su categoría. */}
        <OpcionesDeVitrina
          producto={producto}
          opcion="talla"
          forma="rango"
          className={ETIQUETA}
          respaldo={
            producto.category ? (
              <span className={ETIQUETA}>{producto.category}</span>
            ) : null
          }
        />
        {rebaja && !agotado ? (
          <span className="tabular absolute right-3 bottom-3 flex size-11 items-center justify-center rounded-full bg-senal text-xs font-semibold text-white">
            −{rebaja}%
          </span>
        ) : null}
        {agotado ? (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-papel/90 py-1.5 text-center text-xs font-semibold">
            Agotado
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-sm leading-snug transition-colors group-hover:text-senal">
        {producto.name}
      </h3>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="tabular font-semibold">
          <PrecioDeVitrina producto={producto} />
        </span>
        {producto.compare_at_price_cents ? (
          <span className="tabular text-xs line-through opacity-55">
            {formatMoney(producto.compare_at_price_cents)}
          </span>
        ) : null}
      </p>
    </Link>
  )
}

export function grilla(columnas: number) {
  return cn(
    "grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5 md:gap-y-12",
    columnas >= 3 && "md:grid-cols-3",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** El título de una sección: la redonda, con el garabato debajo. */
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
        <Etiqueta className="font-titular text-[clamp(1.875rem,7vw,3rem)] leading-[1.02]">
          {titulo}
        </Etiqueta>
        <Garabato className="mt-2" />
      </div>
      {enlace ? (
        <Link
          href={enlace.href}
          className="inline-flex min-h-11 shrink-0 items-center rounded-full border-2 border-tinta/20 px-4 text-sm font-semibold transition-colors hover:border-tinta"
        >
          {enlace.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <span className="text-sm font-semibold">{children}</span>
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="pb-4">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.25rem,9vw,4.25rem)] leading-[1]",
          antetitulo && "mt-2"
        )}
      >
        {titulo}
      </h1>
      <Garabato className="mt-3" />
      {bajada ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-75">{bajada}</p>
      ) : null}
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div
      className={cn("bg-tinta/[0.05] px-6 py-16 text-center md:py-24", RADIO)}
    >
      <h2 className="font-titular text-[clamp(1.875rem,7vw,2.75rem)] leading-tight">
        {titulo}
      </h2>
      <Garabato className="mx-auto mt-3" />
      <p className="mx-auto mt-5 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <Boton href={accion.href} className="mt-8">
          {accion.etiqueta}
        </Boton>
      ) : null}
    </div>
  )
}

/** La tienda y cómo se compra, en una tarjeta redonda. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-20">
      <div
        className={cn(
          "grid gap-10 bg-papel px-6 py-12 ring-2 ring-tinta/10 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-16 md:px-12 md:py-16",
          RADIO
        )}
      >
        <div>
          <h2 className="font-titular text-[clamp(2.25rem,9vw,4.25rem)] leading-[1]">
            {tienda.nombre}
          </h2>
          <Garabato className="mt-3" />
          {tienda.descripcion ? (
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed opacity-85">
              {tienda.descripcion}
            </p>
          ) : null}
        </div>
        <dl className="flex flex-col gap-5">
          <SiRecibePedidos>
            <div>
              <dt>
                <Rotulo>Cómo comprar</Rotulo>
              </dt>
              <dd className="mt-1.5 leading-relaxed opacity-85">
                Elige la ropa y la talla, y envíanos el pedido por WhatsApp. Ahí
                coordinamos el pago y la entrega.
              </dd>
            </div>
          </SiRecibePedidos>
          {tienda.whatsapp ? (
            <div>
              <dt className="sr-only">WhatsApp</dt>
              <dd>
                <a
                  href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center gap-2 font-semibold underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-senal hover:decoration-senal"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  ¿No sabes qué talla? Dinos la edad
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  )
}

/** El pie: un borde de zigzag verde arriba y el nombre en la redonda. */
export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-sm font-medium opacity-75 transition-opacity hover:opacity-100"

  return (
    <footer>
      <svg aria-hidden="true" className="block h-3 w-full text-senal">
        <defs>
          <pattern
            id="zigzag-del-pie"
            width="16"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <polyline
              points="0,9 8,3 16,9"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#zigzag-del-pie)" />
      </svg>
      <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-8">
        <p className="font-titular text-[clamp(2.25rem,10vw,4.5rem)] leading-[1]">
          {marco.nombre}
        </p>
        <div className="mt-8 grid gap-x-8 gap-y-6 border-t-2 border-tinta/10 pt-6 sm:grid-cols-3">
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
            Los pedidos y el pago los coordinamos por WhatsApp.
          </p>
          <Link href="/" className={cn(enlace, "sm:justify-end")}>
            Hecho con Venduo
          </Link>
        </div>
      </div>
    </footer>
  )
}
