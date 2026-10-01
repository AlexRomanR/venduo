import Link from "next/link"
import { ArrowRight, Flame, Package, PackageOpen } from "lucide-react"

import { formatMoney, formatNumber } from "@/lib/format"
import type { ProductoPorAcabarse, ProductoVendido } from "@/lib/tablero"
import { cn } from "@/lib/utils"
import {
  Miniatura,
  Seccion,
  SinDatos,
} from "@/components/panel/tablero/seccion"

/**
 * Los productos que más se vendieron en 30 días, por unidades.
 *
 * Un ranking y no un gráfico: son cinco nombres, y la posición con la cifra al
 * lado se lee más rápido que cinco barras.
 */
export function MasVendidos({ productos }: { productos: ProductoVendido[] }) {
  return (
    <Seccion
      id="mas-vendidos"
      icono={Flame}
      titulo="Lo que más se vende"
      bajada="En los últimos 30 días, por unidades."
    >
      {productos.length === 0 ? (
        <SinDatos
          icono={Flame}
          titulo="Todavía no hay un favorito"
          texto="Cuando empieces a vender, acá vas a ver qué productos salen más: los que conviene tener siempre con stock."
        />
      ) : (
        <ol>
          {productos.map((producto, indice) => {
            const contenido = (
              <>
                <span className="tabular w-4 shrink-0 font-titular text-sm font-bold opacity-40">
                  {indice + 1}
                </span>
                <Miniatura foto={producto.foto} icono={Package} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 leading-snug font-semibold">
                    {producto.nombre}
                  </span>
                  <span className="tabular mt-0.5 block text-xs opacity-70">
                    {formatNumber(producto.unidades)}{" "}
                    {producto.unidades === 1 ? "vendido" : "vendidos"}
                  </span>
                </span>
                <span className="tabular shrink-0 font-titular font-bold">
                  {formatMoney(producto.montoCents)}
                </span>
              </>
            )

            return (
              <li
                key={producto.id ?? producto.nombre}
                className="border-t border-tinta/15 first:border-t-0"
              >
                {producto.id ? (
                  <Link
                    href={`/panel/productos/${producto.id}`}
                    className="flex min-h-16 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-tinta/[0.04] sm:px-5"
                  >
                    {contenido}
                  </Link>
                ) : (
                  // Un producto que ya no existe sigue contando como venta,
                  // pero no tiene adónde llevar.
                  <div className="flex min-h-16 items-center gap-3 px-4 py-2.5 sm:px-5">
                    {contenido}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </Seccion>
  )
}

/**
 * Lo que se quedó sin stock o está por quedarse, con un atajo para reponerlo.
 *
 * Agotado va en rojo porque frena una venta: la tienda no deja comprarlo. Poco
 * stock va en tinta, porque todavía es solo un aviso.
 */
export function PorAcabarse({
  productos,
}: {
  productos: ProductoPorAcabarse[]
}) {
  return (
    <Seccion
      id="por-acabarse"
      icono={PackageOpen}
      titulo="Se está acabando"
      bajada="Repón antes de que te pidan algo que no tienes."
      accion={{ href: "/panel/productos", texto: "Ver todos los productos" }}
    >
      {productos.length === 0 ? (
        <SinDatos
          icono={PackageOpen}
          titulo="Tu stock está bien"
          texto="Cuando a un producto le queden pocas unidades, te avisamos acá para que lo repongas a tiempo."
        />
      ) : (
        <ul>
          {productos.map((producto) => {
            const agotado = producto.stock === 0
            return (
              <li
                key={producto.id}
                className="border-t border-tinta/15 first:border-t-0"
              >
                <Link
                  href={`/panel/productos/${producto.id}`}
                  className="group flex min-h-16 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-tinta/[0.04] sm:px-5"
                >
                  <Miniatura foto={producto.foto} icono={Package} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 leading-snug font-semibold">
                      {producto.nombre}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs",
                        agotado ? "font-semibold text-senal" : "opacity-70"
                      )}
                    >
                      {agotado
                        ? "Agotado: no se puede comprar"
                        : `${producto.stock === 1 ? "Queda" : "Quedan"} ${formatNumber(producto.stock)}`}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold">
                    Reponer
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Seccion>
  )
}
