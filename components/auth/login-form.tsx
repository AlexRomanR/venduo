"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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

// Los dos esquemas declaran los mismos campos y solo cambian las reglas: si
// tuvieran formas distintas, el resolver no podría alternar entre ellos.
const baseSchema = z.object({
  fullName: z.string().max(80),
  email: z.email("Escribí un email válido."),
  password: z.string(),
})

const signInSchema = baseSchema.extend({
  password: z.string().min(1, "Escribí tu contraseña."),
})

const signUpSchema = baseSchema.extend({
  fullName: z.string().min(2, "Escribí tu nombre.").max(80),
  password: z
    .string()
    .min(MIN_PASSWORD, `Mínimo ${MIN_PASSWORD} caracteres.`)
    .max(72, "Máximo 72 caracteres."),
})

type Mode = "ingresar" | "registrarse"
type Values = z.infer<typeof baseSchema>

export function LoginForm({
  next,
  configured,
  initialError,
}: {
  next: string
  configured: boolean
  initialError?: string
}) {
  const router = useRouter()
  const [mode, setMode] = React.useState<Mode>("ingresar")

  const isSignUp = mode === "registrarse"

  const form = useForm<Values>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  })

  React.useEffect(() => {
    if (initialError) toast.error(initialError)
  }, [initialError])

  // Los requisitos de contraseña cambian entre modos, así que los errores
  // pendientes dejan de aplicar al cambiar.
  function switchTo(nextMode: Mode) {
    setMode(nextMode)
    form.clearErrors()
  }

  async function onSubmit(values: Values) {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        // El disparador de la base lee full_name de acá para crear el perfil.
        options: { data: { full_name: values.fullName } },
      })

      if (error) {
        toast.error(
          error.message.includes("already registered")
            ? "Ese email ya tiene cuenta. Probá ingresando."
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
            ? "Email o contraseña incorrectos."
            : error.message
        )
        return
      }
    }

    // refresh() revalida el layout del servidor, que es el que lee la sesión.
    router.push(next)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {!configured ? (
        <p className="rounded-md bg-muted p-3 text-sm">
          Supabase todavía no está configurado, así que el ingreso no va a
          funcionar. Completá <code className="font-mono">.env.local</code> y
          reiniciá el servidor.
        </p>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {isSignUp ? (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tu nombre"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="vos@ejemplo.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    {...field}
                  />
                </FormControl>
                {isSignUp ? (
                  <FormDescription>
                    Mínimo {MIN_PASSWORD} caracteres.
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : null}
            {isSignUp ? "Crear cuenta" : "Ingresar"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}{" "}
        <button
          type="button"
          onClick={() => switchTo(isSignUp ? "ingresar" : "registrarse")}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {isSignUp ? "Ingresar" : "Crear una"}
        </button>
      </p>
    </div>
  )
}
