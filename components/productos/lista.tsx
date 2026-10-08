"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  ImageOff,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Insignia } from "@/components/panel/piezas"
import { useConfirmacion } from "@/components/panel/confirmar"

const CONDICION: Record<string, string> = {
  nuevo: "Nuevo",
  segunda_mano: "Segunda mano",
  reacondicionado: "Reacondicionado",
}

interface Acciones {
  alternar: (
    id: string,
    campo: "is_active" | "is_featured",
    valor: boolean
  ) => Promise<{ ok: boolean; error?: string }>
  ajustarStock: (
    id: string,
    stock: number
  ) => Promise<{ ok: boolean; error?: string }>
  borrar: (id: string) => Promise<{ ok: boolean; error?: string }>
}

/**
 * El catálogo, una fila por producto.
 *
 * No es una tabla: a 375 px una tabla de ocho columnas obliga a desplazar en
 * horizontal, y este panel se usa desde el celular. Cada producto es un bloque
 * que se reacomoda, con la foto y el nombre siempre visibles y el resto
 * fluyendo debajo.
 */
export function ListaProductos({
  productos,
  acciones,
  soloLectura = false,
}: {
  productos: Product[]
  acciones: Acciones
  /** En modo demo se ve todo pero no se guarda nada. */
  soloLectura?: boolean
}) {
  return (
    <ul className="flex flex-col">
      {productos.map((producto) => (
        <Fila
          key={producto.id}
          producto={producto}
          acciones={acciones}
          soloLectura={soloLectura}
        />
      ))}
    </ul>
  )
}

function Fila({
  producto,
  acciones,
  soloLectura,
}: {
  producto: Product
  acciones: Acciones
  soloLectura: boolean
}) {
  const router = useRouter()
  const [ocupado, setOcupado] = React.useState(false)
  const { preguntar, dialogo } = useConfirmacion()

  const sinStock = producto.stock === 0
  const pocoStock =
    producto.stock > 0 && producto.stock <= producto.low_stock_threshold

  async function correr(
    trabajo: () => Promise<{ ok: boolean; error?: string }>,
    exito: string
  ) {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }

    setOcupado(true)
    const resultado = await trabajo()
    setOcupado(false)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos guardar el cambio.")
      return
    }

    toast.success(exito)
    router.refresh()
  }

  return (
    <li
      className={cn(
        "border-t border-tinta/15 px-4 py-4 transition-opacity first:border-t-0 sm:px-5",
        ocupado && "opacity-50",
        !producto.is_active && "opacity-60"
      )}
    >
      {dialogo}
      <div className="flex gap-4">
        <div className="size-16 shrink-0 overflow-hidden border border-tinta/20 bg-tinta/5 sm:size-20">
          {producto.image_url ? (
            <Image
              src={producto.image_url}
              alt={producto.name}
              width={160}
              height={160}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff aria-hidden="true" className="size-5 opacity-25" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-titular text-base font-bold tracking-[-0.01em]">
                <Link
                  href={`/panel/productos/${producto.id}`}
                  className="inline-flex min-h-11 items-center transition-colors hover:text-senal"
                >
                  {producto.name}
                </Link>
              </h3>

              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs opacity-70">
                <span>{producto.category ?? "Sin categoría"}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {CONDICION[producto.condition] ?? producto.condition}
                </span>
                {producto.sku ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular">{producto.sku}</span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="text-right">
              <p className="tabular font-titular text-base font-bold tracking-[-0.01em]">
                {formatMoney(producto.price_cents)}
              </p>
              {producto.compare_at_price_cents ? (
                <p className="tabular text-xs line-through opacity-65">
                  {formatMoney(producto.compare_at_price_cents)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Stock
              producto={producto}
              sinStock={sinStock}
              pocoStock={pocoStock}
              soloLectura={soloLectura}
              guardar={(stock) =>
                correr(
                  () => acciones.ajustarStock(producto.id, stock),
                  "Stock actualizado."
                )
              }
            />

            {!producto.is_active ? (
              <Insignia tono="suave">Oculto</Insignia>
            ) : null}
            {producto.is_featured ? <Insignia>Destacado</Insignia> : null}

            <div className="ml-auto flex items-center gap-1">
              <Link
                href={`/panel/productos/${producto.id}`}
                aria-label={`Editar ${producto.name}`}
                className="flex size-11 items-center justify-center opacity-65 transition-colors hover:text-senal hover:opacity-100"
              >
                <Pencil aria-hidden="true" className="size-4" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Más acciones para ${producto.name}`}
                  className="flex size-11 items-center justify-center opacity-65 transition-colors hover:text-senal hover:opacity-100"
                >
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem
                    onSelect={() =>
                      correr(
                        () =>
                          acciones.alternar(
                            producto.id,
                            "is_active",
                            !producto.is_active
                          ),
                        producto.is_active
                          ? "Ya no se ve en tu tienda."
                          : "Publicado en tu tienda."
                      )
                    }
                  >
                    {producto.is_active ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                    {producto.is_active ? "Ocultar de la tienda" : "Publicar"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() =>
                      correr(
                        () =>
                          acciones.alternar(
                            producto.id,
                            "is_featured",
                            !producto.is_featured
                          ),
                        producto.is_featured
                          ? "Ya no está destacado."
                          : "Destacado en tu portada."
                      )
                    }
                  >
                    <Star aria-hidden="true" className="size-4" />
                    {producto.is_featured ? "Quitar destacado" : "Destacar"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={async () => {
                      // Se pregunta porque saca el producto de la tienda y de
                      // los enlaces que ya se compartieron.
                      const borrar = await preguntar({
                        titulo: `¿Sacar «${producto.name}» de tu catálogo?`,
                        texto:
                          "Deja de verse en tu tienda. Los pedidos que ya tenga se conservan.",
                        confirmar: "Borrar del catálogo",
                      })
                      if (!borrar) return
                      correr(
                        () => acciones.borrar(producto.id),
                        "Producto borrado."
                      )
                    }}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Borrar del catálogo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

/**
 * El stock se edita donde se mira.
 *
 * Contar unidades es lo que más veces por semana hace un emprendedor, y abrir
 * un formulario entero para cambiar un número es lo que hace que deje de
 * hacerlo y el catálogo mienta.
 */
function Stock({
  producto,
  sinStock,
  pocoStock,
  soloLectura,
  guardar,
}: {
  producto: Product
  sinStock: boolean
  pocoStock: boolean
  soloLectura: boolean
  guardar: (stock: number) => void
}) {
  const [valor, setValor] = React.useState(String(producto.stock))

  React.useEffect(() => setValor(String(producto.stock)), [producto.stock])

  function confirmar() {
    const numero = Number(valor)
    if (!Number.isInteger(numero) || numero < 0) {
      setValor(String(producto.stock))
      return
    }
    if (numero !== producto.stock) guardar(numero)
  }

  return (
    <label
      className={cn(
        "flex items-center gap-2 text-xs",
        sinStock && "text-senal",
        pocoStock && "text-senal"
      )}
    >
      <span className="font-semibold tracking-[0.1em] uppercase opacity-70">
        {sinStock ? "Sin stock" : pocoStock ? "Queda poco" : "Stock"}
      </span>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={valor}
        disabled={soloLectura}
        onChange={(e) => setValor(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
        aria-label={`Unidades de ${producto.name}`}
        className={cn(
          "tabular h-11 w-16 border-b bg-transparent text-center text-sm font-semibold transition-colors outline-none focus:border-senal",
          sinStock || pocoStock ? "border-senal" : "border-tinta/30"
        )}
      />
    </label>
  )
}
