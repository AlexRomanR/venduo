"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const loginSchema = z.object({
  email: z.email("Escribí un email válido."),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm({
  next,
  configured,
  initialError,
}: {
  next: string
  configured: boolean
  initialError?: string
}) {
  const [sent, setSent] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  })

  React.useEffect(() => {
    if (initialError) toast.error(initialError)
  }, [initialError])

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined

  async function onSubmit(values: LoginValues) {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
    toast.success("Revisá tu correo: te mandamos el enlace de acceso.")
  }

  async function signInWithGoogle() {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })

    if (error) {
      setGoogleLoading(false)
      toast.error(error.message)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Mail className="size-6 text-muted-foreground" />
        <p className="text-sm">
          Enviamos un enlace a{" "}
          <span className="font-medium">{form.getValues("email")}</span>. Abrilo
          desde este mismo navegador.
        </p>
        <Button variant="outline" size="sm" onClick={() => setSent(false)}>
          Usar otro email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {!configured ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Supabase todavía no está configurado, así que el login no va a
          funcionar. Completá <code className="font-mono">.env.local</code> y
          reiniciá el servidor.
        </p>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
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

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : null}
            Enviarme el enlace
          </Button>
        </form>
      </Form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">o</span>
        <Separator className="flex-1" />
      </div>

      <Button
        variant="outline"
        onClick={signInWithGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? <Loader2 className="animate-spin" /> : null}
        Continuar con Google
      </Button>
    </div>
  )
}
