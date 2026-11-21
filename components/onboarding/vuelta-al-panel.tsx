"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

/**
 * "Volver a mi panel", arriba del alta, para quien ya tiene panel. En el último
 * paso no va: ahí el botón grande "Ir a mi panel" ya hace lo mismo, y los dos
 * juntos parecían dos caminos distintos.
 */
export function VueltaAlPanel({ className }: { className: string }) {
  const pathname = usePathname()
  if (pathname === "/crear/listo") return null

  return (
    <Link href="/auth/destino" className={className}>
      <ArrowLeft aria-hidden="true" className="size-4" />
      Volver a mi panel
    </Link>
  )
}
