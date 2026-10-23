"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BadgePercent,
  BellRing,
  Boxes,
  ChevronRight,
  Eye,
  FileText,
  FolderOpen,
  Layers,
  Loader2,
  Plus,
  Star,
  Wallet,
} from "lucide-react"
import { useForm, type Path, type PathValue } from "react-hook-form"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO_LINEA } from "@/lib/estilos"
import { CURRENCY_SYMBOL, formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { productoSchema, type ProductoInput } from "@/lib/validation/producto"
import {
  resumenDeOpciones,
  tipoSugerido,
  type Opcion,
  type Variante,
} from "@/lib/variantes"
import type { Product, ProductCategory } from "@/types"
import { Form } from "@/components/ui/form"
import {
  EditorDeVariantes,
  StockDeVariantes,
} from "@/components/productos/variantes"
import { Fotos } from "@/components/productos/fotos"
import {
  CampoMonto,
  Cantidad,
  ErrorDeAjuste,
  Fila,
  HojaDeAjuste,
  leerMonto,
  Palanca,
} from "@/components/panel/ajustes"

/** Centavos a bolivianos, para que el campo muestre lo que la persona escribió. */
function aMonto(centavos: number | null) {
  return centavos === null ? null : centavos / 100
}

type Hoja =
  "tallas" | "categoria" | "oferta" | "costo" | "aviso" | "descripcion" | null

/**
 * Alta y edición de un producto.
 *
 * Arriba lo que hace falta para vender —fotos, nombre y precio—, grande y
 * escrito ahí mismo. Todo lo demás es una fila con su valor a la vista
 * ("Categoría · Ropa", "Tallas y colores · S, M, L") que se abre en una hoja:
 * así la pantalla se lee de un vistazo y cada ajuste se explica donde se
 * cambia, no en una frase permanente bajo cada campo. La misma pantalla de la
 * app.
 *
 * Es el mismo formulario para crear y corregir: las reglas no cambian, y
 * mantener dos copias garantiza que una se quede atrás.
 */
export function FormularioProducto({
  tiendaId,
  categorias,
  producto,
  costoCents = null,
  opciones = [],
  variantes = [],
  guardar,
}: {
  tiendaId: string
  categorias: ProductCategory[]
  producto?: Product
  /** Lo que le cuesta a la tienda: vive aparte del producto, solo para ella. */
  costoCents?: number | null
  /** Talla, color, número: las opciones del producto y sus combinaciones. */
  opciones?: Opcion[]
  variantes?: Variante[]
  guardar: (
    entrada: ProductoInput,
    id?: string
  ) => Promise<{ ok: boolean; error?: string; id?: string }>
}) {
  const router = useRouter()
  const [hoja, setHoja] = React.useState<Hoja>(null)

  const form = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: producto?.name ?? "",
      descripcion: producto?.description ?? "",
      precio: producto ? producto.price_cents / 100 : undefined,
      precioAnterior: aMonto(producto?.compare_at_price_cents ?? null),
      costo: aMonto(costoCents),
      opciones,
      variantes: variantes.map((v) => ({
        valores: v.valores,
        stock: v.stock,
        precio: aMonto(v.precioCents),
        imagen: v.imagen,
      })),
      stock: producto?.stock ?? 0,
      avisoStock: producto?.low_stock_threshold ?? 3,
      categoriaId: producto?.category_id ?? null,
      sku: producto?.sku ?? "",
      fotos: producto?.images ?? [],
      activo: producto?.is_active ?? true,
      destacado: producto?.is_featured ?? false,
    },
  })
  const valores = form.watch()
  const errores = form.formState.errors
  const enCurso = form.formState.isSubmitting

  const opcionesActuales = valores.opciones ?? []
  const variantesActuales = valores.variantes ?? []
  const conVariantes = variantesActuales.length > 0
  const totalDeVariantes = variantesActuales.reduce(
    (suma, v) => suma + (v.stock || 0),
    0
  )
  const categoria = categorias.find((c) => c.id === valores.categoriaId)
  const sugerido = tipoSugerido(categoria?.name)
  const precio = valores.precio
  const anterior = valores.precioAnterior
  const descuento =
    precio && anterior && anterior > precio
      ? Math.round(((anterior - precio) / anterior) * 100)
      : null

  function poner<K extends Path<ProductoInput>>(
    campo: K,
    valor: PathValue<ProductoInput, K>
  ) {
    form.setValue(campo, valor, { shouldDirty: true })
    if (form.getFieldState(campo).error) form.clearErrors(campo)
  }

  function abrirTallas() {
    // Por buzos, las tallas; por botines, los números: la hoja abre ya en el
    // tipo que sugiere la categoría, y "Cambiar" deja elegir otro.
    if (opcionesActuales.length === 0 && sugerido) {
      poner("opciones", [{ nombre: sugerido.nombre, valores: [] }])
    }
    setHoja("tallas")
  }

  function cerrarHoja() {
    // Abrir las tallas y no marcar ninguna es no tenerlas: no es un error.
    const llenas = opcionesActuales.filter((o) => o.valores.length > 0)
    if (llenas.length < opcionesActuales.length) poner("opciones", llenas)
    setHoja(null)
  }

  async function alEnviar(entrada: ProductoInput) {
    const resultado = await guardar(entrada, producto?.id)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos guardar el producto.")
      return
    }

    toast.success(producto ? "Producto actualizado." : "Producto creado.")
    router.push("/panel/productos")
    router.refresh()
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    const llenas = opcionesActuales.filter((o) => o.valores.length > 0)
    if (llenas.length < opcionesActuales.length)
      form.setValue("opciones", llenas)
    return form.handleSubmit(alEnviar, () =>
      toast.error("Revisa lo que quedó en rojo.")
    )(evento)
  }

  const resumen = resumenDeOpciones(
    opcionesActuales.filter((o) => o.valores.length > 0)
  )
  const costo = valores.costo
  const ganancia =
    costo !== null && costo !== undefined && precio !== undefined
      ? Math.round((precio - costo) * 100)
      : null

  return (
    <Form {...form}>
      <form
        onSubmit={enviar}
        noValidate
        className="flex flex-col gap-6 pb-24 md:gap-8 lg:pb-0"
      >
        <Fotos
          valor={valores.fotos ?? []}
          alCambiar={(fotos) => poner("fotos", fotos)}
          carpeta={tiendaId}
        />

        <div className="flex flex-col gap-5">
          {/* El nombre en letra de titular: así se va a ver en la tienda. */}
          <div className="flex flex-col gap-1">
            <label htmlFor="producto-nombre" className="sr-only">
              Nombre del producto
            </label>
            <input
              id="producto-nombre"
              {...form.register("nombre")}
              placeholder="Nombre del producto"
              autoComplete="off"
              aria-invalid={Boolean(errores.nombre)}
              className={cn(
                "w-full border-b-2 border-tinta bg-transparent py-2 font-titular text-[1.75rem] leading-tight font-extrabold tracking-[-0.03em] outline-none placeholder:text-tinta/30 focus-visible:border-senal",
                errores.nombre && "border-senal"
              )}
            />
            <ErrorDeAjuste texto={errores.nombre?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <div
              className={cn(
                "flex items-baseline gap-2 border-b-2 border-tinta focus-within:border-senal",
                errores.precio && "border-senal"
              )}
            >
              <span className="font-titular text-2xl font-extrabold text-tinta/50">
                {CURRENCY_SYMBOL}
              </span>
              <label htmlFor="producto-precio" className="sr-only">
                Precio en bolivianos
              </label>
              <input
                id="producto-precio"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0"
                {...form.register("precio", {
                  // Vacío no es cero: sin precio, el esquema pide uno.
                  setValueAs: (v: string) => leerMonto(v) ?? undefined,
                })}
                aria-invalid={Boolean(errores.precio)}
                className="tabular min-w-0 flex-1 [appearance:textfield] bg-transparent py-1 font-titular text-[2.75rem] leading-none font-extrabold tracking-[-0.04em] outline-none placeholder:text-tinta/25 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {descuento ? (
                <span className="mb-2 shrink-0 -rotate-3 bg-senal px-2.5 py-1 font-titular text-lg font-extrabold text-white">
                  −{descuento}%
                </span>
              ) : null}
            </div>
            <ErrorDeAjuste texto={errores.precio?.message} />
          </div>
        </div>

        <ul className="border border-tinta">
          <li className="flex min-h-16 items-center gap-3 px-4 py-2">
            <Boxes aria-hidden="true" className="size-5 shrink-0" />
            <span className="flex-1 font-semibold">Unidades</span>
            {conVariantes ? (
              <button
                type="button"
                onClick={abrirTallas}
                className="flex min-h-11 items-center gap-1 text-tinta/65 transition-colors hover:text-tinta"
              >
                <span className="tabular">
                  {formatNumber(totalDeVariantes)} en total
                </span>
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            ) : (
              <Cantidad
                etiqueta="Unidades"
                valor={valores.stock ?? 0}
                alCambiar={(n) => poner("stock", n)}
              />
            )}
          </li>
          <Fila
            icono={Layers}
            titulo="Tallas y colores"
            valor={resumen ?? "No tiene"}
            apagado={!resumen}
            error={errores.opciones?.message ?? errores.variantes?.message}
            alTocar={abrirTallas}
          />
          <Fila
            icono={FolderOpen}
            titulo="Categoría"
            valor={categoria?.name ?? "Ninguna"}
            apagado={!categoria}
            alTocar={() => setHoja("categoria")}
          />
          <Fila
            icono={BadgePercent}
            titulo="Oferta"
            valor={
              anterior
                ? `Antes ${formatMoney(Math.round(anterior * 100))}`
                : "No"
            }
            apagado={!anterior}
            error={errores.precioAnterior?.message}
            alTocar={() => setHoja("oferta")}
          />
          <Fila
            icono={Wallet}
            titulo="Te cuesta"
            valor={
              costo === null || costo === undefined
                ? "—"
                : ganancia !== null && ganancia >= 0
                  ? `Ganas ${formatMoney(ganancia)}`
                  : formatMoney(Math.round(costo * 100))
            }
            apagado={costo === null || costo === undefined}
            peligro={ganancia !== null && ganancia < 0}
            error={errores.costo?.message}
            alTocar={() => setHoja("costo")}
          />
        </ul>

        <ul className="border border-tinta">
          <Palanca
            icono={Eye}
            titulo="Visible en tu tienda"
            valor={valores.activo ?? true}
            alCambiar={(si) => poner("activo", si)}
          />
          <Palanca
            icono={Star}
            titulo="Destacado en la portada"
            valor={valores.destacado ?? false}
            alCambiar={(si) => poner("destacado", si)}
          />
          <Fila
            icono={BellRing}
            titulo="Aviso de stock"
            valor={
              valores.avisoStock ? `Al quedar ${valores.avisoStock}` : "Apagado"
            }
            apagado={!valores.avisoStock}
            error={errores.avisoStock?.message}
            alTocar={() => setHoja("aviso")}
          />
          <Fila
            icono={FileText}
            titulo="Descripción"
            valor={
              valores.descripcion?.trim() ||
              valores.sku?.trim() ||
              "Sin agregar"
            }
            apagado={!valores.descripcion?.trim() && !valores.sku?.trim()}
            error={errores.descripcion?.message ?? errores.sku?.message}
            alTocar={() => setHoja("descripcion")}
          />
        </ul>

        {/* En el celular, la acción queda a mano sobre las pestañas. */}
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex gap-3 border-t border-tinta bg-papel px-4 py-3 lg:static lg:border-0 lg:p-0">
          <button
            type="submit"
            disabled={enCurso}
            className={cn(BOTON_PRIMARIO, "flex-1 lg:flex-none")}
          >
            {enCurso ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {producto ? "Guardar cambios" : "Cargar producto"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/panel/productos")}
            className={cn(BOTON_SECUNDARIO, "hidden lg:flex")}
          >
            Cancelar
          </button>
        </div>
      </form>

      <HojaDeAjuste
        abierta={hoja === "tallas"}
        titulo="Tallas y colores"
        descripcion="Marca las que tienes y pon las unidades de cada una."
        alCerrar={cerrarHoja}
      >
        <EditorDeVariantes
          opciones={opcionesActuales}
          variantes={variantesActuales}
          fotos={valores.fotos ?? []}
          sugerido={sugerido}
          enHoja
          alCambiar={(nuevasOpciones, nuevasVariantes) => {
            poner("opciones", nuevasOpciones)
            poner("variantes", nuevasVariantes)
          }}
          error={errores.opciones?.message}
        />
        {conVariantes ? (
          <StockDeVariantes
            opciones={opcionesActuales}
            variantes={variantesActuales}
            precio={precio}
            alCambiar={(nuevas) => poner("variantes", nuevas)}
            error={errores.variantes?.message}
          />
        ) : null}
      </HojaDeAjuste>

      <HojaDeAjuste
        abierta={hoja === "categoria"}
        titulo="Categoría"
        descripcion="Es como se agrupa en tu tienda."
        alCerrar={cerrarHoja}
        sinListo
      >
        <div role="radiogroup" aria-label="Categoría" className="-mx-1">
          {[{ id: null, name: "Ninguna" }, ...categorias].map((c) => {
            const elegida = (valores.categoriaId ?? null) === c.id
            return (
              <button
                key={c.id ?? "ninguna"}
                type="button"
                role="radio"
                aria-checked={elegida}
                onClick={() => {
                  poner("categoriaId", c.id)
                  setHoja(null)
                }}
                className="flex min-h-12 w-full items-center gap-3 border-b border-tinta/15 px-1 text-left font-semibold transition-colors hover:bg-tinta/[0.04]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    elegida ? "border-tinta" : "border-tinta/35"
                  )}
                >
                  {elegida ? (
                    <span className="size-2.5 rounded-full bg-tinta" />
                  ) : null}
                </span>
                {c.name}
              </button>
            )
          })}
        </div>
        <Link
          href="/panel/productos/categorias"
          className="flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
        >
          <Plus aria-hidden="true" className="size-4" />
          Crear una categoría
        </Link>
      </HojaDeAjuste>

      <HojaDeAjuste
        abierta={hoja === "oferta"}
        titulo="Oferta"
        descripcion="Tu tienda muestra el precio anterior tachado y el descuento."
        alCerrar={cerrarHoja}
      >
        <CampoMonto
          id="producto-anterior"
          etiqueta="Precio anterior"
          valor={anterior ?? null}
          alCambiar={(n) => poner("precioAnterior", n)}
          error={errores.precioAnterior?.message}
          enfocar
        />
        {descuento ? (
          <p className="text-sm font-semibold">
            Se ve con {descuento}% de descuento.
          </p>
        ) : null}
        {anterior ? (
          <button
            type="button"
            onClick={() => {
              poner("precioAnterior", null)
              setHoja(null)
            }}
            className="min-h-11 self-start text-sm font-semibold underline underline-offset-4"
          >
            Quitar la oferta
          </button>
        ) : null}
      </HojaDeAjuste>

      <HojaDeAjuste
        abierta={hoja === "costo"}
        titulo="Lo que te cuesta"
        descripcion="Solo lo ves tú. Con él, tu panel te dice cuánto ganas."
        alCerrar={cerrarHoja}
      >
        <CampoMonto
          id="producto-costo"
          etiqueta="Te cuesta"
          valor={costo ?? null}
          alCambiar={(n) => poner("costo", n)}
          error={errores.costo?.message}
          enfocar
        />
        {ganancia !== null ? (
          <p
            className={cn(
              "text-sm font-semibold",
              ganancia < 0 && "text-senal"
            )}
          >
            {ganancia < 0
              ? `Pierdes ${formatMoney(-ganancia)} por unidad.`
              : `Ganas ${formatMoney(ganancia)} por unidad${
                  precio ? ` (${Math.round(ganancia / precio)}%)` : ""
                }.`}
          </p>
        ) : null}
      </HojaDeAjuste>

      <HojaDeAjuste
        abierta={hoja === "aviso"}
        titulo="Avisarme si se acaba"
        descripcion="Cuando queden estas unidades, tu panel lo marca en rojo. En cero, no avisa."
        alCerrar={cerrarHoja}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">Cuando queden</span>
          <Cantidad
            etiqueta="Avisarme cuando queden"
            valor={valores.avisoStock ?? 3}
            alCambiar={(n) => poner("avisoStock", n)}
          />
        </div>
      </HojaDeAjuste>

      <HojaDeAjuste
        abierta={hoja === "descripcion"}
        titulo="Descripción y código"
        descripcion="La descripción la lee quien está por comprar; el código, solo tú."
        alCerrar={cerrarHoja}
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Descripción</span>
          <textarea
            {...form.register("descripcion")}
            rows={4}
            placeholder="De qué es, qué tallas hay, para qué sirve."
            className="resize-none border-b border-tinta bg-transparent py-2 text-base outline-none placeholder:text-tinta/35 focus-visible:border-senal"
          />
          <ErrorDeAjuste texto={errores.descripcion?.message} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Código interno</span>
          <input
            {...form.register("sku")}
            placeholder="POL-001"
            autoComplete="off"
            className={CAMPO_LINEA}
          />
          <ErrorDeAjuste texto={errores.sku?.message} />
        </label>
      </HojaDeAjuste>
    </Form>
  )
}
