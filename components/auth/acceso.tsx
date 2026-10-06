"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
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

const MIN_PASSWORD = 8

type Modo = "ingresar" | "registrarse"

/** Lo que se lee al lado del registro: la promesa, y por qué creerla. */
const REGISTRO = {
  etiqueta: "Para quien ya vende",
  titular: "Tu tienda online, tu inventario y tus ventas.",
  entrada:
    "Tu tienda lista en un minuto, con el stock al día, los pedidos por WhatsApp y los catálogos. Lo manejas desde el celular, como ya manejas tus redes.",
  puntos: [
    {
      titulo: "Stock al día",
      detalle: "Cada venta descuenta sola, y te avisa lo que se está acabando.",
    },
    {
      titulo: "Pedidos por WhatsApp",
      detalle:
        "Tu cliente arma su carrito y te lo manda a tu WhatsApp, con el total y el número de pedido.",
    },
    {
      titulo: "Catálogos en PDF",
      detalle:
        "Con tus productos y tus colores, para mandar por WhatsApp con los precios del día.",
    },
  ],
  pie: "Abrir y publicar no cuesta nada. No pedimos tarjeta.",
}

const VUELTA = {
  etiqueta: "Entrar",
  titular: "Retoma donde lo dejaste.",
  entrada:
    "Tu tienda, tus pedidos y tus ventas siguen igual que la última vez.",
}

// Los dos esquemas declaran los mismos campos y solo cambian las reglas: si
// tuvieran formas distintas, el resolver no podría alternar entre ellos.
const baseSchema = z.object({
  fullName: z.string().max(80),
  email: z.email("Escribe un correo válido."),
  password: z.string(),
})

const signInSchema = baseSchema.extend({
  password: z.string().min(1, "Escribe tu contraseña."),
})

const signUpSchema = baseSchema.extend({
  fullName: z.string().min(2, "Escribe tu nombre.").max(80),
  password: z
    .string()
    .min(MIN_PASSWORD, `Mínimo ${MIN_PASSWORD} caracteres.`)
    .max(72, "Máximo 72 caracteres."),
})

type Values = z.infer<typeof baseSchema>

const ETIQUETA_CAMPO =
  "text-xs font-semibold tracking-[0.12em] uppercase opacity-55 data-[error=true]:text-senal data-[error=true]:opacity-100"

// Campo sin caja: una regla abajo que se pone roja al enfocar. El mundo
// editorial estructura con la línea, no con el recuadro.
const CAMPO =
  "h-12 rounded-none border-0 border-b border-tinta bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:ring-0 aria-invalid:border-senal aria-invalid:ring-0 md:text-base"

export function Acceso({
  next,
  configured,
  initialError,
  registro = false,
}: {
  next?: string
  configured: boolean
  initialError?: string
  /** Quien llega desde "Crear mi tienda" viene a registrarse, no a entrar. */
  registro?: boolean
}) {
  const [modo, setModo] = React.useState<Modo>(
    registro ? "registrarse" : "ingresar"
  )

  const esRegistro = modo === "registrarse"

  const form = useForm<Values>({
    resolver: zodResolver(esRegistro ? signUpSchema : signInSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  })

  React.useEffect(() => {
    if (initialError) toast.error(initialError)
  }, [initialError])

  // Los requisitos de contraseña cambian entre modos, así que los errores
  // pendientes dejan de aplicar al cambiar.
  function cambiarModo(siguiente: Modo) {
    setModo(siguiente)
    form.clearErrors()
  }

  async function onSubmit(values: Values) {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    if (esRegistro) {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        // El disparador de la base lee el nombre para crear el perfil.
        options: { data: { full_name: values.fullName } },
      })

      if (error) {
        toast.error(
          error.message.includes("already registered")
            ? "Ese correo ya tiene cuenta. Prueba ingresando."
            : error.message
        )
        return
      }

      toast.success("Cuenta creada.")
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        toast.error(
          error.message.includes("Invalid login credentials")
            ? "Correo o contraseña incorrectos."
            : error.message
        )
        return
      }
    }

    // El destino lo resuelve el servidor, que es el único que sabe si esta
    // cuenta ya terminó de crear su tienda. Antes se empujaba a `/panel` y esa
    // pantalla rebotaba: se veía el panel un instante antes de salir de él.
    //
    // Navegación completa y no `router.push`: el destino es un route handler
    // que responde con una redirección, no una pantalla.
    window.location.assign(
      next ? `/auth/destino?next=${encodeURIComponent(next)}` : "/auth/destino"
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_0.95fr] lg:grid-rows-[auto_1fr] lg:gap-y-0 lg:py-20">
      <div className="lg:col-start-1 lg:row-start-1 lg:pr-14">
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          {esRegistro ? REGISTRO.etiqueta : VUELTA.etiqueta}
        </p>
        <h1 className="mt-5 max-w-[13ch] font-titular text-[clamp(2.25rem,7vw,3.75rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
          {esRegistro ? REGISTRO.titular : VUELTA.titular}
        </h1>
        <p className="mt-5 max-w-[46ch] leading-relaxed opacity-70">
          {esRegistro ? REGISTRO.entrada : VUELTA.entrada}
        </p>
      </div>

      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-l lg:border-tinta/15 lg:pl-14">
        {!configured ? (
          <p className="mb-8 border border-tinta p-4 text-sm leading-relaxed">
            Supabase todavía no está configurado, así que el ingreso no va a
            funcionar. Completa <code className="font-mono">.env.local</code> y
            reinicia el servidor.
          </p>
        ) : null}

        {/* La regla de 2 px corona el tema abierto: es el mismo trazo de apertura. */}
        <div className="grid grid-cols-2">
          {(["registrarse", "ingresar"] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambiarModo(valor)}
              aria-pressed={modo === valor}
              className={cn(
                "min-h-11 border-t-2 pt-3 text-left font-titular text-sm font-bold tracking-[-0.01em] transition-colors",
                modo === valor
                  ? "border-tinta"
                  : "border-tinta/15 opacity-50 hover:opacity-100"
              )}
            >
              {valor === "registrarse" ? "Cuenta nueva" : "Ya tengo cuenta"}
            </button>
          ))}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-8 flex flex-col gap-7"
          >
            {esRegistro ? (
              <>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={ETIQUETA_CAMPO}>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          className={CAMPO}
                          placeholder="Tu nombre"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-sm text-senal" />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>Correo</FormLabel>
                  <FormControl>
                    <Input
                      className={CAMPO}
                      type="email"
                      placeholder="tu@ejemplo.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-sm text-senal" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className={ETIQUETA_CAMPO}>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      className={CAMPO}
                      type="password"
                      autoComplete={
                        esRegistro ? "new-password" : "current-password"
                      }
                      {...field}
                    />
                  </FormControl>
                  {/* La pista y el error dicen lo mismo: el error la reemplaza. */}
                  {esRegistro && !fieldState.error ? (
                    <FormDescription className="text-xs text-tinta/55">
                      Mínimo {MIN_PASSWORD} caracteres.
                    </FormDescription>
                  ) : null}
                  <FormMessage className="text-sm text-senal" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-senal px-5 font-semibold text-white transition-colors hover:bg-senal-alta disabled:opacity-60"
            >
              {form.formState.isSubmitting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {esRegistro ? "Crear cuenta" : "Ingresar"}
            </button>
          </form>
        </Form>
      </div>

      {/* En el ingreso no hay nada que vender: quien vuelve ya conoce esto. */}
      {esRegistro ? (
        <div className="lg:col-start-1 lg:row-start-2 lg:self-start lg:pt-14 lg:pr-14">
          <ul>
            {REGISTRO.puntos.map((punto) => (
              <li key={punto.titulo} className="border-t border-tinta/15 py-5">
                <h2 className="font-titular text-base font-bold tracking-[-0.02em]">
                  {punto.titulo}
                </h2>
                <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed opacity-70">
                  {punto.detalle}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-tinta/15 pt-5 text-sm opacity-55">
            {REGISTRO.pie}
          </p>
        </div>
      ) : null}
    </div>
  )
}
