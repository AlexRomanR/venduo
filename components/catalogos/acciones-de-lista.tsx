"use client"

import * as React from "react"
import Link from "next/link"
import {
  Copy,
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { AVISO_DE_NO_DISPONIBLE, type EstadoDeFuncion } from "@/lib/funciones"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { enlaceDeWhatsApp } from "@/components/catalogos/editor/exportar"
import { borrarCatalogo } from "@/app/(privado)/panel/catalogos/acciones"
import { useConfirmacion } from "@/components/panel/confirmar"

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
  compartir = "activa",
  esDemo,
}: {
  id: string
  nombre: string
  tienda: string
  enlace: string
  /** Si Venduo dejó activo el enlace público de catálogo. */
  compartir?: EstadoDeFuncion
  esDemo: boolean
}) {
  const [borrando, empezar] = React.useTransition()
  const { preguntar, dialogo } = useConfirmacion()

  return (
    <div className="flex shrink-0 items-center">
      {dialogo}
      <a
        href={`/panel/catalogos/${id}/pdf`}
        target="_blank"
        rel="noopener"
        aria-label={`Abrir el PDF de ${nombre}`}
        className={cn(ICONO, "hidden sm:flex")}
      >
        <FileText aria-hidden="true" className="size-4" />
      </a>
      <Link
        href={`/panel/catalogos/${id}`}
        aria-label={`Editar ${nombre}`}
        className={cn(ICONO, "hidden sm:flex")}
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
          {/* En el celular el PDF y el lápiz viven acá: tres íconos de 44 px
              le dejaban al nombre del catálogo siete letras. */}
          <DropdownMenuItem asChild className="sm:hidden">
            <a
              href={`/panel/catalogos/${id}/pdf`}
              target="_blank"
              rel="noopener"
            >
              <FileText aria-hidden="true" className="size-4" />
              Abrir el PDF
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="sm:hidden">
            <Link href={`/panel/catalogos/${id}`}>
              <Pencil aria-hidden="true" className="size-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuItem asChild>
            {/* El servidor lo manda como archivo: el navegador lo guarda en
                Descargas, con su nombre y su .pdf. */}
            <a href={`/panel/catalogos/${id}/pdf?descargar=1`} download>
              <Download aria-hidden="true" className="size-4" />
              Descargar el PDF
            </a>
          </DropdownMenuItem>
          {compartir !== "oculta" ? (
            <>
              <DropdownMenuItem
                disabled={esDemo}
                className={cn(compartir === "desactivada" && "opacity-55")}
                onSelect={() => {
                  if (compartir !== "activa") {
                    toast.info(AVISO_DE_NO_DISPONIBLE)
                    return
                  }
                  window.open(
                    enlaceDeWhatsApp(`${nombre} · ${tienda}\n${enlace}`),
                    "_blank",
                    "noopener"
                  )
                }}
              >
                <Send aria-hidden="true" className="size-4" />
                Mandar por WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={esDemo}
                className={cn(compartir === "desactivada" && "opacity-55")}
                onSelect={async () => {
                  if (compartir !== "activa") {
                    toast.info(AVISO_DE_NO_DISPONIBLE)
                    return
                  }
                  await navigator.clipboard.writeText(enlace)
                  toast.success("Enlace copiado.")
                }}
              >
                <Copy aria-hidden="true" className="size-4" />
                Copiar el enlace
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={esDemo}
            onSelect={async () => {
              // Se pregunta porque el enlace que ya se mandó deja de abrir.
              const borrar = await preguntar({
                titulo: `¿Borrar «${nombre}»?`,
                texto: "El enlace que ya compartiste deja de abrir.",
                confirmar: "Borrar el catálogo",
              })
              if (!borrar) return
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
