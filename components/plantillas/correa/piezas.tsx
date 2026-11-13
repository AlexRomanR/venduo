import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageOff, MessageCircle } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { descuento } from "@/lib/plantillas/bloques"
import { hexAHsl, hslAHex } from "@/lib/plantillas/color"
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
 * Las piezas de Correa.
 *
 * Carteras de todos los días, cada una sobre su azulejo de color, como una
 * vidriera de verano. Los cuatro azulejos salen del color de la tienda
 * girándole el tono —con el cognac dan durazno, salvia, celeste y lila— y
 * cambian solos si la tienda cambia su color. La letra ancha y los botones
 * redondos hacen el resto.
 */

/** Los cuatro azulejos: el tono de la señal y tres giros de 90°, muy claros. */
export function azulejos(senal: string): string[] {
  const [tono] = hexAHsl(senal)
  return [0, 90, 180, 270].map((giro) => hslAHex((tono + giro) % 360, 42, 89))
}

/** Las variables de los azulejos, para ponerlas en un contenedor. */
export function variablesDeAzulejos(tienda: TiendaPublica): CSSProperties {
  const [a, b, c, d] = azulejos(tienda.apariencia.colores.senal)
  return {
    "--azulejo-1": a,
    "--azulejo-2": b,
    "--azulejo-3": c,
    "--azulejo-4": d,
  } as CSSProperties
}

/** El azulejo de una posición: 1, 2, 3, 4, 1… */
export function azulejo(indice: number): string {
  return `var(--azulejo-${(indice % 4) + 1})`
}

const RADIO = "rounded-[1.25rem]"

/** El botón de Correa: una píldora, llena o con borde. */
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
      : "border-2 border-tinta hover:bg-tinta hover:text-papel",
    className
  )
  const flecha = (
    <ArrowRight
      aria-hidden="true"
      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
    />
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
      {flecha}
    </Link>
  )
}

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    // Las variables de los azulejos van en cada tarjeta, y el que le toca sale
    // de su lugar en la grilla: la primera el 1, la segunda el 2…
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      style={variablesDeAzulejos(tienda)}
      className="group block"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--azulejo-1)] [:nth-child(4n+2)>&]:bg-[var(--azulejo-2)] [:nth-child(4n+3)>&]:bg-[var(--azulejo-3)] [:nth-child(4n+4)>&]:bg-[var(--azulejo-4)]",
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
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 420px"
            className={cn(
              "object-cover mix-blend-multiply transition-transform duration-300 ease-out group-hover:-translate-y-[2%] motion-reduce:transform-none",
              agotado && "opacity-50"
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}
        {rebaja && !agotado ? (
          <span className="tabular absolute top-3 left-3 rounded-full bg-senal px-2.5 py-1 text-xs leading-none font-semibold text-white">
            −{rebaja}%
          </span>
        ) : null}
        {agotado ? (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-papel/90 py-1.5 text-center text-xs font-semibold">
            Agotada
          </span>
        ) : null}
      </div>

      <OpcionesDeVitrina
        producto={producto}
        opcion="color"
        forma="puntos"
        maximo={4}
        className="mt-3"
      />
      <h3 className="mt-2 text-sm leading-snug font-medium transition-colors group-hover:text-senal">
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
    "grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12",
    columnas >= 3 && "md:grid-cols-3",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** El título de una sección: la ancha, apretada. */
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
      <Etiqueta className="min-w-0 font-titular text-[clamp(1.75rem,7vw,3rem)] leading-[1]">
        {titulo}
      </Etiqueta>
      {enlace ? (
        <Link
          href={enlace.href}
          className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-tinta/25 px-4 text-sm font-medium transition-colors hover:border-tinta"
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
    <div className="pb-4">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2.25rem,9vw,4.5rem)] leading-[0.98]",
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
    <div
      className={cn("bg-tinta/[0.05] px-6 py-16 text-center md:py-24", RADIO)}
    >
      <h2 className="font-titular text-[clamp(1.75rem,7vw,2.75rem)] leading-tight">
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

/** La tienda y cómo se compra, sobre el primer azulejo. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-20">
      <div
        style={variablesDeAzulejos(tienda)}
        className={cn(
          "grid gap-10 bg-[var(--azulejo-1)] px-6 py-12 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-16 md:px-12 md:py-16",
          RADIO
        )}
      >
        <div>
          <h2 className="font-titular text-[clamp(2.25rem,9vw,4.5rem)] leading-[0.98]">
            {tienda.nombre}
          </h2>
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
              <dd className="mt-2 leading-relaxed opacity-85">
                Elige tus carteras y su color, y envíanos el pedido por
                WhatsApp. Ahí coordinamos el pago y la entrega.
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
                  className="inline-flex min-h-11 items-center gap-2 font-medium underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-senal hover:decoration-senal"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  ¿Quieres saber las medidas? Escríbenos
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  )
}

/** El pie: una franja con los cuatro azulejos y el texto sobre el papel. */
export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-sm opacity-75 transition-opacity hover:opacity-100"

  return (
    <footer>
      {/* El pie no conoce los colores de la tienda en el servidor: los gira
          el navegador con color relativo. Donde no lo entiende, queda la
          señal clara. */}
      <div aria-hidden="true" className="grid h-3 grid-cols-4">
        {[0, 90, 180, 270].map((giro) => (
          <span
            key={giro}
            className="bg-senal/20"
            style={{
              backgroundColor: `oklch(from var(--senal) 0.92 0.045 calc(h + ${giro}))`,
            }}
          />
        ))}
      </div>
      <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-8">
        <p className="font-titular text-3xl leading-none md:text-4xl">
          {marco.nombre}
        </p>
        <div className="mt-6 grid gap-x-8 gap-y-6 border-t border-tinta/15 pt-6 sm:grid-cols-3">
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
