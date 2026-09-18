"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import type { Cuenta } from "@/lib/data/cuenta"
import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  CAMPO,
  CAMPO_LINEA,
  ERROR_CAMPO,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  perfilSchema,
  tiendaSchema,
  vendedorSchema,
  type PerfilInput,
  type TiendaInput,
  type VendedorInput,
} from "@/lib/validation/cuenta"
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

function Guardar({ enCurso }: { enCurso: boolean }) {
  return (
    <button
      type="submit"
      disabled={enCurso}
      className={cn(BOTON_PRIMARIO, "sm:w-auto sm:self-start sm:px-8")}
    >
      {enCurso ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : null}
      Guardar cambios
    </button>
  )
}

/** Par de celdas para una decisión de dos opciones, en vez de un interruptor. */
function Par<T extends string | boolean>({
  valor,
  onChange,
  opciones,
}: {
  valor: T
  onChange: (v: T) => void
  opciones: Array<{ valor: T; titulo: string; detalle: string }>
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {opciones.map((opcion) => {
        const elegida = valor === opcion.valor

        return (
          <button
            key={String(opcion.valor)}
            type="button"
            onClick={() => onChange(opcion.valor)}
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
  )
}

export function FormPersona({ cuenta }: { cuenta: Cuenta }) {
  const router = useRouter()

  const form = useForm<PerfilInput>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: cuenta.perfil.fullName ?? "" },
  })

  async function onSubmit(values: PerfilInput) {
    const supabase = createClient()
    if (!supabase) return toast.error("Falta configurar Supabase en .env.local")

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.nombre,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cuenta.userId)

    if (error) return toast.error("No pudimos guardar tu nombre.")

    toast.success("Listo, guardado.")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>Tu nombre</FormLabel>
              <FormControl>
                <Input className={CAMPO_LINEA} autoComplete="name" {...field} />
              </FormControl>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <div>
          <p className={ETIQUETA_CAMPO}>Correo</p>
          <p className="mt-2 border-b border-tinta/15 pb-3 text-base opacity-55">
            {cuenta.email ?? "—"}
          </p>
          <p className={cn(AYUDA_CAMPO, "mt-2")}>
            El correo es con lo que ingresas y todavía no se puede cambiar desde
            aquí.
          </p>
        </div>

        <Guardar enCurso={form.formState.isSubmitting} />
      </form>
    </Form>
  )
}

export function FormTienda({ cuenta }: { cuenta: Cuenta }) {
  const router = useRouter()
  const tienda = cuenta.tienda!

  const form = useForm<TiendaInput>({
    resolver: zodResolver(tiendaSchema),
    defaultValues: {
      nombre: tienda.name,
      tagline: tienda.tagline ?? "",
      descripcion: tienda.description ?? "",
      publicada: tienda.isPublished,
      aceptaVendedores: tienda.sellerNetworkEnabled,
      comisionBps: tienda.commissionBps,
      modoAlta:
        tienda.sellerJoinMode === "con_aprobacion"
          ? "con_aprobacion"
          : "abierta",
    },
  })

  const publicada = form.watch("publicada")

  async function onSubmit(values: TiendaInput) {
    const supabase = createClient()
    if (!supabase) return toast.error("Falta configurar Supabase en .env.local")

    const { error } = await supabase
      .from("stores")
      .update({
        name: values.nombre,
        tagline: values.tagline || null,
        description: values.descripcion || null,
        is_published: values.publicada,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tienda.id)

    if (error) return toast.error("No pudimos guardar los cambios.")

    toast.success("Tu tienda está al día.")
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
                Nombre del negocio
              </FormLabel>
              <FormControl>
                <Input className={CAMPO_LINEA} {...field} />
              </FormControl>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <div>
          <p className={ETIQUETA_CAMPO}>Enlace de tu tienda</p>
          <p className="mt-2 border-b border-tinta/15 pb-3 font-mono text-sm break-all opacity-55">
            /t/{tienda.slug}
          </p>
          <p className={cn(AYUDA_CAMPO, "mt-2")}>
            No se puede cambiar: este enlace ya está impreso en tu código QR y
            en lo que compartiste.
          </p>
        </div>

        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>Frase corta</FormLabel>
              <FormControl>
                <Input
                  className={CAMPO_LINEA}
                  placeholder="Ropa deportiva en Santa Cruz"
                  {...field}
                />
              </FormControl>
              <FormDescription className={AYUDA_CAMPO}>
                Es lo que se lee debajo del nombre y en la lista de tiendas.
              </FormDescription>
              <FormMessage className={ERROR_CAMPO} />
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
                  rows={4}
                  className={cn("min-h-28 resize-y py-3", CAMPO)}
                  {...field}
                />
              </FormControl>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel className={ETIQUETA_CAMPO}>Estado de la tienda</FormLabel>
          <Par
            valor={publicada}
            onChange={(v) => form.setValue("publicada", v)}
            opciones={[
              {
                valor: true,
                titulo: "Publicada",
                detalle: "Cualquiera puede verla y comprarte",
              },
              {
                valor: false,
                titulo: "En borrador",
                detalle: "Solo la ves tú",
              },
            ]}
          />
        </FormItem>

        <p className="border-t border-tinta/15 pt-5 text-sm leading-relaxed opacity-70">
          Tus productos publicados ya están abiertos a todos los promotores, y
          su comisión la calcula Venduo según el precio de cada uno. No hay nada
          que configurar ni que aprobar.
        </p>

        <Guardar enCurso={form.formState.isSubmitting} />
      </form>
    </Form>
  )
}

export function FormVendedor({ cuenta }: { cuenta: Cuenta }) {
  const router = useRouter()
  const vendedor = cuenta.vendedor!

  const form = useForm<VendedorInput>({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      nombre: vendedor.displayName,
      ciudad: vendedor.city ?? "",
      bio: vendedor.bio ?? "",
      telefono: vendedor.phone ?? "",
    },
  })

  async function onSubmit(values: VendedorInput) {
    const supabase = createClient()
    if (!supabase) return toast.error("Falta configurar Supabase en .env.local")

    const { error } = await supabase
      .from("seller_profiles")
      .update({
        display_name: values.nombre,
        city: values.ciudad || null,
        bio: values.bio || null,
        phone: values.telefono || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", cuenta.userId)

    if (error) return toast.error("No pudimos guardar tu perfil.")

    toast.success("Tu perfil está al día.")
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
                Cómo quieres que te vean
              </FormLabel>
              <FormControl>
                <Input className={CAMPO_LINEA} {...field} />
              </FormControl>
              <FormDescription className={AYUDA_CAMPO}>
                Es el nombre que aparece en tu historial laboral público.
              </FormDescription>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <div>
          <p className={ETIQUETA_CAMPO}>Tu enlace público</p>
          <p className="mt-2 border-b border-tinta/15 pb-3 font-mono text-sm break-all opacity-55">
            /v/{vendedor.slug}
          </p>
          <p className={cn(AYUDA_CAMPO, "mt-2")}>
            No cambia nunca: es la dirección estable que adjuntas a una
            postulación, y tiene que seguir abriendo dentro de dos años.
          </p>
        </div>

        <FormField
          control={form.control}
          name="ciudad"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>Ciudad</FormLabel>
              <FormControl>
                <Input
                  className={CAMPO_LINEA}
                  placeholder="El Alto"
                  {...field}
                />
              </FormControl>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>WhatsApp</FormLabel>
              <FormControl>
                <Input
                  className={CAMPO_LINEA}
                  type="tel"
                  placeholder="700 12345"
                  autoComplete="tel"
                  {...field}
                />
              </FormControl>
              <FormDescription className={AYUDA_CAMPO}>
                Lo usan las tiendas para coordinar contigo. No se muestra en tu
                perfil público.
              </FormDescription>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={ETIQUETA_CAMPO}>Sobre ti</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  className={cn("min-h-28 resize-y py-3", CAMPO)}
                  placeholder="Vendo por WhatsApp y en ferias los fines de semana."
                  {...field}
                />
              </FormControl>
              <FormDescription className={AYUDA_CAMPO}>
                Dos líneas alcanzan. Se lee en tu perfil público, encima de tus
                ventas.
              </FormDescription>
              <FormMessage className={ERROR_CAMPO} />
            </FormItem>
          )}
        />

        <Guardar enCurso={form.formState.isSubmitting} />
      </form>
    </Form>
  )
}
