import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Sección del panel todavía sin construir.
 *
 * Existe para que los accesos directos del resumen lleven a algún lado: un
 * enlace que da 404 se lee como un producto roto, y uno que dice qué va a ir
 * ahí se lee como un producto en construcción. Se reemplaza entera cuando la
 * sección se implemente.
 */
export function SeccionPendiente({
  titulo,
  detalle,
  loQueVa,
}: {
  titulo: string
  detalle: string
  loQueVa: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{detalle}</p>
      </div>

      <div className="rounded-lg border border-dashed p-8">
        <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          {loQueVa}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/panel">
            <ArrowLeft />
            Volver al resumen
          </Link>
        </Button>
      </div>
    </div>
  )
}
