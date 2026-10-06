"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import {
  crearTiendaSchema,
  soloCifras,
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

export function FormularioNegocio({ plantilla }: { plantilla: string }) {
  const router = useRouter()

  const form = useForm<CrearTiendaInput>({
    resolver: zodResolver(crearTiendaSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      whatsapp: "",
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
      p_whatsapp: soloCifras(values.whatsapp),
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
                  placeholder="Vendo ropa deportiva por TikTok e Instagram: buzos, poleras y zapatillas. Atiendo en Santa Cruz y coordino todo por WhatsApp."
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

        <FormField
          control={form.control}
          name="whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>
                ¿A qué WhatsApp te escriben?
              </FormLabel>
              <FormControl>
                <Input
                  className={`h-12 ${CAMPO}`}
                  type="tel"
                  inputMode="tel"
                  placeholder="700 12345"
                  autoComplete="tel"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-tinta/55">
                Cada pedido de tu tienda te llega a este número, con la lista de
                productos y el total. Lo puedes cambiar después.
              </FormDescription>
              <FormMessage className="text-sm text-senal" />
            </FormItem>
          )}
        />

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
