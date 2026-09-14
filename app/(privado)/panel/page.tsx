import { ConfigStatus } from "@/components/config-status"

export const metadata = { title: "Inicio" }

/**
 * Placeholder del panel del emprendedor.
 *
 * Punto de partida para construir las secciones. La infraestructura
 * (`lib/`) ya está disponible: Supabase, capa de IA, QR y validación.
 */
export default function PanelPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground">Aquí va tu aplicación.</p>
      </div>

      <ConfigStatus />
    </div>
  )
}
