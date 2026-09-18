"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO_LINEA,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { CURRENCY_SYMBOL, formatMoney } from "@/lib/format"
import { construirPrecio, porcentaje, type Tramo } from "@/lib/precio"
import { cn } from "@/lib/utils"
import {
  CONDICIONES,
  productoSchema,
  type ProductoInput,
} from "@/lib/validation/producto"
import type { Product, ProductCategory } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Fotos } from "@/components/productos/fotos"

/** Centavos a bolivianos, para que el campo muestre lo que la persona escribió. */
function aMonto(centavos: number | null) {
  return centavos === null ? null : centavos / 100
}

function Bloque({
  titulo,
  detalle,
  children,
}: {
  titulo: string
  detalle?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-tinta/15 pt-8">
      <h2 className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        {titulo}
      </h2>
      {detalle ? (
        <p className="mt-2 max-w-[62ch] text-sm leading-relaxed opacity-55">
          {detalle}
        </p>
      ) : null}
      <div className="mt-6 grid gap-6">{children}</div>
    </section>
  )
}

/**
 * Lo que el negocio recibe, lo que gana quien venda y a cuánto se publica.
 *
 * Se muestra mientras se escribe porque es la pregunta que aparece sola al
 * declarar un costo base: "¿y en cuánto lo van a ver?". Esconderlo hasta
 * guardar hace que la primera carga se sienta una apuesta.
 */
function Desglose({ precio }: { precio: ReturnType<typeof construirPrecio> }) {
  return (
    <div className="border-t-2 border-tinta pt-5">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="opacity-70">Recibes</dt>
          <dd className="tabular font-semibold">
            {formatMoney(precio.baseCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="opacity-70">
            Comisión del promotor
            <span className="tabular ml-2 opacity-55">
              {porcentaje(precio.comisionBps)}
            </span>
          </dt>
          <dd className="tabular opacity-70">
            {formatMoney(precio.comisionCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="opacity-70">
            Venduo
            <span className="tabular ml-2 opacity-55">
              {porcentaje(precio.takeBps)}
            </span>
          </dt>
          <dd className="tabular opacity-70">
            {formatMoney(precio.takeCents)}
          </dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-tinta/15 pt-3">
          <dt className="font-titular text-lg font-bold tracking-[-0.02em]">
            Se publica en
          </dt>
          <dd className="tabular font-titular text-2xl font-extrabold tracking-[-0.03em] text-senal">
            {formatMoney(precio.precioCents)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 max-w-[58ch] text-xs leading-relaxed opacity-55">
        Si nadie lo promociona y el comprador llega solo al catálogo, la
        comisión también es tuya.
      </p>
    </div>
  )
}

/**
 * Alta y edición de un producto.
 *
 * Es el mismo formulario para los dos casos: las reglas no cambian entre crear
 * y corregir, y mantener dos copias garantiza que una se quede atrás.
 */
export function FormularioProducto({
  tiendaId,
  categorias,
  tramos,
  producto,
  guardar,
  destino = "/panel/productos",
}: {
  tiendaId: string
  categorias: ProductCategory[]
  /** Los tramos vigentes, para mostrar el desglose mientras se escribe. */
  tramos: Tramo[]
  producto?: Product
  /** A dónde ir al guardar. La guía del primer ingreso lo usa para volver. */
  destino?: string
  guardar: (
    entrada: ProductoInput,
    id?: string
  ) => Promise<{ ok: boolean; error?: string; id?: string }>
}) {
  const router = useRouter()

  const form = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: producto?.name ?? "",
      descripcion: producto?.description ?? "",
      costoBase: producto ? producto.base_cost_cents / 100 : undefined,
      precioAnterior: aMonto(producto?.compare_at_price_cents ?? null),
      stock: producto?.stock ?? 0,
      avisoStock: producto?.low_stock_threshold ?? 3,
      categoriaId: producto?.category_id ?? null,
      condicion: producto?.condition ?? "nuevo",
      notaCondicion: producto?.condition_note ?? "",
      sku: producto?.sku ?? "",
      fotos: producto?.images ?? [],
      activo: producto?.is_active ?? true,
      destacado: producto?.is_featured ?? false,
      aceptaVendedores: producto?.seller_enabled ?? true,
    },
  })

  const condicion = form.watch("condicion")
  const costoBase = form.watch("costoBase")
  const enCurso = form.formState.isSubmitting

  // El desglose se calcula acá con los mismos tramos que usa la base. Es para
  // mostrar: al guardar, Postgres lo vuelve a calcular y ese es el que vale.
  const precio = construirPrecio(
    Math.max(Number(costoBase) || 0, 0) * 100,
    tramos
  )

  async function alEnviar(valores: ProductoInput) {
    const resultado = await guardar(valores, producto?.id)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos guardar el producto.")
      return
    }

    toast.success(producto ? "Producto actualizado." : "Producto creado.")
    router.push(destino)
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(alEnviar)}
        className="flex flex-col gap-10"
      >
        <Bloque titulo="Lo básico">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={ETIQUETA_CAMPO}>Nombre</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={CAMPO_LINEA}
                    placeholder="Polera básica de algodón"
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage className="text-senal" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={ETIQUETA_CAMPO}>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="De qué es, qué talles hay, para qué sirve."
                    className="resize-none rounded-none border-0 border-b border-tinta bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:ring-0"
                  />
                </FormControl>
                <FormDescription className={AYUDA_CAMPO}>
                  Es lo que lee quien está por comprar. Sin esto, tu producto
                  compite solo por el precio.
                </FormDescription>
                <FormMessage className="text-senal" />
              </FormItem>
            )}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="categoriaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>Categoría</FormLabel>
                  <Select
                    value={field.value ?? "sin"}
                    onValueChange={(v) =>
                      field.onChange(v === "sin" ? null : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          CAMPO_LINEA,
                          "w-full data-[size=default]:h-12"
                        )}
                      >
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sin">Sin categoría</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className={AYUDA_CAMPO}>
                    {categorias.length === 0
                      ? "Todavía no creaste ninguna. Se crean desde Categorías."
                      : "Es como se agrupa en tu tienda."}
                  </FormDescription>
                  <FormMessage className="text-senal" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>
                    Código interno
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={CAMPO_LINEA}
                      placeholder="POL-001"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription className={AYUDA_CAMPO}>
                    Opcional. Para buscarlo rápido y dictarlo por teléfono.
                  </FormDescription>
                  <FormMessage className="text-senal" />
                </FormItem>
              )}
            />
          </div>
        </Bloque>

        <Bloque
          titulo="Fotos"
          detalle="Lo primero que mira quien compra desde el celular."
        >
          <FormField
            control={form.control}
            name="fotos"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Fotos
                    valor={field.value ?? []}
                    alCambiar={field.onChange}
                    carpeta={tiendaId}
                  />
                </FormControl>
                <FormMessage className="text-senal" />
              </FormItem>
            )}
          />
        </Bloque>

        <Bloque
          titulo="Precio"
          detalle="Tú pones cuánto quieres recibir. Venduo suma encima la comisión del promotor que venda y su propia parte, y ese es el precio que ve quien compra."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="costoBase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>
                    Cuánto quieres recibir, en {CURRENCY_SYMBOL}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      className={cn(CAMPO_LINEA, "tabular")}
                      placeholder="85"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription className={AYUDA_CAMPO}>
                    Es lo que te llega por cada venta, sin descuentos.
                  </FormDescription>
                  <FormMessage className="text-senal" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="precioAnterior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>
                    Precio anterior
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      className={cn(CAMPO_LINEA, "tabular")}
                      placeholder="Sin descuento"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription className={AYUDA_CAMPO}>
                    Opcional. Si lo pones, se muestra el descuento.
                  </FormDescription>
                  <FormMessage className="text-senal" />
                </FormItem>
              )}
            />
          </div>

          <Desglose precio={precio} />
        </Bloque>

        <Bloque titulo="Stock">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>
                    Unidades disponibles
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="0"
                      className={cn(CAMPO_LINEA, "tabular")}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className={AYUDA_CAMPO}>
                    Al llegar a cero deja de poder comprarse.
                  </FormDescription>
                  <FormMessage className="text-senal" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avisoStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>
                    Avisarme cuando queden
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="0"
                      className={cn(CAMPO_LINEA, "tabular")}
                      value={field.value ?? 3}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className={AYUDA_CAMPO}>
                    El panel lo marca en rojo. Cero apaga el aviso.
                  </FormDescription>
                  <FormMessage className="text-senal" />
                </FormItem>
              )}
            />
          </div>
        </Bloque>

        <Bloque titulo="Estado del artículo">
          <FormField
            control={form.control}
            name="condicion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={ETIQUETA_CAMPO}>Condición</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        CAMPO_LINEA,
                        "w-full data-[size=default]:h-12"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONDICIONES.map((c) => (
                      <SelectItem key={c.valor} value={c.valor}>
                        {c.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className={AYUDA_CAMPO}>
                  Es lo que alimenta el filtro de segunda mano de tu tienda.
                </FormDescription>
                <FormMessage className="text-senal" />
              </FormItem>
            )}
          />

          {condicion !== "nuevo" ? (
            <FormField
              control={form.control}
              name="notaCondicion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>
                    En qué estado está
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Usada una temporada. Sin roturas ni manchas, cierre nuevo."
                      className="resize-none rounded-none border-0 border-b border-tinta bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:ring-0"
                    />
                  </FormControl>
                  <FormMessage className="text-senal" />
                </FormItem>
              )}
            />
          ) : null}
        </Bloque>

        <Bloque titulo="Dónde aparece">
          {(
            [
              {
                nombre: "activo" as const,
                etiqueta: "Publicado en mi tienda",
                ayuda: "Si lo apagas, sigue en tu catálogo pero nadie lo ve.",
              },
              {
                nombre: "destacado" as const,
                etiqueta: "Destacado",
                ayuda: "Sale primero en la portada de tu tienda.",
              },
              {
                nombre: "aceptaVendedores" as const,
                etiqueta: "Lo pueden vender mis vendedores",
                ayuda:
                  "La comisión se calcula solo sobre los productos marcados.",
              },
            ] as const
          ).map((campo) => (
            <FormField
              key={campo.nombre}
              control={form.control}
              name={campo.nombre}
              render={({ field }) => (
                // El objetivo táctil es la fila entera y no el cuadrito de
                // 20 px: `FormLabel` apunta a la casilla, así que tocar el
                // texto la marca igual. Así se puede usar con el pulgar sin
                // agrandar una casilla que quedaría fuera del sistema.
                <FormItem className="flex items-start gap-3 space-y-0 py-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      className="mt-1 size-6 rounded-none border-tinta data-[state=checked]:border-senal data-[state=checked]:bg-senal"
                    />
                  </FormControl>
                  <FormLabel className="flex min-h-11 cursor-pointer flex-col items-start gap-1 font-normal">
                    <span className="text-sm font-semibold">
                      {campo.etiqueta}
                    </span>
                    <span className={AYUDA_CAMPO}>{campo.ayuda}</span>
                  </FormLabel>
                </FormItem>
              )}
            />
          ))}
        </Bloque>

        <div className="flex flex-wrap gap-3 border-t-2 border-tinta pt-6">
          <button type="submit" disabled={enCurso} className={BOTON_PRIMARIO}>
            {enCurso ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {producto ? "Guardar cambios" : "Crear producto"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/panel/productos")}
            className={BOTON_SECUNDARIO}
          >
            Cancelar
          </button>
        </div>
      </form>
    </Form>
  )
}
