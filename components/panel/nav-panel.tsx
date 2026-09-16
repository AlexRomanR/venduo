"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface ItemNav {
  href: string
  nombre: string
}

/**
 * Navegación persistente del panel.
 *
 * Envuelve en vez de desplazarse de lado: a 375 px una fila que se va fuera de
 * pantalla esconde la mitad de las secciones, y acá no hay un botón de acción
 * que justifique ese riesgo — es el mapa del panel.
 *
 * La sección activa se marca con la regla de 2 px, el mismo trazo de apertura
 * que corona un tema en el resto del sistema.
 */
export function NavPanel({ items }: { items: ItemNav[] }) {
  const pathname = usePathname()

  if (items.length === 0) return null

  return (
    <nav
      aria-label="Secciones del panel"
      className="flex flex-wrap gap-x-6 gap-y-0 border-t border-tinta/15"
    >
      {items.map((item) => {
        // `/panel` coincidiría con todas sus subsecciones si se comparara por
        // prefijo, así que la raíz se compara exacta.
        const activo =
          item.href === "/panel" || item.href === "/vendedor"
            ? pathname === item.href
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "-mt-px flex min-h-11 items-center border-t-2 text-sm font-semibold transition-colors",
              // El color además del trazo: cuando la fila envuelve a 375 px, la
              // regla superior del activo cae entre dos filas y parece marcar
              // el ítem de arriba. El rojo no deja lugar a dudas.
              activo
                ? "border-senal text-senal"
                : "border-transparent opacity-55 hover:opacity-100"
            )}
          >
            {item.nombre}
          </Link>
        )
      })}
    </nav>
  )
}
