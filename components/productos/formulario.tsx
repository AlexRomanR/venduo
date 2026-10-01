"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Banknote,
  Boxes,
  Eye,
  FileText,
  Images,
  Loader2,
  Tag,
  type LucideIcon,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO_LINEA,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { CURRENCY_SYMBOL } from "@/lib/format"
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
import { Seccion } from "@/components/panel/piezas"
import { Fotos } from "@/components/productos/fotos"

/** Centavos a bolivianos, para que el campo muestre lo que la persona escribió. */
function aMonto(centavos: number | null) {
  return centavos === null ? null : centavos / 100
}

/** Un bloque del formulario, en su panel como toda pantalla del panel. */
function Bloque({
  id,
  icono,
  titulo,
  detalle,
  children,
}: {
  id: string
  icono: LucideIcon
  titulo: string
  detalle?: string
  children: React.ReactNode
}) {
  return (
    <Seccion id={id} icono={icono} titulo={titulo} bajada={detalle} relleno>
      <div className="grid gap-6">{children}</div>
    </Seccion>
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
  producto,
  guardar,
}: {
  tiendaId: string
  categorias: ProductCategory[]
  producto?: Product
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
      precio: producto ? producto.price_cents / 100 : undefined,
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
  const enCurso = form.formState.isSubmitting

  async function alEnviar(valores: ProductoInput) {
    const resultado = await guardar(valores, producto?.id)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos guardar el producto.")
      return
    }

    toast.success(producto ? "Producto actualizado." : "Producto creado.")
    router.push("/panel/productos")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(alEnviar)}
        className="flex flex-col gap-6 md:gap-8"
      >
        <Bloque
          id="basico"
          icono={FileText}
          titulo="Qué es"
          detalle="El nombre y lo que lee quien está por comprar."
        >
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

          <div className="grid items-start gap-6 sm:grid-cols-2">
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
          id="fotos"
          icono={Images}
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
          id="precio"
          icono={Banknote}
          titulo="Cuánto cuesta"
          detalle="Con un precio anterior, tu tienda muestra el descuento."
        >
          <div className="grid items-start gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="precio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>
                    Precio en {CURRENCY_SYMBOL}
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
                    Opcional. Si lo pones, tu tienda muestra el descuento.
                  </FormDescription>
                  <FormMessage className="text-senal" />
                </FormItem>
              )}
            />
          </div>
        </Bloque>

        <Bloque
          id="stock"
          icono={Boxes}
          titulo="Cuántas tienes"
          detalle="Las unidades que puedes vender ahora mismo."
        >
          <div className="grid items-start gap-6 sm:grid-cols-2">
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

        <Bloque
          id="condicion"
          icono={Tag}
          titulo="En qué estado está"
          detalle="Nuevo, de segunda mano o reacondicionado."
        >
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

        <Bloque
          id="donde"
          icono={Eye}
          titulo="Dónde se ve"
          detalle="En tu tienda, en su portada y en tu red de vendedores."
        >
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

        <div className="flex flex-wrap gap-3">
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
