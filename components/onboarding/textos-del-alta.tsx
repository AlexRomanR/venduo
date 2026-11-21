"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import {
  decidirTextos,
  TextosConError,
  TextosEscribiendo,
  TextosListos,
  TextosPropuestos,
  useTextosAMedida,
} from "@/components/editor/textos-a-medida"

/**
 * La primera propuesta de textos, al terminar el alta. La tienda ya está en
 * línea con los textos de su plantilla: la IA escribe los suyos mientras tanto
 * y la persona elige. Todavía no hay borrador, así que usarlos los publica.
 *
 * Si se va antes de decidir, la propuesta la espera en el editor.
 */
export function TextosDelAlta({ alUsar }: { alUsar: () => void }) {
  const textos = useTextosAMedida(true)
  const [abierta, setAbierta] = React.useState(false)
  const [enviando, setEnviando] = React.useState<
    "publicar" | "descartar" | null
  >(null)
  const [usados, setUsados] = React.useState(false)

  if (usados) {
    return <TextosListos>Listo: tu tienda ya usa estos textos.</TextosListos>
  }

  const { vista } = textos
  if (vista === null) {
    return <TextosEscribiendo demorada={textos.demorada} />
  }
  if (vista.estado === "error") {
    return (
      <TextosConError
        fallos={textos.fallos}
        alReintentar={textos.reintentar}
        sigueComo="Tu tienda sigue con los textos de su plantilla."
      />
    )
  }
  if (vista.estado !== "lista") return null

  async function decidir(accion: "publicar" | "descartar") {
    if (vista?.estado !== "lista") return
    setEnviando(accion)
    const error = await decidirTextos(vista.id, accion)
    setEnviando(null)
    if (error) {
      toast.error(error)
      return
    }
    if (accion === "publicar") {
      setUsados(true)
      alUsar()
    } else {
      textos.cerrar()
    }
  }

  return (
    <TextosPropuestos
      propuesta={vista.propuesta}
      abierta={abierta}
      alAbrir={() => setAbierta(true)}
    >
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => void decidir("publicar")}
          disabled={enviando !== null}
          className={cn(BOTON_PRIMARIO, "w-full")}
        >
          {enviando === "publicar" ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Usar estos textos
        </button>
        <button
          type="button"
          onClick={() => void decidir("descartar")}
          disabled={enviando !== null}
          className={cn(BOTON_SECUNDARIO, "w-full")}
        >
          Dejar los de la plantilla
        </button>
      </div>
    </TextosPropuestos>
  )
}
