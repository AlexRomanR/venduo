"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { PLANTILLA_POR_DEFECTO } from "@/lib/plantillas"
import { createClient } from "@/lib/supabase/client"
import {
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

/**
 * El alta del negocio.
 *
 * Ya no se elige plantilla: el canal es el Marketplace y todos los catálogos
 * se ven igual. `create_store` sigue pidiendo una clave porque siembra la
 * página del negocio, así que recibe la base editorial y nadie la ve como una
 * decisión.
 */
export function FormularioNegocio({
  plantilla = PLANTILLA_POR_DEFECTO,
}: {
  plantilla?: string
}) {
  const router = useRouter()

  const form = useForm<CrearTiendaInput>({
    resolver: zodResolver(crearTiendaSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      // Siempre encendido: en el modelo vigente cualquier promotor puede tomar
      // un producto del catálogo, y el porcentaje lo decide la tabla de tramos.
      aceptaVendedores: true,
      comisionBps: 1000,
    },
  })

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
    router.push("/panel")
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
                  placeholder="Panadería Doña Elsa"
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
                  placeholder="Hago cuñapés, empanadas y masitas por encargo en La Paz. Vendo por WhatsApp a oficinas y para eventos."
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-tinta/55">
                Escríbelo como se lo contarías a un cliente: es lo que van a
                leer los promotores para decidir si te promocionan.
              </FormDescription>
              <FormMessage className="text-sm text-senal" />
            </FormItem>
          )}
        />

        {/* Ni interruptor de vendedores ni porcentaje: en el modelo vigente
            cualquier promotor puede tomar un producto del catálogo, y la
            comisión la decide la tabla de tramos según el precio. Lo que antes
            era una decisión del alta hoy es una regla del sistema. */}
        <div className="border-l-2 border-senal pl-5">
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Cómo se venden tus productos
          </p>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed opacity-75">
            Al cargar cada producto dices cuánto quieres recibir por él.
            Nosotros le sumamos la comisión de quien lo venda y nuestra parte, y
            así queda el precio publicado. Si nadie lo promocionó, esa comisión
            también es tuya.
          </p>
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
