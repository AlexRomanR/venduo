"use client"

import * as React from "react"
import { LoaderCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { useConfirmacion } from "@/components/panel/confirmar"
import { darDeBaja } from "@/app/(privado)/cuenta/acciones"

/**
 * Dar de baja la cuenta. Va al final de `/cuenta`, en trazo y no lleno: es lo
 * único de la pantalla que no se deshace, y no tiene que invitar al toque.
 */
export function DarDeBaja({ conTienda }: { conTienda: boolean }) {
  const [trabajando, empezar] = React.useTransition()
  const { preguntar, dialogo } = useConfirmacion()

  async function pedir() {
    const si = await preguntar({
      titulo: "¿Dar de baja tu cuenta?",
      texto: conTienda
        ? "Tu tienda deja de verse y de recibir pedidos ahora mismo, y no vas a poder volver a entrar. A los 90 días borramos tu tienda, tus productos y tus datos. No se puede deshacer."
        : "No vas a poder volver a entrar, y a los 90 días borramos tus datos. No se puede deshacer.",
      confirmar: "Dar de baja mi cuenta",
    })
    if (!si) return

    empezar(async () => {
      const resultado = await darDeBaja()
      // Si salió bien, la acción ya redirigió y esto no corre.
      if (!resultado.ok) toast.error(resultado.error)
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-[60ch] text-sm leading-relaxed opacity-70">
        Tu tienda sale del aire en el acto y a los 90 días se borra con todo lo
        que tiene. Si solo quieres dejar de vender un tiempo, despublícala
        arriba, en los datos de tu tienda.
      </p>
      <button
        type="button"
        disabled={trabajando}
        onClick={() => void pedir()}
        className={cn(
          BOTON_SECUNDARIO,
          "min-h-11 shrink-0 px-4 text-sm text-senal"
        )}
      >
        {trabajando ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Trash2 aria-hidden="true" className="size-4" />
        )}
        Dar de baja mi cuenta
      </button>
      {dialogo}
    </div>
  )
}
