import Link from "next/link"
import {
  ArrowRight,
  Bell,
  MessageCircle,
  PackagePlus,
  Tags,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Lo que hay que hacer, y lo que pasa solo.
 *
 * Es la primera pantalla de un negocio recién registrado. Su duda no es dónde
 * está cada botón: es **quién va a vender** y **qué le toca hacer a él**. Por eso
 * los pasos no son solo los suyos —cargar productos— sino todo el circuito,
 * marcando cuáles son de la plataforma. Un panel lleno de secciones vacías no
 * contesta eso.
 *
 * Los tres primeros llevan a una acción; los otros son lo que va a pasar sin
 * que haga nada, y por eso no tienen botón.
 */

interface Paso {
  icono: LucideIcon
  titulo: string
  detalle: string
  accion?: { href: string; texto: string }
  /** Lo que resuelve la plataforma. Se dibuja distinto: no es tarea suya. */
  automatico?: boolean
}

const PASOS: Paso[] = [
  {
    icono: PackagePlus,
    titulo: "Carga lo que vendes",
    detalle:
      "Una foto, el nombre, cuántas unidades tienes y cuánto quieres recibir por cada una. El precio publicado lo calculamos nosotros: le sumamos la comisión de quien lo venda y nuestra parte.",
    accion: { href: "/panel/productos/nuevo", texto: "Cargar un producto" },
  },
  {
    icono: Tags,
    titulo: "Agrúpalos en categorías",
    detalle:
      "Opcional, pero ayuda: quien busca encuentra más rápido, y tus productos aparecen ordenados en el catálogo.",
    accion: { href: "/panel/productos/categorias", texto: "Crear categorías" },
  },
  {
    icono: Wallet,
    titulo: "Deja listos tus datos de cobro",
    detalle:
      "Tu WhatsApp para coordinar entregas y la cuenta donde quieres recibir tu plata. Sin esto, una venta te encuentra a medias.",
    accion: { href: "/cuenta", texto: "Completar mis datos" },
  },
  {
    icono: Users,
    titulo: "Los promotores eligen tus productos",
    detalle:
      "No tienes que buscar a nadie ni pagar publicidad por adelantado. Tus productos entran al catálogo y cada promotor elige cuáles promociona en sus redes, con su propio enlace.",
    automatico: true,
  },
  {
    icono: Bell,
    titulo: "Te avisamos cuando vendas",
    detalle:
      "El pedido te llega con el detalle y el WhatsApp de quien compró. El pago queda retenido hasta que el producto llegue, así ninguno de los dos arriesga.",
    automatico: true,
  },
  {
    icono: MessageCircle,
    titulo: "Coordinas la entrega por WhatsApp",
    detalle:
      "Te abrimos la conversación con el pedido ya escrito. Marcas el pedido como enviado y, cuando el comprador confirma que lo recibió, se libera tu pago.",
    automatico: true,
  },
]

export function PrimerosPasos({ nombre }: { nombre: string }) {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Bienvenido
        </p>
        <h1 className="mt-4 max-w-[18ch] font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
          {nombre}, carga tus productos. Del resto nos encargamos.
        </h1>
        <p className="mt-4 max-w-[58ch] leading-relaxed opacity-70">
          Tú pones lo que vendes y cuánto quieres recibir por cada cosa. Una red
          de promotores lo lleva a sus redes, y a ti te avisamos cuando alguien
          compre para que coordines la entrega.
        </p>

        <Link
          href="/panel/productos/nuevo"
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          Cargar mi primer producto
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <ol className="border-t-2 border-tinta">
        {PASOS.map((paso, i) => {
          const Icono = paso.icono

          return (
            <li
              key={paso.titulo}
              className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-b border-tinta/15 py-6 sm:grid-cols-[auto_auto_1fr] sm:gap-x-6"
            >
              <span
                className={cn(
                  "tabular font-titular text-lg leading-none font-bold",
                  paso.automatico ? "opacity-30" : "text-senal"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <span
                aria-hidden="true"
                className="hidden size-10 shrink-0 items-center justify-center border border-tinta/15 sm:flex"
              >
                <Icono className="size-4 opacity-55" />
              </span>

              <div className="col-start-2 sm:col-start-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="font-titular text-lg font-bold tracking-[-0.02em]">
                    {paso.titulo}
                  </h2>
                  {paso.automatico ? (
                    <span className="rounded-full border border-tinta/25 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase opacity-55">
                      Lo hacemos nosotros
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 max-w-[62ch] text-sm leading-relaxed opacity-70">
                  {paso.detalle}
                </p>

                {paso.accion ? (
                  <Link
                    href={paso.accion.href}
                    className="group mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
                  >
                    {paso.accion.texto}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    />
                  </Link>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="border-l-2 border-senal pl-5">
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Lo que nunca vas a tener que hacer
        </p>
        <ul className="mt-3 flex max-w-[58ch] flex-col gap-2 text-sm leading-relaxed opacity-75">
          <li>Calcular márgenes ni decidir a cuánto publicar.</li>
          <li>Negociar comisiones con cada promotor.</li>
          <li>Pagar publicidad por adelantado: si no vendes, no pagas.</li>
        </ul>
      </div>
    </div>
  )
}
