"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Gauge,
  History,
  KeyRound,
  LayoutTemplate,
  SlidersHorizontal,
  Store,
} from "lucide-react"

import { cn } from "@/lib/utils"

/** Las secciones de `/admin`, en el orden en que se recorren. */
const SECCIONES = [
  { href: "/admin", texto: "Resumen", icono: Gauge, exacta: true },
  { href: "/admin/tiendas", texto: "Tiendas", icono: Store },
  { href: "/admin/plantillas", texto: "Plantillas", icono: LayoutTemplate },
  { href: "/admin/funciones", texto: "Funciones", icono: SlidersHorizontal },
  { href: "/admin/ia", texto: "Uso de IA", icono: Activity },
  { href: "/admin/registro", texto: "Registro", icono: KeyRound },
  { href: "/admin/cambios", texto: "Cambios", icono: History },
] as const

function activa(ruta: string, href: string, exacta?: boolean) {
  return exacta ? ruta === href : ruta === href || ruta.startsWith(`${href}/`)
}

/** La lista de la barra lateral, en escritorio. */
export function NavegacionLateral() {
  const ruta = usePathname()

  return (
    <nav aria-label="Administración" className="flex flex-col">
      {SECCIONES.map(({ href, texto, icono: Icono, ...resto }) => {
        const esta = activa(ruta, href, "exacta" in resto)
        return (
          <Link
            key={href}
            href={href}
            prefetch
            aria-current={esta ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 border-l-2 px-5 text-sm font-semibold transition-colors",
              esta
                ? "border-tinta bg-tinta/[0.06]"
                : "border-transparent opacity-75 hover:bg-tinta/[0.04] hover:opacity-100"
            )}
          >
            <Icono aria-hidden="true" className="size-4 shrink-0" />
            {texto}
          </Link>
        )
      })}
    </nav>
  )
}

/** La misma lista en el celular: una franja que se desliza con el dedo. */
export function NavegacionMovil() {
  const ruta = usePathname()

  return (
    <nav
      aria-label="Administración"
      className="[scrollbar-width:none] overflow-x-auto border-b border-tinta/15 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-1 px-3">
        {SECCIONES.map(({ href, texto, ...resto }) => {
          const esta = activa(ruta, href, "exacta" in resto)
          return (
            <li key={href}>
              <Link
                href={href}
                prefetch
                aria-current={esta ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold whitespace-nowrap",
                  esta ? "border-tinta" : "border-transparent opacity-70"
                )}
              >
                {texto}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
