import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  HandCoins,
  MousePointerClick,
  Repeat,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

import type { ProductoVitrina } from "@/lib/demo-data"
import { BOTON_PRIMARIO } from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import { porcentaje, type Tramo } from "@/lib/precio"
import { cn } from "@/lib/utils"
import { Calculadora } from "@/components/promotor/calculadora"
import { TarjetaProducto } from "@/components/promotor/producto"

interface Paso {
  icono: LucideIcon
  titulo: string
  detalle: string
  /** Lo que resuelve Venduo en ese paso, para que no parezca todo trabajo suyo. */
  nosotros?: string
}

/**
 * La primera vez de un promotor.
 *
 * Tiene que hacer dos cosas a la vez: explicar un modelo que nadie conoce
 * —vender lo de otro sin comprarlo— y dar ganas de probarlo. Por eso la cifra
 * aparece antes que la explicación, y los productos reales antes que las
 * preguntas: lo que convence a alguien de 19 años es ver cuánto gana con algo
 * que podría vender hoy.
 */
export function Bienvenida({
  nombre,
  tramos,
  productos,
}: {
  nombre: string
  tramos: Tramo[]
  productos: ProductoVitrina[]
}) {
  const maximo = Math.max(...tramos.map((t) => t.comisionBps), 0)
  const primerNombre = nombre.split(" ")[0]

  const pasos: Paso[] = [
    {
      icono: MousePointerClick,
      titulo: "Elige lo que te guste vender",
      detalle:
        "Entra al catálogo y toca Promocionar en los productos que le venderías a tus amigos, tu familia o tus seguidores. Puedes tomar todos los que quieras, de todos los negocios.",
      nosotros: "Cada producto ya viene con su precio y su foto.",
    },
    {
      icono: Send,
      titulo: "Compártelo donde ya estás",
      detalle:
        "Cada producto te da un enlace y un QR con tu código. Mándalo por WhatsApp, ponlo en tu estado, en TikTok o en Facebook. Quien entra por ahí, compra con tu nombre.",
      nosotros: "El mensaje para WhatsApp ya está escrito.",
    },
    {
      icono: HandCoins,
      titulo: "Alguien compra, tú ganas",
      detalle:
        "Tu comisión ya está dentro del precio: el comprador paga lo mismo que en cualquier lado y a ti te toca tu parte. Tú no cobras, no entregas y no manejas plata de nadie.",
      nosotros: "El negocio coordina la entrega por WhatsApp.",
    },
    {
      icono: ShieldCheck,
      titulo: "Cobras cuando el pedido llega",
      detalle:
        "El pago queda guardado hasta que el comprador recibe su pedido. Ahí se reparte solo: el negocio recibe lo suyo y tú tu comisión, directo a tu cuenta.",
      nosotros: "PagoFácil retiene el pago y lo reparte.",
    },
    {
      icono: Repeat,
      titulo: "El comprador que traes se queda contigo",
      detalle:
        "Si alguien compra por primera vez con tu enlace y en los siguientes 90 días vuelve a comprar por su cuenta, ganas igual, sin hacer nada.",
    },
    {
      icono: BadgeCheck,
      titulo: "Tu historial se arma solo",
      detalle:
        "Cada venta confirmada queda en tu perfil público: cuánto vendiste, para qué negocios y desde cuándo. Es experiencia comprobable para tu primer trabajo.",
    },
  ]

  return (
    <div className="flex flex-col gap-20 lg:gap-28">
      {/* Portada: la promesa a la izquierda, la cuenta a la derecha */}
      <section className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
        <div className="animate-in duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Hola, {primerNombre}
          </p>
          <h1 className="mt-4 max-w-[14ch] font-titular text-[clamp(2.25rem,7vw,4rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance">
            Vende lo de otros. Gana en cada venta.
          </h1>
          <p className="mt-6 max-w-[48ch] text-base leading-relaxed opacity-70 sm:text-lg">
            No compras nada, no guardas stock y no le pides permiso a nadie.
            Eliges productos de negocios reales, los compartes con tu enlace y
            cobras tu comisión cuando el pedido llega.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/vendedor/catalogo"
              className={cn(BOTON_PRIMARIO, "active:scale-[0.98] sm:w-auto")}
            >
              Elegir mi primer producto
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <a
              href="#como-funciona"
              className="group inline-flex min-h-12 items-center justify-center gap-2 px-2 font-semibold transition-colors hover:text-senal"
            >
              Cómo funciona
              <ArrowDown
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-y-0.5 motion-reduce:transform-none"
              />
            </a>
          </div>

          <dl className="mt-12 grid grid-cols-3 border-t-2 border-tinta">
            {[
              { valor: "Bs 0", texto: "para empezar" },
              { valor: `Hasta ${porcentaje(maximo)}`, texto: "por venta" },
              { valor: "90 días", texto: "con cada comprador" },
            ].map((dato, i) => (
              <div
                key={dato.texto}
                className={cn(
                  "pt-4",
                  i > 0 && "border-l border-tinta/15 pl-3 sm:pl-5"
                )}
              >
                <dt className="sr-only">{dato.texto}</dt>
                <dd className="tabular font-titular text-[clamp(1.1rem,4vw,1.6rem)] leading-none font-extrabold tracking-[-0.03em]">
                  {dato.valor}
                </dd>
                <dd className="mt-2 text-xs leading-snug opacity-60 sm:text-sm">
                  {dato.texto}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-in delay-150 duration-700 fill-mode-both fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
          <Calculadora tramos={tramos} />
        </div>
      </section>

      {/* El recorrido: título fijo a la izquierda, pasos a la derecha */}
      <section
        id="como-funciona"
        className="grid scroll-mt-24 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
      >
        <div className="lg:sticky lg:top-10 lg:self-start">
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Cómo funciona
          </p>
          <h2 className="mt-4 max-w-[16ch] font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance">
            Tu primera venta, paso por paso.
          </h2>
          <p className="mt-4 max-w-[40ch] leading-relaxed opacity-70">
            Tú haces una sola cosa: compartir. Todo lo demás —el cobro, la
            entrega, el reparto— pasa sin que tengas que tocarlo.
          </p>
        </div>

        <ol className="border-t-2 border-tinta">
          {pasos.map((paso, i) => (
            <li
              key={paso.titulo}
              className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-tinta/15 py-7 sm:grid-cols-[4.5rem_1fr] sm:gap-x-6"
            >
              <span className="tabular font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-none font-extrabold tracking-[-0.05em] text-senal">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="flex items-center gap-2.5 font-titular text-lg font-bold tracking-[-0.02em] sm:text-xl">
                  <paso.icono
                    aria-hidden="true"
                    className="size-5 shrink-0 opacity-45"
                  />
                  {paso.titulo}
                </h3>
                <p className="mt-2 max-w-[56ch] leading-relaxed opacity-70">
                  {paso.detalle}
                </p>
                {paso.nosotros ? (
                  <p className="mt-3 inline-flex items-center gap-2 border border-tinta/20 px-2.5 py-1 text-xs font-semibold">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-senal"
                    />
                    {paso.nosotros}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Productos reales: lo que convierte la explicación en un primer paso */}
      {productos.length > 0 ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                Para empezar hoy
              </p>
              <h2 className="mt-4 max-w-[20ch] font-titular text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
                Productos que ya puedes promocionar.
              </h2>
            </div>
            <Link
              href="/vendedor/catalogo"
              className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
            >
              Ver todo el catálogo
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
              />
            </Link>
          </div>

          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((producto, i) => (
              <TarjetaProducto
                key={producto.id}
                producto={producto}
                indice={i}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Los porcentajes, sin letra chica */}
      <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Cuánto ganas
          </p>
          <h2 className="mt-4 max-w-[18ch] font-titular text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
            Las mismas reglas para todos.
          </h2>
          <p className="mt-4 max-w-[42ch] leading-relaxed opacity-70">
            Tu porcentaje depende del valor del producto, no de quién eres ni de
            qué negocio es. Lo barato paga más porcentaje, para que una venta
            chica también valga la pena.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left">
            <thead>
              <tr className="border-b-2 border-tinta text-xs tracking-[0.12em] uppercase">
                <th className="pb-3 font-semibold opacity-55">
                  Lo que cobra el negocio
                </th>
                <th className="pb-3 text-right font-semibold">Si lo vendes</th>
                <th className="pb-3 text-right font-semibold opacity-55">
                  Si vuelve solo
                </th>
              </tr>
            </thead>
            <tbody>
              {tramos.map((tramo) => (
                <tr key={tramo.desdeCents} className="border-b border-tinta/15">
                  <td className="tabular py-4 pr-4 text-sm">
                    {tramo.hastaCents === null
                      ? `Más de ${formatMoney(tramo.desdeCents)}`
                      : tramo.desdeCents === 0
                        ? `Hasta ${formatMoney(tramo.hastaCents)}`
                        : `${formatMoney(tramo.desdeCents)} a ${formatMoney(tramo.hastaCents)}`}
                  </td>
                  <td className="tabular py-4 text-right font-titular text-xl font-extrabold tracking-[-0.03em] text-senal">
                    {porcentaje(tramo.comisionBps)}
                  </td>
                  <td className="tabular py-4 text-right font-semibold opacity-70">
                    {porcentaje(tramo.indirectaBps)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm leading-relaxed opacity-55">
            «Si vuelve solo» es lo que ganas cuando un comprador que trajiste
            compra otra vez por su cuenta dentro de los 90 días.
          </p>
        </div>
      </section>

      {/* Las dudas que frenan a alguien antes de empezar */}
      <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Preguntas
          </p>
          <h2 className="mt-4 max-w-[16ch] font-titular text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
            Lo que todos preguntan antes de empezar.
          </h2>
        </div>

        <div className="border-t-2 border-tinta">
          {[
            {
              p: "¿Tengo que comprar el producto o tener stock?",
              r: "No. El producto lo tiene el negocio y lo entrega él. Tú solo compartes tu enlace.",
            },
            {
              p: "¿Alguien me tiene que aprobar?",
              r: "No. Si un negocio publica su producto en Venduo, ya aceptó que cualquier promotor lo venda. Tocas Promocionar y tu enlace está listo.",
            },
            {
              p: "¿Cuándo y cómo cobro?",
              r: "Cuando el comprador recibe su pedido, el pago se reparte solo y tu comisión te llega directo. Mientras tanto la ves en Ganancias, como retenida.",
            },
            {
              p: "¿Qué pasa si el pedido se cancela?",
              r: "Tu comisión de ese pedido se anula y no cuenta en tu historial. Nadie te descuenta nada.",
            },
            {
              p: "¿Puedo promocionar de varios negocios a la vez?",
              r: "Sí, todos los que quieras. Tu panel junta lo que ganaste en cada uno.",
            },
          ].map((item) => (
            <details
              key={item.p}
              className="group border-b border-tinta/15 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-titular font-bold tracking-[-0.01em] transition-colors hover:text-senal">
                {item.p}
                <span
                  aria-hidden="true"
                  className="relative size-3 shrink-0 before:absolute before:top-1/2 before:left-0 before:h-0.5 before:w-3 before:-translate-y-1/2 before:bg-current after:absolute after:top-0 after:left-1/2 after:h-3 after:w-0.5 after:-translate-x-1/2 after:bg-current after:transition-transform after:duration-300 group-open:after:scale-y-0"
                />
              </summary>
              <p className="max-w-[60ch] pb-5 leading-relaxed opacity-70">
                {item.r}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* El cierre: una sola acción */}
      <section className="-mx-5 bg-tinta px-5 py-14 text-papel sm:mx-0 sm:px-10 lg:px-14 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h2 className="max-w-[18ch] font-titular text-[clamp(1.75rem,5.5vw,3rem)] leading-[1] font-extrabold tracking-[-0.04em] text-balance">
            Tu primer enlace está a un toque.
          </h2>
          <div>
            <p className="max-w-[40ch] leading-relaxed opacity-70">
              Elige un producto, compártelo con tres personas hoy y mira cómo se
              mueve tu panel.
            </p>
            <Link
              href="/vendedor/catalogo"
              className={cn(
                BOTON_PRIMARIO,
                "mt-6 active:scale-[0.98] sm:w-auto"
              )}
            >
              Ir al catálogo
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
