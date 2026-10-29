import Link from "next/link"
import {
  ChevronRight,
  FileSpreadsheet,
  Images,
  NotebookPen,
  Plus,
  type LucideIcon,
} from "lucide-react"

/**
 * Productos sin productos: las formas de cargar lo que ya se tiene, en vez
 * de un solo "Cargar el primero". Las tres primeras llevan a la carga de
 * varios; la última, al formulario de uno.
 */
export function PrimerosProductos() {
  return (
    <div>
      <div className="px-4 py-5 sm:px-5">
        <p className="font-semibold">Todavía no cargaste productos</p>
        <p className="mt-1 text-sm text-tinta/70">
          Sube lo que ya tienes: la IA arma los borradores y tú los revisas.
        </p>
      </div>
      <ul>
        <Puerta
          href="/panel/productos/cargar"
          icono={Images}
          titulo="Fotos de tus productos"
          detalle="Hasta 40, uno por foto"
        />
        <Puerta
          href="/panel/productos/cargar"
          icono={FileSpreadsheet}
          titulo="Una planilla"
          detalle="Excel o CSV, como la tengas"
        />
        <Puerta
          href="/panel/productos/cargar"
          icono={NotebookPen}
          titulo="Una lista escrita"
          detalle="Foto del cuaderno o el texto"
        />
        <Puerta
          href="/panel/productos/nuevo"
          icono={Plus}
          titulo="Uno por uno"
          detalle="Con su foto, su precio y sus unidades"
        />
      </ul>
    </div>
  )
}

function Puerta({
  href,
  icono: Icono,
  titulo,
  detalle,
}: {
  href: string
  icono: LucideIcon
  titulo: string
  detalle: string
}) {
  return (
    <li className="border-t border-tinta/15">
      <Link
        href={href}
        className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-tinta/[0.04] active:bg-tinta/[0.07] sm:px-5"
      >
        <Icono aria-hidden="true" className="size-5 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{titulo}</span>
          <span className="text-sm text-tinta/65">{detalle}</span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 opacity-55"
        />
      </Link>
    </li>
  )
}
