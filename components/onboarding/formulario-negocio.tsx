"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { formatMoney, formatPercent } from "@/lib/format"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  COMISION_MAXIMA_BPS,
  COMISIONES,
  crearTiendaSchema,
  type CrearTiendaInput,
} from "@/lib/validation/tienda"
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
import { Textarea } from "@/components/ui/textarea"

const ETIQUETA_CAMPO =
  "text-xs font-semibold tracking-[0.12em] uppercase opacity-55 data-[error=true]:text-senal data-[error=true]:opacity-100"

const CAMPO =
  "rounded-none border-0 border-b border-tinta bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:ring-0 aria-invalid:border-senal aria-invalid:ring-0 md:text-base"

/** Venta típica con la que se ilustra la comisión, en centavos. */
const EJEMPLO_VENTA_CENTS = 20_000

export function FormularioNegocio({ plantilla }: { plantilla: string }) {
  const router = useRouter()

  const form = useForm<CrearTiendaInput>({
    resolver: zodResolver(crearTiendaSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      // Encendido por defecto: la red de vendedores es la promesa que
      // distingue a Venduo, y una tienda que nace sin ella la descubre tarde.
      aceptaVendedores: true,
      comisionBps: 1000,
    },
  })

  const aceptaVendedores = form.watch("aceptaVendedores")
  const comisionBps = form.watch("comisionBps")
  const [personalizada, setPersonalizada] = React.useState(false)

  async function onSubmit(values: CrearTiendaInput) {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    // La tienda no se inserta desde el cliente: `create_store` resuelve el
    // slug único, crea la suscripción de prueba y siembra la plantilla en una
    // sola transacción.
    const { error } = await supabase.rpc("create_store", {
      p_name: values.nombre,
      p_description: values.descripcion,
      p_template_key: plantilla,
      p_sellers: values.aceptaVendedores,
      p_commission_bps: values.comisionBps,
    })

    if (error) {
      toast.error(
        error.message.includes("Ya tienes una tienda")
          ? "Ya tienes una tienda creada."
          : "No pudimos crear tu tienda. Intenta de nuevo."
      )
      return
    }

    toast.success("Tu tienda está creada.")
    // El último paso del alta ofrece el editor, sin obligar: quien tiene
    // apuro puede ir directo a cargar productos.
    router.push("/crear/listo")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-7"
      >
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>
                ¿Cómo se llama tu negocio?
              </FormLabel>
              <FormControl>
                <Input
                  className={`h-12 ${CAMPO}`}
                  placeholder="Rosa Deportes"
                  autoComplete="organization"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-tinta/55">
                Es el nombre que van a ver tus clientes, y del que sale el
                enlace de tu tienda.
              </FormDescription>
              <FormMessage className="text-sm text-senal" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>
                ¿Qué vendes y a quién?
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  className={`min-h-32 resize-y py-3 ${CAMPO}`}
                  placeholder="Vendo ropa deportiva por TikTok e Instagram: buzos, poleras y zapatillas. Hago envíos en Santa Cruz y coordino por WhatsApp."
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-tinta/55">
                Escríbelo como se lo contarías a un cliente. Con esto la IA
                escribe los textos de tu portada.
              </FormDescription>
              <FormMessage className="text-sm text-senal" />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel className={ETIQUETA_CAMPO}>
            ¿Quieres que otros vendan tus productos?
          </FormLabel>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                valor: true,
                titulo: "Sí, activar vendedores",
                detalle: "Ganan comisión por cada venta que traen",
              },
              {
                valor: false,
                titulo: "Por ahora no",
                detalle: "Lo puedes activar después",
              },
            ].map((opcion) => {
              const elegida = aceptaVendedores === opcion.valor

              return (
                <button
                  key={String(opcion.valor)}
                  type="button"
                  onClick={() =>
                    form.setValue("aceptaVendedores", opcion.valor)
                  }
                  aria-pressed={elegida}
                  className={cn(
                    "flex min-h-11 flex-col gap-1.5 border p-4 text-left transition-colors duration-200",
                    elegida
                      ? "border-tinta bg-tinta text-papel"
                      : "border-tinta/15 hover:border-tinta"
                  )}
                >
                  <span className="font-titular text-sm leading-tight font-bold tracking-[-0.01em]">
                    {opcion.titulo}
                  </span>
                  <span
                    className={cn(
                      "text-xs leading-tight",
                      elegida ? "text-papel/70" : "opacity-55"
                    )}
                  >
                    {opcion.detalle}
                  </span>
                </button>
              )
            })}
          </div>
        </FormItem>

        {/* La comisión solo tiene sentido si hay vendedores. Se revela en vez
            de deshabilitarse: un campo apagado ocupa lugar sin decir nada. */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            aceptaVendedores
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>
                ¿Cuánto les pagas por venta?
              </FormLabel>
              <div className="flex flex-wrap gap-2">
                {COMISIONES.map((bps) => (
                  <button
                    key={bps}
                    type="button"
                    onClick={() => {
                      setPersonalizada(false)
                      form.setValue("comisionBps", bps)
                    }}
                    aria-pressed={!personalizada && comisionBps === bps}
                    className={cn(
                      "tabular flex min-h-11 items-center border px-5 font-titular font-bold transition-colors duration-200",
                      !personalizada && comisionBps === bps
                        ? "border-senal bg-senal text-white"
                        : "border-tinta/15 hover:border-tinta"
                    )}
                  >
                    {formatPercent(bps)}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPersonalizada(true)}
                  aria-pressed={personalizada}
                  className={cn(
                    "flex min-h-11 items-center border px-5 font-titular font-bold transition-colors duration-200",
                    personalizada
                      ? "border-senal bg-senal text-white"
                      : "border-tinta/15 hover:border-tinta"
                  )}
                >
                  Otro
                </button>
              </div>

              {personalizada ? (
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={COMISION_MAXIMA_BPS / 100}
                    step={0.5}
                    autoFocus
                    aria-label="Porcentaje de comisión"
                    value={comisionBps / 100}
                    onChange={(e) => {
                      const pct = Number.parseFloat(e.target.value)
                      if (Number.isNaN(pct))
                        return form.setValue("comisionBps", 0)
                      // A puntos básicos enteros: el sistema nunca guarda
                      // porcentajes en punto flotante.
                      form.setValue(
                        "comisionBps",
                        Math.min(
                          Math.max(Math.round(pct * 100), 0),
                          COMISION_MAXIMA_BPS
                        )
                      )
                    }}
                    className="tabular h-12 w-28 rounded-none border-0 border-b border-tinta bg-transparent px-0 font-titular text-2xl font-bold outline-none focus:border-senal"
                  />
                  <span className="font-titular text-2xl font-bold opacity-40">
                    %
                  </span>
                </div>
              ) : null}

              <FormDescription className="text-xs text-tinta/55">
                En una venta de {formatMoney(EJEMPLO_VENTA_CENTS)} el vendedor
                se lleva{" "}
                <span className="tabular font-semibold text-tinta">
                  {formatMoney((EJEMPLO_VENTA_CENTS * comisionBps) / 10000)}
                </span>
                . Se descuenta de cada venta que traiga y va íntegra para él:
                Venduo no cobra comisión. Puedes cambiarlo después, pero no
                afecta a las ventas ya hechas.
              </FormDescription>
            </FormItem>
          </div>
        </div>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-senal px-5 font-semibold text-white transition-colors hover:bg-senal-alta disabled:opacity-60 sm:w-auto sm:self-start sm:px-8"
        >
          {form.formState.isSubmitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Crear mi tienda
        </button>
      </form>
    </Form>
  )
}
