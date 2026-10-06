import Image from "next/image"
import Link from "next/link"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { descuento } from "@/lib/plantillas/bloques"
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
 * Las piezas de Esencia.
 *
 * La gramática: todo centrado, titulares en cursiva, una línea corta de oro
 * bajo cada título, versalitas con mucho espacio para los rótulos, botones en
 * píldora con trazo fino. El oro no rellena: subraya.
 */

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const retrato = tienda.apariencia.disposicion.tarjeta === "retrato"

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block text-center"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-tinta/[0.045]",
          retrato ? "aspect-[4/5]" : "aspect-square"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt={producto.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1152px) 33vw, 360px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span
              aria-hidden="true"
              className="font-titular text-7xl italic opacity-20"
            >
              {producto.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Un paspartú: la línea clara adentro de la foto la vuelve vitrina. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2.5 border border-papel/45"
        />

        {rebaja && !agotado ? (
          <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-plantilla bg-papel px-3 py-1 text-[10px] tracking-[0.2em] whitespace-nowrap text-senal uppercase">
            −{rebaja}%
          </span>
        ) : producto.is_featured && !agotado ? (
          <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-plantilla bg-papel px-3 py-1 text-[10px] tracking-[0.2em] whitespace-nowrap uppercase">
            Favorito
          </span>
        ) : null}

        {agotado ? (
          <span className="absolute inset-x-0 bottom-0 bg-papel/90 py-2 text-[10px] tracking-[0.24em] uppercase">
            Agotado
          </span>
        ) : null}
      </div>

      {producto.category ? (
        <p className="mt-4 text-[10px] tracking-[0.24em] uppercase opacity-55">
          {producto.category}
        </p>
      ) : null}
      <h3
        className={cn(
          "font-titular text-xl leading-tight transition-colors group-hover:text-senal",
          producto.category ? "mt-1.5" : "mt-4"
        )}
      >
        {producto.name}
      </h3>
      <p className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2 text-sm tracking-[0.04em]">
        <span className="tabular">{formatMoney(producto.price_cents)}</span>
        {producto.compare_at_price_cents ? (
          <span className="tabular line-through opacity-45">
            {formatMoney(producto.compare_at_price_cents)}
          </span>
        ) : null}
      </p>
    </Link>
  )
}

/**
 * Una fila de productos centrada.
 *
 * Con `flex-wrap` y no con `grid`: una grilla deja uno o dos productos
 * pegados a la izquierda, y en una vitrina simétrica eso se lee como un hueco.
 * El ancho de cada columna descuenta el espacio entre columnas.
 */
export function Vitrina({
  columnas,
  children,
}: {
  columnas: number
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap justify-center gap-x-4 gap-y-12 md:gap-x-8",
        "*:w-[calc(50%-0.5rem)]",
        columnas >= 4
          ? "md:*:w-[calc((100%-6rem)/4)]"
          : "md:*:w-[calc((100%-4rem)/3)]"
      )}
    >
      {children}
    </div>
  )
}

/** Título centrado con su línea de oro. */
export function TituloDeSeccion({
  antetitulo,
  titulo,
  bajada,
  como = "h2",
}: {
  antetitulo?: string
  titulo: string
  bajada?: string | null
  como?: "h1" | "h2"
}) {
  const Etiqueta = como

  return (
    <div className="text-center">
      {antetitulo ? (
        <p className="text-[11px] tracking-[0.28em] text-senal uppercase">
          {antetitulo}
        </p>
      ) : null}
      <Etiqueta
        className={cn(
          "mx-auto max-w-[20ch] font-titular text-[clamp(2rem,6vw,3.25rem)] leading-[1.05] text-balance italic",
          antetitulo && "mt-3"
        )}
      >
        {titulo}
      </Etiqueta>
      <span
        aria-hidden="true"
        className="mx-auto mt-5 block h-px w-12 bg-senal"
      />
      {bajada ? (
        <p className="mx-auto mt-5 max-w-[48ch] leading-relaxed opacity-70">
          {bajada}
        </p>
      ) : null}
    </div>
  )
}

/** El botón secundario de Esencia: píldora de trazo fino. */
export function EnlacePildora({
  href,
  children,
  claro = false,
  className,
}: {
  href: string
  children: React.ReactNode
  /** Sobre un fondo oscuro. */
  claro?: boolean
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-plantilla border px-8 text-[11px] tracking-[0.22em] uppercase transition-colors",
        claro
          ? "border-papel/45 hover:border-papel hover:bg-papel hover:text-tinta"
          : "border-tinta/35 hover:border-tinta hover:bg-tinta hover:text-papel",
        className
      )}
    >
      {children}
    </Link>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <TituloDeSeccion
      antetitulo={antetitulo}
      titulo={titulo}
      bajada={bajada}
      como="h1"
    />
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center md:py-20">
      <h2 className="font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-tight italic">
        {titulo}
      </h2>
      <span
        aria-hidden="true"
        className="mx-auto mt-5 block h-px w-12 bg-senal"
      />
      <p className="mx-auto mt-5 max-w-[42ch] leading-relaxed opacity-70">
        {texto}
      </p>
      {accion ? (
        <EnlacePildora href={accion.href} className="mt-8">
          {accion.etiqueta}
        </EnlacePildora>
      ) : null}
    </div>
  )
}

export function Pie({ marco }: PropsPie) {
  return (
    <footer className="border-t border-tinta/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 text-center">
        <p className="font-titular text-[clamp(2rem,6vw,3rem)] leading-none italic">
          {marco.nombre}
        </p>
        <span
          aria-hidden="true"
          className="mx-auto mt-6 block h-px w-12 bg-senal"
        />

        <nav
          aria-label="Tienda"
          className="mt-6 flex flex-wrap items-center justify-center gap-x-8"
        >
          <Link
            href={rutaDeTienda(marco.slug, "")}
            className="flex min-h-11 items-center text-[11px] tracking-[0.24em] uppercase opacity-70 transition-opacity hover:opacity-100"
          >
            Inicio
          </Link>
          <Link
            href={rutaDeTienda(marco.slug, "/catalogo")}
            className="flex min-h-11 items-center text-[11px] tracking-[0.24em] uppercase opacity-70 transition-opacity hover:opacity-100"
          >
            La colección
          </Link>
          {marco.whatsapp ? (
            <a
              href={`https://wa.me/${numeroDeWhatsApp(marco.whatsapp)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex min-h-11 items-center text-[11px] tracking-[0.24em] uppercase opacity-70 transition-opacity hover:opacity-100"
            >
              WhatsApp
            </a>
          ) : null}
        </nav>

        <p className="mx-auto mt-6 max-w-[40ch] text-sm leading-relaxed opacity-55">
          Los pedidos y el pago se acuerdan con la tienda por WhatsApp.
        </p>

        <Link
          href="/"
          className="mt-4 inline-flex min-h-11 items-center text-[10px] tracking-[0.24em] uppercase opacity-50 transition-opacity hover:opacity-100"
        >
          Hecho con Venduo
        </Link>
      </div>
    </footer>
  )
}
