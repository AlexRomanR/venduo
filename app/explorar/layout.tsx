import { MarcoDeCuenta } from "@/components/panel/armazon"
import { NavExplorar } from "@/components/explorar/nav"

/**
 * Las vitrinas del vendedor. Con la barra si ya tiene panel —llegó desde
 * "Buscar tiendas"—, con el marco del alta si todavía no.
 */
export default function ExplorarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MarcoDeCuenta>
      <NavExplorar />
      {children}
    </MarcoDeCuenta>
  )
}
