import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"
import { useId, type ReactNode } from "react"

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
 * Las piezas de Tocador.
 *
 * El tocador de casa: cada producto en su bandeja, los tonos bajo la foto
 * para elegir sin probar y un sello redondo que ofrece ayuda con el tono por
 * WhatsApp. Leche, rojo labial y una serif de trazo suave.
 */

/** La bandeja donde se apoya cada producto. */
export const BANDEJA = "rounded-[1.25rem] bg-tinta/[0.04]"

/** El botón de Tocador: una píldora roja. */
export function Boton({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-senal px-7 text-sm font-semibold text-white transition-colors hover:bg-senal-alta active:scale-[0.98]",
        className
      )}
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
      />
    </Link>
  )
}

/** El WhatsApp de la tienda con el pedido de ayuda ya escrito, o `null`. */
export function enlaceDeTono(
  tienda: Pick<TiendaPublica, "nombre" | "whatsapp">
): string | null {
  if (!tienda.whatsapp) return null
  const mensaje = `Hola ${tienda.nombre}, quisiera ayuda para elegir mi tono.`
  return `https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}?text=${encodeURIComponent(mensaje)}`
}

/**
 * El sello: "Te ayudamos con tu tono" escrito en un círculo. Lleva a WhatsApp
 * y gira despacio mientras el cursor está encima.
 */
export function Sello({
  tienda,
  className,
}: {
  tienda: Pick<TiendaPublica, "nombre" | "whatsapp">
  className?: string
}) {
  const enlace = enlaceDeTono(tienda)
  const trazo = `sello-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  const dibujo = (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 88 88"
        className="absolute inset-0 size-full motion-safe:group-hover:animate-[spin_9s_linear_infinite]"
      >
        <defs>
          <path
            id={trazo}
            d="M44,44 m-31,0 a31,31 0 1,1 62,0 a31,31 0 1,1 -62,0"
          />
        </defs>
        <text
          className="fill-tinta"
          style={{ fontSize: 9.6, letterSpacing: 1.6, fontWeight: 600 }}
        >
          <textPath href={`#${trazo}`} textLength="190">
            TE AYUDAMOS CON TU TONO ·
          </textPath>
        </text>
      </svg>
      <MessageCircle aria-hidden="true" className="size-6 text-senal" />
    </>
  )
  const clases = cn(
    "group relative flex size-28 items-center justify-center rounded-full bg-papel shadow-[0_8px_24px_-12px_rgb(43_20_24/0.35)] md:size-32",
    className
  )

  if (!enlace) {
    return (
      <span className={clases} aria-hidden="true">
        {dibujo}
      </span>
    )
  }
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Te ayudamos con tu tono por WhatsApp"
      className={clases}
    >
      {dibujo}
    </a>
  )
}

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
          "relative p-[8%]",
          BANDEJA,
          retrato ? "aspect-[4/5]" : "aspect-square"
        )}
      >
        <div className="relative size-full overflow-hidden rounded-[0.875rem]">
          {producto.image_url ? (
            <Image
              src={producto.image_url}
              alt={producto.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 45vw, (max-width: 1280px) 22vw, 300px"
              className={cn(
                "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none",
                agotado && "opacity-45"
              )}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff aria-hidden="true" className="size-7 opacity-25" />
            </div>
          )}
        </div>
        {rebaja && !agotado ? (
          <span className="tabular absolute top-3 left-3 rounded-full bg-senal px-2.5 py-1 text-xs leading-none font-semibold text-white">
            −{rebaja}%
          </span>
        ) : null}
        {agotado ? (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-papel/90 py-1.5 text-center text-xs font-semibold">
            Agotado
          </span>
        ) : null}
      </div>

      <OpcionesDeVitrina
        producto={producto}
        opcion="color"
        forma="puntos"
        maximo={5}
        className="mt-3"
      />
      <h3 className="mt-2 text-sm leading-snug transition-colors group-hover:text-senal">
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

/** El título de una sección: la serif suave. */
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
      <Etiqueta className="min-w-0 font-titular text-[clamp(1.875rem,7vw,3rem)] leading-[1.02]">
        {titulo}
      </Etiqueta>
      {enlace ? (
        <Link
          href={enlace.href}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium underline decoration-tinta/30 underline-offset-[6px] transition-colors hover:text-senal hover:decoration-senal"
        >
          {enlace.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-semibold tracking-[0.12em] uppercase">
      {children}
    </span>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="border-b border-tinta/15 pb-6">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.25rem,9vw,4.25rem)] leading-[1]",
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
    <div className={cn("px-6 py-16 text-center md:py-24", BANDEJA)}>
      <h2 className="font-titular text-[clamp(1.875rem,7vw,2.75rem)] leading-tight">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-75">
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

/** La tienda, cómo se compra y la ayuda con el tono. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  const tono = enlaceDeTono(tienda)
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-20 md:py-24">
      <div>
        <h2 className="font-titular text-[clamp(2.25rem,9vw,4.5rem)] leading-[1]">
          {tienda.nombre}
        </h2>
        {tienda.descripcion ? (
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed opacity-80">
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
            <dd className="mt-2 leading-relaxed opacity-85">
              Arma tu rutina, elige tus tonos y envíanos el pedido por WhatsApp.
              Ahí coordinamos el pago y la entrega.
            </dd>
          </div>
        </SiRecibePedidos>
        {tono ? (
          <div>
            <dt className="sr-only">Ayuda con el tono</dt>
            <dd>
              <a
                href={tono}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 font-medium underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-senal hover:decoration-senal"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                ¿No sabes tu tono? Mándanos una foto
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}

/** El pie, de tinta, con el nombre en la serif. */
export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-sm opacity-75 transition-opacity hover:opacity-100"

  return (
    <footer className="bg-tinta text-papel">
      <div className="mx-auto w-full max-w-7xl px-5 pt-12 pb-8">
        <p className="font-titular text-[clamp(2.25rem,10vw,4.5rem)] leading-[1]">
          {marco.nombre}
        </p>
        <div className="mt-8 grid gap-x-8 gap-y-6 border-t border-papel/20 pt-6 sm:grid-cols-3">
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
