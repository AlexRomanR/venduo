"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { BarraLateral } from "@/lib/data/barra"
import { cn } from "@/lib/utils"
import {
  IconoCatalogos,
  IconoCompartir,
  IconoInicio,
  IconoPedidos,
  IconoProductos,
} from "@/components/panel/iconos-de-pestanas"

interface Pestana {
  nombre: string
  icono: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
  href?: string
  exacto?: boolean
  insignia?: number
}

/**
 * La barra de abajo en el celular: la misma de la app —Inicio, Pedidos,
 * Productos, Catálogos y Compartir—, al alcance del pulgar. Lo demás vive en
 * el menú lateral. El número de Pedidos es el de "Por cobrar", y va en la
 * señal porque pide una acción.
 */
export function Pestanas({ datos }: { datos: BarraLateral }) {
  const pathname = usePathname()
  const { tienda, contadores, funciones } = datos
  // El editor de un catálogo va a pantalla completa, como en la app, y tiene
  // su propia barra abajo.
  if (!tienda || /^\/panel\/catalogos\/.+/.test(pathname)) return null

  const pestanas: Pestana[] = [
    { nombre: "Inicio", icono: IconoInicio, href: "/panel", exacto: true },
    {
      nombre: "Pedidos",
      icono: IconoPedidos,
      href: "/panel/pedidos",
      insignia: contadores.pedidosPendientes,
    },
    { nombre: "Productos", icono: IconoProductos, href: "/panel/productos" },
    ...(funciones.catalogos === "oculta"
      ? []
      : [
          {
            nombre: "Catálogos",
            icono: IconoCatalogos,
            href: "/panel/catalogos",
          },
        ]),
    { nombre: "Compartir", icono: IconoCompartir, href: "/panel/compartir" },
  ]

  return (
    <nav
      aria-label="Lo de todos los días"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-tinta/15 bg-papel pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {pestanas.map((pestana) => {
          const activa = pestana.exacto
            ? pathname === pestana.href
            : Boolean(pestana.href && pathname.startsWith(pestana.href))
          return (
            <li key={pestana.nombre} className="flex-1">
              <Link
                href={pestana.href!}
                prefetch
                aria-current={activa ? "page" : undefined}
                className="group flex h-16 flex-col items-center justify-center gap-1"
              >
                <Icono pestana={pestana} activa={activa} />
                <Etiqueta activa={activa}>{pestana.nombre}</Etiqueta>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** El ícono dentro de su pastilla, como en la barra de Material de la app. */
function Icono({ pestana, activa }: { pestana: Pestana; activa: boolean }) {
  const Dibujo = pestana.icono
  return (
    <span
      className={cn(
        "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200",
        activa ? "bg-tinta/10" : "group-active:bg-tinta/[0.06]"
      )}
    >
      <Dibujo className={cn("size-6", activa ? "" : "opacity-60")} />
      {pestana.insignia ? (
        <span
          className={cn(
            "tabular absolute -top-1 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold",
            // En la pestaña en la que estás, lo que pide ya está a la vista.
            activa ? "bg-tinta text-papel" : "bg-senal text-white"
          )}
        >
          {pestana.insignia > 99 ? "99+" : pestana.insignia}
        </span>
      ) : null}
    </span>
  )
}

function Etiqueta({
  activa,
  children,
}: {
  activa: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "text-xs leading-none",
        activa ? "font-semibold" : "font-medium opacity-70"
      )}
    >
      {children}
    </span>
  )
}
