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
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar a Venduo</CardTitle>
          <CardDescription>
            Ingresá con tu email y contraseña, o creá una cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            next={next ?? "/dashboard"}
            configured={isSupabaseConfigured}
            initialError={error}
          />
        </CardContent>
      </Card>
    </div>
  )
}
