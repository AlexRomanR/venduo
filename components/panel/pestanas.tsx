"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Archive,
  BookOpen,
  House,
  ReceiptText,
  Share,
  type LucideIcon,
} from "lucide-react"

import type { BarraLateral } from "@/lib/data/barra"
import { cn } from "@/lib/utils"
import { CompartirTienda } from "@/components/panel/tablero/compartir"

interface Pestana {
  nombre: string
  icono: LucideIcon
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
    { nombre: "Inicio", icono: House, href: "/panel", exacto: true },
    {
      nombre: "Pedidos",
      icono: ReceiptText,
      href: "/panel/pedidos",
      insignia: contadores.pedidosPendientes,
    },
    { nombre: "Productos", icono: Archive, href: "/panel/productos" },
    ...(funciones.catalogos === "oculta"
      ? []
      : [{ nombre: "Catálogos", icono: BookOpen, href: "/panel/catalogos" }]),
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
        <li className="flex-1">
          <CompartirTienda
            nombre={tienda.nombre}
            slug={tienda.slug}
            url={tienda.url}
            legible={tienda.url.replace(/^https?:\/\//, "")}
          >
            <button
              type="button"
              className="group flex h-16 w-full flex-col items-center justify-center gap-1"
            >
              <Icono
                pestana={{ nombre: "Compartir", icono: Share }}
                activa={false}
              />
              <Etiqueta activa={false}>Compartir</Etiqueta>
            </button>
          </CompartirTienda>
        </li>
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
      <Dibujo
        aria-hidden="true"
        className={cn("size-[22px]", activa ? "" : "opacity-60")}
        strokeWidth={activa ? 2.25 : 2}
      />
      {pestana.insignia ? (
        <span className="tabular absolute -top-0.5 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-senal px-1 text-[10px] font-bold text-white">
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
