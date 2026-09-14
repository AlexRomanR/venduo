import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { getAIStatus } from "@/lib/ai"
import { isSupabaseConfigured } from "@/lib/env"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

/**
 * Muestra qué capas están configuradas. Sirve de checklist mientras el
 * equipo va conectando Supabase y el proveedor de IA.
 */
export function ConfigStatus() {
  const ai = getAIStatus()
  const todo = !isSupabaseConfigured || ai.demo

  return (
    <Alert>
      {todo ? (
        <AlertTriangle className="size-4 text-amber-500" />
      ) : (
        <CheckCircle2 className="size-4 text-emerald-500" />
      )}
      <AlertTitle>
        {todo ? "Configuración pendiente" : "Todo conectado"}
      </AlertTitle>
      <AlertDescription>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant={isSupabaseConfigured ? "default" : "secondary"}>
            Supabase: {isSupabaseConfigured ? "conectado" : "sin configurar"}
          </Badge>
          <Badge variant={ai.demo ? "secondary" : "default"}>
            IA: {ai.provider}
            {ai.demo ? " (modo demo)" : ` · ${ai.model}`}
          </Badge>
        </div>
        {todo ? (
          <p className="pt-2 text-sm text-muted-foreground">
            Copia <code className="font-mono">.env.example</code> a{" "}
            <code className="font-mono">.env.local</code> y completa las claves.
            Mientras tanto la app funciona con datos de ejemplo.
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
