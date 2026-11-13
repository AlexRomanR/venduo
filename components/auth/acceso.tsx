"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO_LINEA,
  ERROR_CAMPO,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { CORREO_DE_CONTACTO } from "@/lib/legal"
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

/**
 * El titular de cada modo, con su frase en el resaltador, y una línea. Sin
 * párrafos ni lista de virtudes: quien llega acá ya decidió.
 */
const REGISTRO = {
  antes: "Abre ",
  resaltado: "tu tienda",
  bajada: "Con tu stock y tus pedidos por WhatsApp. Sin tarjeta.",
}

const VUELTA = {
  antes: "Entra a tu ",
  resaltado: "tienda",
  bajada: "Tus pedidos y tus ventas, como los dejaste.",
}

// Los dos esquemas declaran los mismos campos y solo cambian las reglas: si
// tuvieran formas distintas, el resolver no podría alternar entre ellos.
const baseSchema = z.object({
  fullName: z.string().max(80),
  email: z.email("Escribe un correo válido."),
  password: z.string(),
  invitacion: z.string().max(20),
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

/** Con el registro por invitación, el código es obligatorio. */
const signUpConInvitacionSchema = signUpSchema.extend({
  invitacion: z
    .string()
    .trim()
    .min(4, "Escribe el código de tu invitación.")
    .max(20),
})

export type EstadoDelRegistro = "abierto" | "cerrado" | "invitacion"

type Values = z.infer<typeof baseSchema>

export function Acceso({
  next,
  configured,
  initialError,
  registro = false,
  estadoDelRegistro = "abierto",
}: {
  next?: string
  configured: boolean
  initialError?: string
  /** Quien llega desde "Crear mi tienda" viene a registrarse, no a entrar. */
  registro?: boolean
  /** Lo decide Venduo desde la administración; la base lo hace cumplir. */
  estadoDelRegistro?: EstadoDelRegistro
}) {
  const [modo, setModo] = React.useState<Modo>(
    registro ? "registrarse" : "ingresar"
  )
  const [verClave, setVerClave] = React.useState(false)

  const esRegistro = modo === "registrarse"
  const conInvitacion = estadoDelRegistro === "invitacion"
  const cerrado = estadoDelRegistro === "cerrado"

  const form = useForm<Values>({
    resolver: zodResolver(
      esRegistro
        ? conInvitacion
          ? signUpConInvitacionSchema
          : signUpSchema
        : signInSchema
    ),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      invitacion: "",
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
        // El disparador de la base lee el nombre para crear el perfil, y el
        // código para dejar pasar a quien tiene invitación.
        options: {
          data: {
            full_name: values.fullName,
            ...(conInvitacion
              ? { invitacion: values.invitacion.trim().toUpperCase() }
              : {}),
          },
        },
      })

      if (error) {
        // Ese correo ya tiene cuenta: se pasa a ingresar, con el correo puesto.
        if (error.message.includes("already registered")) {
          toast.error("Ese correo ya tiene cuenta. Ingresa con él.")
          cambiarModo("ingresar")
          form.setValue("password", "")
          return
        }
        // Lo que rechaza el disparador llega como un error genérico de la
        // base: el estado del registro dice qué fue.
        toast.error(
          error.message.includes("Database error")
            ? conInvitacion
              ? "Ese código de invitación no sirve: puede que ya se haya usado o que haya vencido."
              : "No pudimos crear tu cuenta. Puede que el registro esté cerrado por ahora."
            : "No pudimos crear tu cuenta. Inténtalo de nuevo."
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
            : // Una cuenta dada de baja queda bloqueada en Auth.
              error.code === "user_banned" || /banned/i.test(error.message)
              ? `Esta cuenta fue dada de baja. Si crees que es un error, escríbenos a ${CORREO_DE_CONTACTO}.`
              : "No pudimos iniciar tu sesión. Inténtalo de nuevo en un rato."
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

  const titulo = esRegistro ? REGISTRO : VUELTA

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-4 pb-12 sm:px-5 lg:grid-cols-[1fr_28rem] lg:items-center lg:gap-16 lg:py-16">
      <div key={modo} className="cambio-entra">
        <h1 className="pieza-titular font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
          {titulo.antes}
          <span className="pieza-resaltado">{titulo.resaltado}</span>.
        </h1>
        <p className="mt-3 max-w-[40ch] text-sm leading-relaxed opacity-70 sm:text-base">
          {titulo.bajada}
        </p>
      </div>

      <div className="pieza-tarjeta flex flex-col gap-6 border border-tinta px-4 py-5 sm:px-6 sm:py-6">
        {!configured ? (
          <p className="rounded-[14px] border border-tinta/15 bg-papel p-3 text-sm leading-relaxed">
            Modo demo: falta configurar Supabase en{" "}
            <code className="font-mono">.env.local</code>, y el ingreso no va a
            funcionar.
          </p>
        ) : null}

        {/* Las dos pestañas en una píldora: la elegida, en tinta llena. */}
        <div
          role="group"
          aria-label="Cuenta"
          className="relative grid grid-cols-2 rounded-full border border-tinta/15 bg-papel p-1"
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-tinta transition-transform duration-[250ms] ease-out motion-reduce:transition-none",
              esRegistro ? "translate-x-0" : "translate-x-full"
            )}
          />
          {(["registrarse", "ingresar"] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambiarModo(valor)}
              aria-pressed={modo === valor}
              disabled={form.formState.isSubmitting}
              className={cn(
                "relative z-10 min-h-11 rounded-full px-2 text-sm font-semibold transition-colors",
                modo === valor ? "text-papel" : "text-tinta/70 hover:text-tinta"
              )}
            >
              {valor === "registrarse" ? "Cuenta nueva" : "Ya tengo cuenta"}
            </button>
          ))}
        </div>

        {esRegistro && cerrado ? (
          <div className="flex flex-col gap-4">
            <p>
              <span className="block font-semibold">
                Por ahora no abrimos cuentas nuevas.
              </span>
              <span className="mt-1 block text-sm opacity-70">
                Si ya tienes una, ingresa con tu correo.
              </span>
            </p>
            <button
              type="button"
              onClick={() => cambiarModo("ingresar")}
              className={cn(BOTON_SECUNDARIO, "w-full")}
            >
              Ya tengo cuenta
            </button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              {esRegistro ? (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="cambio-entra">
                      <FormLabel className={ETIQUETA_CAMPO}>
                        Tu nombre
                      </FormLabel>
                      <FormControl>
                        <Input
                          className={CAMPO_LINEA}
                          placeholder="Cómo te llamas"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className={ERROR_CAMPO} />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={ETIQUETA_CAMPO}>Correo</FormLabel>
                    <FormControl>
                      <Input
                        className={CAMPO_LINEA}
                        type="email"
                        placeholder="tu@ejemplo.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className={ERROR_CAMPO} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className={ETIQUETA_CAMPO}>Contraseña</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          className={cn(CAMPO_LINEA, "pr-12")}
                          type={verClave ? "text" : "password"}
                          autoComplete={
                            esRegistro ? "new-password" : "current-password"
                          }
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setVerClave((antes) => !antes)}
                        aria-pressed={verClave}
                        aria-label={
                          verClave ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                        className="absolute top-0 right-0 flex size-12 items-center justify-center text-tinta/65 transition-colors hover:text-tinta"
                      >
                        {verClave ? (
                          <EyeOff aria-hidden="true" className="size-5" />
                        ) : (
                          <Eye aria-hidden="true" className="size-5" />
                        )}
                      </button>
                    </div>
                    {/* La pista y el error dicen lo mismo: el error la reemplaza. */}
                    {esRegistro && !fieldState.error ? (
                      <FormDescription className={AYUDA_CAMPO}>
                        Mínimo {MIN_PASSWORD} caracteres.
                      </FormDescription>
                    ) : null}
                    <FormMessage className={ERROR_CAMPO} />
                  </FormItem>
                )}
              />

              {esRegistro && conInvitacion ? (
                <FormField
                  control={form.control}
                  name="invitacion"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className={ETIQUETA_CAMPO}>
                        Código de invitación
                      </FormLabel>
                      <FormControl>
                        <Input
                          className={cn(
                            CAMPO_LINEA,
                            "font-mono tracking-wider uppercase"
                          )}
                          placeholder="XXXX-XXXX"
                          autoComplete="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          {...field}
                        />
                      </FormControl>
                      {!fieldState.error ? (
                        <FormDescription className={AYUDA_CAMPO}>
                          Por ahora las cuentas nuevas son por invitación.
                        </FormDescription>
                      ) : null}
                      <FormMessage className={ERROR_CAMPO} />
                    </FormItem>
                  )}
                />
              ) : null}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={cn(BOTON_PRIMARIO, "w-full")}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    {esRegistro ? "Creando tu cuenta…" : "Ingresando…"}
                  </>
                ) : esRegistro ? (
                  "Crear cuenta"
                ) : (
                  "Ingresar"
                )}
              </button>
            </form>
          </Form>
        )}
      </div>
    </div>
  )
}
