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
import { PrecioDeVitrina } from "@/components/tienda/precio"
import { SiRecibePedidos } from "@/components/tienda/carrito"

/**
 * Las piezas de Quilate.
 *
 * Un mostrador de joyería sin dorados: papel perla, reglas finas con un rombo
 * al centro y la romana de inscripción en mayúsculas espaciadas. La joya se ve
 * dos veces —de cerca, y puesta en un círculo— y el material va en un sello,
 * porque es lo primero que se pregunta. Nada compite en color con la pieza: la
 * rebaja se marca con un borde, no con un rojo.
 */

/** El fondo donde se apoya una pieza: un gris perla apenas más hondo. */
export const ESTUCHE = "bg-tinta/[0.045]"

const BOTON =
  "group inline-flex min-h-12 items-center justify-center gap-3 rounded-plantilla bg-tinta px-8 text-xs tracking-[0.24em] text-papel uppercase transition-colors hover:bg-senal active:scale-[0.98]"

/** El botón de Quilate: tinta, versalitas espaciadas y una flecha. */
export function Boton({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={BOTON}>
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
      />
    </Link>
  )
}

/** Una regla fina con un rombo al centro: el filete de la casa. */
export function Filete({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block h-px bg-tinta/20", className)}
    >
      <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-tinta/50 bg-papel" />
    </span>
  )
}

/**
 * El material de una pieza, leído de su nombre y su descripción. Lo más
 * específico primero: "plata 925" antes que "plata", "bañado en oro" antes que
 * "oro". `null` si no se reconoce: mejor sin sello que con uno equivocado.
 */
const MATERIALES: [RegExp, string][] = [
  [/plata\s*(de\s*ley\s*)?925|\b925\b/i, "Plata 925"],
  [/ba[ñn]ad[oa]\s+en\s+oro|enchapad[oa]|chapad[oa]/i, "Bañado en oro"],
  [/acero/i, "Acero"],
  [/rodio/i, "Rodio"],
  [/perla/i, "Perlas"],
  [/\bplata\b/i, "Plata"],
  [/\boro\b/i, "Oro"],
  [/fantas[ií]a|bisuter[ií]a/i, "Fantasía"],
]

export function materialDe(producto: {
  name: string
  description: string | null
}): string | null {
  const texto = `${producto.name} ${producto.description ?? ""}`
  return MATERIALES.find(([patron]) => patron.test(texto))?.[1] ?? null
}

export function Tarjeta({ producto, tienda }: PropsTarjeta) {
  const agotado = producto.stock === 0
  const rebaja = descuento(producto)
  const material = materialDe(producto)
  const puesta = producto.images.find((foto) => foto !== producto.image_url)

  return (
    <Link
      href={rutaDeTienda(tienda.slug, `/p/${producto.id}`)}
      className="group block"
    >
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-[calc(var(--radio)*0.5)]",
          ESTUCHE,
          rebaja && !agotado && "ring-1 ring-tinta ring-inset"
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
              agotado && "opacity-45 grayscale"
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}

        {material ? (
          <span className="absolute top-2.5 left-2.5 rounded-full border border-tinta/25 bg-papel/90 px-2.5 py-1 text-xs leading-none tracking-[0.14em] uppercase">
            {material}
          </span>
        ) : null}

        {/* Cómo se ve puesta: la segunda foto, en un círculo que crece al pasar. */}
        {puesta && !agotado ? (
          <span
            aria-hidden="true"
            className="absolute right-2.5 bottom-2.5 aspect-square w-[34%] overflow-hidden rounded-full ring-2 ring-papel transition-[width] duration-500 ease-out group-hover:w-[40%] motion-reduce:transition-none"
          >
            <Image
              src={puesta}
              alt=""
              fill
              unoptimized
              sizes="140px"
              className="object-cover"
            />
          </span>
        ) : null}

        {agotado ? (
          <span className="absolute inset-x-0 bottom-3 text-center text-xs tracking-[0.24em] uppercase">
            Agotada
          </span>
        ) : null}
      </div>

      <div className="mt-3.5 text-center">
        <h3 className="font-titular text-sm leading-snug transition-colors group-hover:text-senal md:text-[15px]">
          {producto.name}
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-[13px]">
          <span className="tabular">
            <PrecioDeVitrina producto={producto} />
          </span>
          {producto.compare_at_price_cents ? (
            <span className="tabular line-through opacity-55">
              {formatMoney(producto.compare_at_price_cents)}
            </span>
          ) : null}
          {rebaja && !agotado ? (
            <span className="tabular border border-tinta px-1.5 text-xs">
              −{rebaja}%
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}

export function grilla(columnas: number) {
  return cn(
    "grid grid-cols-2 gap-x-3 gap-y-9 md:gap-x-6 md:gap-y-12",
    columnas >= 3 && "md:grid-cols-3",
    columnas >= 4 && "lg:grid-cols-4"
  )
}

/** El título de una sección: al centro, entre dos reglas finas. */
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
    <div className="flex flex-col items-center text-center">
      <div className="flex w-full items-center gap-4 md:gap-6">
        <span aria-hidden="true" className="h-px flex-1 bg-tinta/20" />
        <Etiqueta className="max-w-[18ch] font-titular text-[clamp(1.5rem,5.5vw,2.5rem)] leading-[1.15]">
          {titulo}
        </Etiqueta>
        <span aria-hidden="true" className="h-px flex-1 bg-tinta/20" />
      </div>
      {enlace ? (
        <Link
          href={enlace.href}
          className="mt-2 inline-flex min-h-11 items-center text-xs tracking-[0.24em] uppercase underline decoration-tinta/30 underline-offset-[6px] transition-colors hover:text-senal hover:decoration-senal"
        >
          {enlace.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <span className="text-xs tracking-[0.24em] uppercase">{children}</span>
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div className="text-center">
      {antetitulo ? <Rotulo>{antetitulo}</Rotulo> : null}
      <h1
        className={cn(
          "font-titular text-[clamp(2rem,8vw,3.5rem)] leading-[1.1]",
          antetitulo && "mt-3"
        )}
      >
        {titulo}
      </h1>
      {bajada ? (
        <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed opacity-75">
          {bajada}
        </p>
      ) : null}
      <Filete className="mx-auto mt-7 max-w-xs" />
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className="py-16 text-center md:py-24">
      <Filete className="mx-auto max-w-[10rem]" />
      <h2 className="mt-10 font-titular text-[clamp(1.5rem,6vw,2.5rem)] leading-tight">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-75">
        {texto}
      </p>
      {accion ? (
        <div className="mt-8">
          <Boton href={accion.href}>{accion.etiqueta}</Boton>
        </div>
      ) : null}
    </div>
  )
}

/** La casa: el nombre al centro, cómo se compra y a quién preguntarle. */
export function Cierre({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 text-center md:py-24">
      <Filete className="mx-auto max-w-xs" />
      <h2 className="mt-10 font-titular text-[clamp(1.75rem,7vw,3rem)] leading-[1.1]">
        {tienda.nombre}
      </h2>
      {tienda.descripcion ? (
        <p className="mx-auto mt-5 max-w-[50ch] text-lg leading-relaxed opacity-80">
          {tienda.descripcion}
        </p>
      ) : null}

      <dl className="mx-auto mt-10 grid max-w-xl gap-6 text-sm sm:grid-cols-2 sm:text-left">
        <SiRecibePedidos>
          <div>
            <dt>
              <Rotulo>Cómo comprar</Rotulo>
            </dt>
            <dd className="mt-2 leading-relaxed opacity-80">
              Elige tus piezas y envíanos el pedido por WhatsApp. Ahí
              coordinamos el pago y la entrega.
            </dd>
          </div>
        </SiRecibePedidos>
        {tienda.whatsapp ? (
          <div>
            <dt>
              <Rotulo>De cerca</Rotulo>
            </dt>
            <dd className="mt-1">
              <a
                href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-senal hover:decoration-senal"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Te mandamos más fotos
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}

/** El pie claro: el nombre al centro, como grabado, y los enlaces en una línea. */
export function Pie({ marco }: PropsPie) {
  const enlace =
    "flex min-h-11 items-center text-xs tracking-[0.24em] uppercase opacity-75 transition-opacity hover:opacity-100"

  return (
    <footer className="border-t border-tinta/20">
      <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-8 text-center">
        <p className="font-titular text-xl leading-tight md:text-2xl">
          {marco.nombre}
        </p>
        <Filete className="mx-auto mt-6 max-w-[10rem]" />

        <nav
          aria-label="Tienda"
          className="mt-6 flex flex-wrap items-center justify-center gap-x-8"
        >
          <Link href={rutaDeTienda(marco.slug, "")} className={enlace}>
            Inicio
          </Link>
          <Link href={rutaDeTienda(marco.slug, "/catalogo")} className={enlace}>
            Las piezas
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

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-tinta/15 pt-6 text-sm sm:flex-row">
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
