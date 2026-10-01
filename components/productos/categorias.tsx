"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  FolderPlus,
  Loader2,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, CAMPO_LINEA, ETIQUETA_CAMPO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import type { CategoriaConUso } from "@/lib/data/catalogo"
import type { CategoriaInput } from "@/lib/validation/producto"
import { Seccion, SinDatos } from "@/components/panel/piezas"

interface Props {
  categorias: CategoriaConUso[]
  soloLectura?: boolean
  guardar: (
    entrada: CategoriaInput,
    id?: string
  ) => Promise<{ ok: boolean; error?: string }>
  borrar: (id: string) => Promise<{ ok: boolean; error?: string }>
}

/**
 * Las categorías del catálogo.
 *
 * Se editan en la misma línea donde se leen: son nombres cortos y una lista de
 * seis, y mandar a otra pantalla para cambiar una palabra es más pantalla que
 * trabajo.
 */
export function Categorias({
  categorias,
  soloLectura = false,
  guardar,
  borrar,
}: Props) {
  const router = useRouter()
  const [nombre, setNombre] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [creando, setCreando] = React.useState(false)
  const [editando, setEditando] = React.useState<string | null>(null)

  function bloqueado() {
    if (!soloLectura) return false
    toast.info("Estás en modo demo: los cambios no se guardan.")
    return true
  }

  async function crear(evento: React.FormEvent) {
    evento.preventDefault()
    if (bloqueado() || !nombre.trim()) return

    setCreando(true)
    const resultado = await guardar({ nombre, descripcion })
    setCreando(false)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos crear la categoría.")
      return
    }

    setNombre("")
    setDescripcion("")
    toast.success("Categoría creada.")
    router.refresh()
  }

  return (
    <>
      <Seccion
        id="nueva-categoria"
        icono={FolderPlus}
        titulo="Una categoría nueva"
        bajada="Un nombre corto, como lo buscaría quien compra."
        relleno
      >
        <form
          onSubmit={crear}
          className="grid gap-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
        >
          <div>
            <label htmlFor="cat-nombre" className={ETIQUETA_CAMPO}>
              Nombre
            </label>
            <input
              id="cat-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Poleras"
              maxLength={60}
              autoComplete="off"
              className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
            />
          </div>

          <div>
            <label htmlFor="cat-detalle" className={ETIQUETA_CAMPO}>
              Descripción
            </label>
            <input
              id="cat-detalle"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Opcional: qué entra en esta categoría"
              maxLength={200}
              autoComplete="off"
              className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
            />
          </div>

          <button
            type="submit"
            disabled={creando || nombre.trim().length < 2}
            className={cn(BOTON_PRIMARIO, "sm:w-auto")}
          >
            {creando ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Plus aria-hidden="true" className="size-4" />
            )}
            Crear
          </button>
        </form>
      </Seccion>

      <Seccion
        id="tus-categorias"
        icono={Tags}
        titulo="Tus categorías"
        bajada="Renombrar una arrastra a sus productos; borrarla no borra ninguno."
        extra={
          categorias.length > 0 ? (
            <span className="tabular text-sm opacity-70">
              {categorias.length}{" "}
              {categorias.length === 1 ? "categoría" : "categorías"}
            </span>
          ) : null
        }
      >
        {categorias.length === 0 ? (
          <SinDatos
            icono={Tags}
            titulo="Todavía no tienes categorías"
            texto="Sirven para que quien entre a tu tienda encuentre lo que busca sin recorrer todo el catálogo, y para filtrar tus propios productos."
          />
        ) : (
          <ul className="flex flex-col">
            {categorias.map((categoria) => (
              <li
                key={categoria.id}
                className="border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5"
              >
                {editando === categoria.id ? (
                  <Edicion
                    categoria={categoria}
                    cancelar={() => setEditando(null)}
                    guardar={async (entrada) => {
                      if (bloqueado()) return
                      const resultado = await guardar(entrada, categoria.id)
                      if (!resultado.ok) {
                        toast.error(resultado.error ?? "No pudimos guardarla.")
                        return
                      }
                      setEditando(null)
                      toast.success("Categoría actualizada.")
                      router.refresh()
                    }}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-titular text-base font-bold tracking-[-0.01em]">
                        {categoria.name}
                      </h3>
                      <p className="mt-0.5 text-xs opacity-70">
                        {categoria.productos === 0
                          ? "Sin productos todavía"
                          : `${categoria.productos} ${categoria.productos === 1 ? "producto" : "productos"}`}
                        {categoria.description
                          ? ` · ${categoria.description}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditando(categoria.id)}
                        aria-label={`Editar ${categoria.name}`}
                        className="flex size-11 items-center justify-center opacity-65 transition-colors hover:text-senal hover:opacity-100"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </button>

                      <button
                        type="button"
                        aria-label={`Borrar ${categoria.name}`}
                        onClick={async () => {
                          if (bloqueado()) return
                          if (
                            !window.confirm(
                              categoria.productos > 0
                                ? `"${categoria.name}" tiene ${categoria.productos} producto(s). Se quedan en tu catálogo, pero sin categoría. ¿Borrarla?`
                                : `¿Borrar "${categoria.name}"?`
                            )
                          ) {
                            return
                          }
                          const resultado = await borrar(categoria.id)
                          if (!resultado.ok) {
                            toast.error(
                              resultado.error ?? "No pudimos borrarla."
                            )
                            return
                          }
                          toast.success("Categoría borrada.")
                          router.refresh()
                        }}
                        className="flex size-11 items-center justify-center opacity-65 transition-colors hover:text-senal hover:opacity-100"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </>
  )
}

function Edicion({
  categoria,
  cancelar,
  guardar,
}: {
  categoria: CategoriaConUso
  cancelar: () => void
  guardar: (entrada: CategoriaInput) => Promise<void>
}) {
  const [nombre, setNombre] = React.useState(categoria.name)
  const [descripcion, setDescripcion] = React.useState(
    categoria.description ?? ""
  )
  const [guardando, setGuardando] = React.useState(false)

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        maxLength={60}
        aria-label="Nombre de la categoría"
        className={cn(CAMPO_LINEA, "w-full outline-none")}
      />
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={200}
        placeholder="Descripción"
        aria-label="Descripción de la categoría"
        className={cn(CAMPO_LINEA, "w-full outline-none")}
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={guardando || nombre.trim().length < 2}
          onClick={async () => {
            setGuardando(true)
            await guardar({ nombre, descripcion })
            setGuardando(false)
          }}
          aria-label="Guardar"
          className="flex size-11 items-center justify-center text-senal disabled:opacity-40"
        >
          {guardando ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Check aria-hidden="true" className="size-4" />
          )}
        </button>
        <button
          type="button"
          onClick={cancelar}
          aria-label="Cancelar"
          className="flex size-11 items-center justify-center opacity-45 transition-colors hover:opacity-100"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  )
}
