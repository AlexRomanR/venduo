import Image from "next/image"
import { BarChart3, Boxes, Link2, Store } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Entra } from "@/components/landing/entra"

/**
 * Lo que trae Venduo, en los tres paneles que nombra el titular: la tienda
 * online, el inventario y las ventas.
 *
 * Son el mismo negocio visto desde tres lados, con los mismos productos: la
 * polera que se ve en la tienda es la que tiene su stock al lado y la que suma
 * en las ventas. El rojo va solo en lo que pide una acción —lo que se está
 * acabando— y en la serie del gráfico, como en el panel de verdad.
 *
 * El contenido es ilustrativo y lo dice al pie.
 */

const PRODUCTOS = [
  { nombre: "Buzo oversize", precio: 18000, foto: "1556821840-3a63f95609a7" },
  { nombre: "Polera básica", precio: 6500, foto: "1521572163474-6864f9cf17ab" },
  { nombre: "Mochila urbana", precio: 24000, foto: "1553062407-98eeb64c6a62" },
  { nombre: "Gorra", precio: 5500, foto: "1588850561407-ed78c282e89b" },
]

const INVENTARIO = [
  { nombre: "Polera básica", stock: 12 },
  { nombre: "Gorra", stock: 9 },
  { nombre: "Buzo oversize", stock: 2, acabando: true },
  { nombre: "Mochila urbana", stock: 4 },
]

/** Lo vendido cada día de la semana, en centavos. */
const SEMANA = [
  { dia: "L", cents: 31000 },
  { dia: "M", cents: 18000 },
  { dia: "M", cents: 42500 },
  { dia: "J", cents: 24000 },
  { dia: "V", cents: 55000 },
  { dia: "S", cents: 68500 },
  { dia: "D", cents: 36000 },
]

const TOTAL_SEMANA = SEMANA.reduce((t, d) => t + d.cents, 0)
const MAXIMO_SEMANA = Math.max(...SEMANA.map((d) => d.cents))

export function TresPaneles() {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Entra className="sm:col-span-2">
          <Panel
            icono={Store}
            titulo="Tu tienda online"
            extra="Plantilla editable"
          >
            <div className="px-4 pt-3 pb-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <Link2 aria-hidden="true" className="size-3.5 opacity-65" />
                venduo.app/t/rosa-deportes
              </p>
              <ul className="mt-3 grid grid-cols-4 gap-2">
                {PRODUCTOS.map((producto) => (
                  <li key={producto.nombre} className="min-w-0">
                    <div className="relative aspect-square overflow-hidden bg-tinta/10">
                      <Image
                        /* Original grande: Next redimensiona según `sizes`. */
                        src={`https://images.unsplash.com/photo-${producto.foto}?w=1200&q=85&auto=format&fit=crop`}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 22vw, 120px"
                        quality={85}
                        className="object-cover grayscale"
                      />
                    </div>
                    <p className="mt-1.5 truncate text-[0.7rem] leading-tight">
                      {producto.nombre}
                    </p>
                    <p className="tabular text-xs font-bold">
                      {formatMoney(producto.precio)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </Entra>

        <Entra demora={90}>
          <Panel icono={Boxes} titulo="Tu inventario" extra="Al día">
            <ul>
              {INVENTARIO.map((item) => (
                <li
                  key={item.nombre}
                  className="flex items-baseline justify-between gap-3 border-t border-tinta/15 px-4 py-2 text-xs first:border-t-0"
                >
                  <span className="truncate">{item.nombre}</span>
                  <span
                    className={cn(
                      "tabular shrink-0 font-semibold",
                      item.acabando && "text-senal"
                    )}
                  >
                    {item.acabando
                      ? `Quedan ${item.stock}`
                      : `${item.stock} u.`}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </Entra>

        <Entra demora={180}>
          <Panel icono={BarChart3} titulo="Tus ventas" extra="Esta semana">
            <div className="px-4 pt-3 pb-3">
              <p className="tabular font-titular text-2xl leading-none font-extrabold tracking-[-0.03em]">
                {formatMoney(TOTAL_SEMANA)}
              </p>
              {/* Barras desde cero, una sola serie en el rojo de señal, como
                  los gráficos del panel. */}
              <div
                role="img"
                aria-label={`Ventas de la semana: ${formatMoney(TOTAL_SEMANA)}, con el sábado como el mejor día`}
                className="mt-3 flex h-16 items-end gap-1.5 border-b border-tinta/25"
              >
                {SEMANA.map((d, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-[3px] bg-senal"
                    style={{ height: `${(d.cents / MAXIMO_SEMANA) * 100}%` }}
                  />
                ))}
              </div>
              <div
                aria-hidden="true"
                className="mt-1 flex gap-1.5 text-center text-[0.65rem] opacity-65"
              >
                {SEMANA.map((d, i) => (
                  <span key={i} className="flex-1">
                    {d.dia}
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        </Entra>
      </div>

      <p className="mt-3 text-xs opacity-65">
        Ejemplo ilustrativo. La tienda y las cifras no corresponden a un
        comercio real.
      </p>
    </div>
  )
}

function Panel({
  icono: Icono,
  titulo,
  extra,
  children,
}: {
  icono: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  titulo: string
  extra: string
  children: React.ReactNode
}) {
  return (
    <section className="h-full border border-tinta bg-papel">
      <header className="flex items-center gap-2 border-b border-tinta/15 px-4 py-2.5">
        <Icono aria-hidden={true} className="size-4" />
        <h2 className="flex-1 text-[0.7rem] font-semibold tracking-[0.12em] uppercase">
          {titulo}
        </h2>
        <span className="text-[0.7rem] opacity-65">{extra}</span>
      </header>
      {children}
    </section>
  )
}
