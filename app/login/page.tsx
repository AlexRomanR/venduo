import { isSupabaseConfigured } from "@/lib/env"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Ingresar" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; rol?: string }>
}) {
  const { next, error, rol } = await searchParams

  // La portada manda el rol ya elegido; cualquier otro valor se ignora.
  const rolInicial =
    rol === "emprendedor" || rol === "vendedor" ? rol : undefined

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar a Venduo</CardTitle>
          <CardDescription>
            Ingresa con tu correo y contraseña, o crea una cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            next={next ?? "/panel"}
            configured={isSupabaseConfigured}
            initialError={error}
            rolInicial={rolInicial}
          />
        </CardContent>
      </Card>
    </div>
  )
}
