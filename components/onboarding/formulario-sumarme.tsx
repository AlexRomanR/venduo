"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { inviteCodeFromInput, storeSlugFromInput } from "@/lib/format"
import { createClient } from "@/lib/supabase/client"
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

const schema = z.object({
  tienda: z.string().min(2, "Pega el enlace o escribe el nombre de la tienda."),
})

type Values = z.infer<typeof schema>

/**
 * Los mensajes que levanta `join_store` ya están en términos del usuario, pero
 * se traducen igual: si mañana cambia el texto de la función, la pantalla no
 * puede empezar a mostrar algo que no revisó nadie.
 */
function traducir(mensaje: string) {
  if (mensaje.includes("no existe o no está publicada")) {
    return "No encontramos esa tienda. Revisa el enlace con quien te lo pasó."
  }
  if (mensaje.includes("red de vendedores")) {
    return "Esa tienda todavía no abrió su red de vendedores."
  }
  if (mensaje.includes("tu propia tienda")) {
    return "Esa es tu propia tienda: ahí eres el dueño, no el vendedor."
  }
  return "No pudimos sumarte a esa tienda. Intenta de nuevo."
}

export function FormularioSumarme() {
  const router = useRouter()

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { tienda: "" },
  })

  async function onSubmit(values: Values) {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    const slug = storeSlugFromInput(values.tienda)
    if (!slug) {
      toast.error("No pudimos leer el enlace. Revisa que esté completo.")
      return
    }

    // Si el enlace traía invitación, se manda: es lo que decide si entra
    // activo o queda esperando aprobación.
    const invitacion = inviteCodeFromInput(values.tienda)

    const { error } = await supabase.rpc("join_store", {
      p_store_slug: slug,
      // El tipo generado espera `undefined` para omitir el parámetro; `null`
      // viajaría como valor y no como ausencia.
      p_invite_code: invitacion ?? undefined,
    })

    if (error) {
      toast.error(traducir(error.message))
      return
    }

    toast.success(
      invitacion
        ? "Listo, ya eres vendedor de esa tienda."
        : "Listo, ya estás en esa tienda."
    )
    router.push("/vendedor")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="tienda"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55 data-[error=true]:text-senal data-[error=true]:opacity-100">
                Enlace de la tienda
              </FormLabel>
              <FormControl>
                <Input
                  className="h-12 rounded-none border-0 border-b border-tinta bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:ring-0 aria-invalid:border-senal aria-invalid:ring-0 md:text-base"
                  placeholder="venduo.vercel.app/t/rosa-deportes"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-tinta/55">
                Sirve el enlace de la tienda o el de invitación. Con el de
                invitación entras al instante, aunque la tienda revise
                solicitudes.
              </FormDescription>
              <FormMessage className="text-sm text-senal" />
            </FormItem>
          )}
        />

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-senal px-5 font-semibold text-white transition-colors hover:bg-senal-alta disabled:opacity-60 sm:w-auto sm:self-start sm:px-8"
        >
          {form.formState.isSubmitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Sumarme a esta tienda
        </button>
      </form>
    </Form>
  )
}
