"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Buscador.
 *
 * Escribe en la URL en vez de guardar estado local: así el resultado se puede
 * compartir, el botón de atrás funciona y la consulta la sigue resolviendo el
 * servidor. Vuelve siempre a la página 1, porque la página 7 de otra búsqueda
 * no significa nada.
 */
export function Buscador({ etiqueta }: { etiqueta: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const actual = searchParams.get("q") ?? ""

  const [valor, setValor] = React.useState(actual)

  React.useEffect(() => {
    setValor(actual)
  }, [actual])

  function buscar(texto: string) {
    const params = new URLSearchParams()
    if (texto.trim()) params.set("q", texto.trim())
    router.push(params.size ? `${pathname}?${params}` : pathname)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        buscar(valor)
      }}
      className="flex items-center gap-2 border-b border-tinta pb-1"
      role="search"
    >
      <Search aria-hidden="true" className="size-4 shrink-0 opacity-40" />
      <input
        type="search"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        aria-label={etiqueta}
        placeholder={etiqueta}
        className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-tinta/35"
      />
      {actual ? (
        <button
          type="button"
          onClick={() => {
            setValor("")
            buscar("")
          }}
          aria-label="Limpiar la búsqueda"
          className="flex size-11 shrink-0 items-center justify-center opacity-55 transition-opacity hover:opacity-100"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      <button
        type="submit"
        className="flex min-h-11 shrink-0 items-center rounded-sm bg-senal px-4 text-sm font-semibold text-white transition-colors hover:bg-senal-alta"
      >
        Buscar
      </button>
    </form>
  )
}

/** Paginación por enlaces: sin JavaScript sigue funcionando. */
export function Paginacion({
  pagina,
  paginas,
  base,
  q,
}: {
  pagina: number
  paginas: number
  base: string
  q?: string
}) {
  if (paginas <= 1) return null

  const href = (n: number) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (n > 1) params.set("p", String(n))
    return params.size ? `${base}?${params}` : base
  }

  return (
    <nav
      aria-label="Paginación"
      className="mt-12 flex items-center gap-3 border-t border-tinta/15 pt-6"
    >
      <Salto
        href={href(pagina - 1)}
        activo={pagina > 1}
        etiqueta="Página anterior"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
      </Salto>

      <p className="tabular flex-1 text-center text-sm opacity-55">
        Página {pagina} de {paginas}
      </p>

      <Salto
        href={href(pagina + 1)}
        activo={pagina < paginas}
        etiqueta="Página siguiente"
      >
        <ArrowRight aria-hidden="true" className="size-4" />
      </Salto>
    </nav>
  )
}

function Salto({
  href,
  activo,
  etiqueta,
  children,
}: {
  href: string
  activo: boolean
  etiqueta: string
  children: React.ReactNode
}) {
  const clase =
    "flex size-11 items-center justify-center rounded-sm border-2 transition-colors"

  if (!activo) {
    return (
      <span
        aria-hidden="true"
        className={cn(clase, "border-tinta/15 text-tinta/25")}
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-label={etiqueta}
      className={cn(clase, "border-tinta hover:bg-tinta hover:text-papel")}
    >
      {children}
    </Link>
  )
}
