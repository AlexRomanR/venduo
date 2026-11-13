"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  BOTON_PRIMARIO,
  CAMPO,
  CAMPO_LINEA,
  ERROR_CAMPO,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { cn } from "@/lib/utils"
import {
  crearTiendaSchema,
  soloCifras,
  type CrearTiendaInput,
} from "@/lib/validation/tienda"
import { guardarNegocio } from "@/app/crear/acciones"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/**
 * Si alguien pega el número con el código del país, el 591 sale: ya está
 * escrito delante del campo.
 */
function sinCodigoDePais(valor: string) {
  const cifras = soloCifras(valor)
  return cifras.startsWith("591") && cifras.length > 8
    ? valor.replace(/^\s*\+?\s*591[\s-]*/, "")
    : valor
}

/**
 * Paso 1 del alta: lo mínimo para que la tienda exista —cómo se llama, qué
 * vende y a qué WhatsApp le llegan los pedidos—, escrito ahí mismo. Todavía no
 * crea nada: lo guarda en el borrador del alta y sigue a la plantilla, que ya
 * se ve con este nombre.
 */
export function FormularioNegocio({
  inicial,
}: {
  /** Lo que ya había escrito, si vuelve del paso 2 o recargó. */
  inicial: CrearTiendaInput | null
}) {
  const router = useRouter()

  const form = useForm<CrearTiendaInput>({
    resolver: zodResolver(crearTiendaSchema),
    defaultValues: inicial ?? { nombre: "", descripcion: "", whatsapp: "" },
  })

  async function onSubmit(values: CrearTiendaInput) {
    const resultado = await guardarNegocio(values)
    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos guardar tus datos.")
      return
    }
    router.push("/crear/plantilla")
  }

  const enviando =
    form.formState.isSubmitting || form.formState.isSubmitSuccessful

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="pieza-tarjeta flex flex-col gap-6 border border-tinta px-4 py-5 sm:px-6 sm:py-6"
      >
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>
                Nombre de tu negocio
              </FormLabel>
              <FormControl>
                <Input
                  className={cn(
                    CAMPO_LINEA,
                    "font-titular text-xl font-bold tracking-[-0.02em] md:text-xl"
                  )}
                  placeholder="Ej.: Luna Accesorios"
                  autoComplete="organization"
                  {...field}
                />
              </FormControl>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>Qué vendes</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  className={cn(
                    CAMPO,
                    "field-sizing-content min-h-24 resize-none py-3"
                  )}
                  placeholder="Ej.: Aretes, collares y carteras. Envío a todo Santa Cruz."
                  {...field}
                />
              </FormControl>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>
                WhatsApp para tus pedidos
              </FormLabel>
              <div className="flex items-stretch">
                <span
                  aria-hidden="true"
                  className="flex h-12 items-center border-b border-tinta pr-3 text-base text-tinta/65 tabular-nums"
                >
                  +591
                </span>
                <FormControl>
                  <Input
                    className={cn(CAMPO_LINEA, "flex-1 pl-1 tabular-nums")}
                    type="tel"
                    inputMode="tel"
                    placeholder="700 12345"
                    autoComplete="tel-national"
                    aria-description="Con el código de Bolivia, +591, ya puesto."
                    {...field}
                    onChange={(evento) =>
                      field.onChange(sinCodigoDePais(evento.target.value))
                    }
                  />
                </FormControl>
              </div>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <button
          type="submit"
          disabled={enviando}
          className={cn(BOTON_PRIMARIO, "w-full")}
        >
          {enviando ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Elegir mi plantilla
          {enviando ? null : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
        </button>
      </form>
    </Form>
  )
}
