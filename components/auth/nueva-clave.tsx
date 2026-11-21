"use client"

import * as React from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  CAMPO_LINEA,
  ERROR_CAMPO,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

const MIN_PASSWORD = 8

/**
 * La contraseña nueva, con la sesión que abrió el enlace del correo. Al
 * guardarla entra directo a su tienda: ya está adentro, no tiene sentido
 * mandarla a ingresar de nuevo.
 */
export function NuevaClave({ correo }: { correo: string | null }) {
  const [clave, setClave] = React.useState("")
  const [verClave, setVerClave] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [guardando, setGuardando] = React.useState(false)

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (clave.length < MIN_PASSWORD) {
      setError(`Mínimo ${MIN_PASSWORD} caracteres.`)
      return
    }
    if (clave.length > 72) {
      setError("Máximo 72 caracteres.")
      return
    }
    const supabase = createClient()
    if (!supabase) return

    setGuardando(true)
    const { error: fallo } = await supabase.auth.updateUser({
      password: clave,
    })
    if (fallo) {
      setGuardando(false)
      setError(
        fallo.code === "same_password"
          ? "Es la misma que tenías. Elige otra."
          : fallo.code === "weak_password"
            ? "Es muy fácil de adivinar. Prueba con una más larga."
            : null
      )
      if (fallo.code !== "same_password" && fallo.code !== "weak_password") {
        toast.error("No pudimos guardarla. Inténtalo de nuevo en un rato.")
      }
      return
    }

    toast.success("Listo: tu contraseña cambió.")
    // El destino lo decide el servidor: el panel, el alta o la administración.
    window.location.assign("/auth/destino")
  }

  const idError = "clave-nueva-error"

  return (
    <form onSubmit={guardar} className="flex flex-col gap-6" noValidate>
      {/* El correo, para que el navegador guarde la contraseña con su cuenta. */}
      {correo ? (
        <p className="text-sm">
          <span className={cn(ETIQUETA_CAMPO, "block")}>Tu cuenta</span>
          <span className="mt-1 block font-semibold">{correo}</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={correo}
            readOnly
            hidden
          />
        </p>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor="clave-nueva" className={ETIQUETA_CAMPO}>
          Contraseña nueva
        </label>
        <div className="relative">
          <Input
            id="clave-nueva"
            className={cn(CAMPO_LINEA, "pr-12")}
            type={verClave ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
            value={clave}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? idError : undefined}
            onChange={(evento) => {
              setClave(evento.target.value)
              if (error) setError(null)
            }}
          />
          <button
            type="button"
            onClick={() => setVerClave((antes) => !antes)}
            aria-pressed={verClave}
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute top-0 right-0 flex size-12 items-center justify-center text-tinta/65 transition-colors hover:text-tinta"
          >
            {verClave ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
        {error ? (
          <p id={idError} className={ERROR_CAMPO}>
            {error}
          </p>
        ) : (
          <p className={AYUDA_CAMPO}>Mínimo {MIN_PASSWORD} caracteres.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={guardando}
        className={cn(BOTON_PRIMARIO, "w-full")}
      >
        {guardando ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Guardando…
          </>
        ) : (
          "Guardar y entrar"
        )}
      </button>
    </form>
  )
}
