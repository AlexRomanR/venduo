"use client"

import * as React from "react"
import Link from "next/link"
import {
  Copy,
  FileText,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { enlaceDeWhatsApp } from "@/components/catalogos/editor/exportar"
import { borrarCatalogo } from "@/app/(privado)/panel/catalogos/acciones"

const ICONO =
  "flex size-11 items-center justify-center opacity-65 transition-colors hover:text-senal hover:opacity-100"

/**
 * Lo que se hace con un catálogo guardado sin abrirlo: verlo en PDF,
 * mandarlo y borrarlo.
 */
export function AccionesDeCatalogo({
  id,
  nombre,
  tienda,
  enlace,
  esDemo,
}: {
  id: string
  nombre: string
  tienda: string
  enlace: string
  esDemo: boolean
}) {
  const [borrando, empezar] = React.useTransition()

  return (
    <div className="flex shrink-0 items-center">
      <a
        href={`/panel/catalogos/${id}/pdf`}
        target="_blank"
        rel="noopener"
        aria-label={`Abrir el PDF de ${nombre}`}
        className={ICONO}
      >
        <FileText aria-hidden="true" className="size-4" />
      </a>
      <Link
        href={`/panel/catalogos/${id}`}
        aria-label={`Editar ${nombre}`}
        className={ICONO}
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Más acciones para ${nombre}`}
          disabled={borrando}
          className={ICONO}
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            disabled={esDemo}
            onSelect={() =>
              window.open(
                enlaceDeWhatsApp(`${nombre} · ${tienda}\n${enlace}`),
                "_blank",
                "noopener"
              )
            }
          >
            <Send aria-hidden="true" className="size-4" />
            Mandar por WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={esDemo}
            onSelect={async () => {
              await navigator.clipboard.writeText(enlace)
              toast.success("Enlace copiado.")
            }}
          >
            <Copy aria-hidden="true" className="size-4" />
            Copiar el enlace
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={esDemo}
            onSelect={() => {
              // Se pregunta porque el enlace que ya se mandó deja de abrir.
              if (
                !window.confirm(
                  `¿Borrar «${nombre}»? El enlace que ya compartiste deja de abrir.`
                )
              ) {
                return
              }
              empezar(async () => {
                const resultado = await borrarCatalogo(id)
                if (resultado.ok) toast.success("Catálogo borrado.")
                else toast.error(resultado.error)
              })
            }}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Borrar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
