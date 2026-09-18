import Link from "next/link"
import { Plus } from "lucide-react"

import { getMisEnlaces } from "@/lib/data/promotor"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney, formatNumber } from "@/lib/format"
import { toDataURL } from "@/lib/qr"
import { cn } from "@/lib/utils"
import { Cifra, Vacio } from "@/components/panel/piezas"
import { FilaEnlace } from "@/components/promotor/piezas"

export const metadata = { title: "Mis enlaces" }

/**
 * Todos los productos que promociona, con lo necesario para compartirlos.
 *
 * El QR se dibuja acá, en el servidor: la biblioteca no viaja al teléfono y el
 * diálogo solo muestra una imagen.
 */
export default async function EnlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string }>
}) {
  const { creado } = await searchParams
  const enlaces = await getMisEnlaces()

  const qrs = await Promise.all(
    enlaces.map((e) =>
      e.url ? toDataURL(e.url, { size: 480, margin: 1, dark: "#16171a" }) : null
    )
  )

  const vendidos = enlaces.reduce((acc, e) => acc + e.unidades, 0)
  const movido = enlaces.reduce((acc, e) => acc + e.ventasCents, 0)
  const conVentas = enlaces.filter((e) => e.unidades > 0).length

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Mis enlaces
          </p>
          <h1 className="mt-3 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
            Lo que promocionas.
          </h1>
          <p className="mt-3 max-w-[54ch] leading-relaxed opacity-70">
            Cada producto tiene su enlace con tu código. Quien compra por ahí
            compra con tu nombre, y el que compra por primera vez queda contigo
            90 días.
          </p>
        </div>
        <Link
          href="/vendedor/catalogo"
          className={cn(
            BOTON_SECUNDARIO,
            "w-full active:scale-[0.98] sm:w-auto"
          )}
        >
          <Plus aria-hidden="true" className="size-4" />
          Sumar productos
        </Link>
      </div>

      {enlaces.length === 0 ? (
        <Vacio
          titulo="Todavía no promocionas nada"
          detalle="Entra al catálogo y toca Promocionar en lo que te guste. Tu enlace y tu QR aparecen acá al instante."
          accion={{ href: "/vendedor/catalogo", texto: "Ir al catálogo" }}
        />
      ) : (
        <>
          <section className="grid gap-x-8 gap-y-8 sm:grid-cols-3">
            <Cifra
              etiqueta="Productos"
              valor={formatNumber(enlaces.length)}
              detalle={`${formatNumber(conVentas)} ya vendieron`}
            />
            <Cifra
              etiqueta="Unidades vendidas"
              valor={formatNumber(vendidos)}
              detalle="Con tus enlaces"
            />
            <Cifra
              etiqueta="Movido"
              valor={formatMoney(movido)}
              detalle="Lo que pagaron tus compradores"
            />
          </section>

          <ul className="border-t-2 border-tinta">
            {enlaces.map((enlace, i) => (
              <FilaEnlace
                key={enlace.id}
                enlace={enlace}
                qr={qrs[i]}
                completa
                destacada={creado === enlace.productoId}
              />
            ))}
          </ul>

          <p className="max-w-[62ch] text-sm leading-relaxed opacity-55">
            Dejar de promocionar un producto solo lo saca de esta lista: si un
            enlace tuyo ya circula por WhatsApp y alguien compra con él, la
            comisión sigue siendo tuya.
          </p>
        </>
      )}
    </div>
  )
}
