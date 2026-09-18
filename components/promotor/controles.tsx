"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

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
    const params = new URLSearchParams(searchParams.toString())
    if (texto.trim()) params.set("q", texto.trim())
    else params.delete("q")
    params.delete("p")
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

const FILTROS = ["categoria", "condicion", "precio", "publicado"] as const

/** Filtros del catálogo: cada cambio queda en la URL y conserva la búsqueda. */
export function FiltrosCatalogo({ categorias }: { categorias: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pendiente, startTransition] = React.useTransition()
  const activos = FILTROS.filter((clave) => searchParams.has(clave)).length

  function actualizar(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor) params.set(clave, valor)
    else params.delete(clave)
    params.delete("p")
    startTransition(() => {
      router.push(params.size ? `${pathname}?${params}` : pathname)
    })
  }

  function limpiar() {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    startTransition(() => {
      router.push(params.size ? `${pathname}?${params}` : pathname)
    })
  }

  return (
    <section
      aria-label="Filtros del catálogo"
      aria-busy={pendiente}
      className="border-y border-tinta/15 py-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-titular text-base font-bold tracking-[-0.02em]">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Afina tu búsqueda
          {activos > 0 ? (
            <span className="tabular rounded-full border border-tinta/25 px-2 py-0.5 text-xs font-semibold">
              {activos}
            </span>
          ) : null}
        </p>
        {activos > 0 ? (
          <button
            type="button"
            onClick={limpiar}
            disabled={pendiente}
            className="flex min-h-11 items-center gap-2 text-sm font-semibold opacity-60 transition-opacity hover:opacity-100 disabled:opacity-30"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Limpiar filtros
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-5">
        <Filtro
          etiqueta="Categoría"
          valor={searchParams.get("categoria") ?? ""}
          onChange={(valor) => actualizar("categoria", valor)}
          opciones={categorias.map((categoria) => ({
            valor: categoria,
            texto: categoria,
          }))}
          todas="Todas"
        />
        <Filtro
          etiqueta="Estado"
          valor={searchParams.get("condicion") ?? ""}
          onChange={(valor) => actualizar("condicion", valor)}
          opciones={[
            { valor: "nuevo", texto: "Nuevo" },
            { valor: "segunda_mano", texto: "Segunda mano" },
            { valor: "reacondicionado", texto: "Reacondicionado" },
          ]}
          todas="Cualquiera"
        />
        <Filtro
          etiqueta="Precio publicado"
          valor={searchParams.get("precio") ?? ""}
          onChange={(valor) => actualizar("precio", valor)}
          opciones={[
            { valor: "hasta_100", texto: "Hasta Bs 100" },
            { valor: "100_300", texto: "Bs 100 a 300" },
            { valor: "300_700", texto: "Bs 300 a 700" },
            { valor: "700_mas", texto: "Más de Bs 700" },
          ]}
          todas="Cualquier precio"
        />
        <Filtro
          etiqueta="Publicado"
          valor={searchParams.get("publicado") ?? ""}
          onChange={(valor) => actualizar("publicado", valor)}
          opciones={[
            { valor: "7", texto: "Últimos 7 días" },
            { valor: "30", texto: "Últimos 30 días" },
            { valor: "90", texto: "Últimos 90 días" },
          ]}
          todas="En cualquier fecha"
        />
        <Filtro
          etiqueta="Ordenar"
          valor={searchParams.get("orden") ?? "recientes"}
          onChange={(valor) => actualizar("orden", valor)}
          opciones={[
            { valor: "recientes", texto: "Más recientes" },
            { valor: "precio_asc", texto: "Menor precio" },
            { valor: "precio_desc", texto: "Mayor precio" },
            { valor: "stock_desc", texto: "Mayor stock" },
            { valor: "ofertas", texto: "Con oferta primero" },
          ]}
        />
      </div>
    </section>
  )
}

function Filtro({
  etiqueta,
  valor,
  opciones,
  todas,
  onChange,
}: {
  etiqueta: string
  valor: string
  opciones: Array<{ valor: string; texto: string }>
  todas?: string
  onChange: (valor: string) => void
}) {
  return (
    <label className="min-w-0">
      <span className="text-xs font-semibold tracking-[0.1em] uppercase opacity-50">
        {etiqueta}
      </span>
      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="mt-1 h-11 w-full min-w-0 border-0 border-b border-tinta bg-transparent px-0 text-sm font-semibold outline-none focus:border-senal"
      >
        {todas ? <option value="">{todas}</option> : null}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Paginación por enlaces: sin JavaScript sigue funcionando. */
export function Paginacion({
  pagina,
  paginas,
  base,
  parametros = {},
}: {
  pagina: number
  paginas: number
  base: string
  parametros?: Record<string, string | undefined>
}) {
  if (paginas <= 1) return null

  const href = (n: number) => {
    const params = new URLSearchParams()
    for (const [clave, valor] of Object.entries(parametros)) {
      if (valor) params.set(clave, valor)
    }
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
