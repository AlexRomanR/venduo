"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  BOTON_PRIMARIO,
  FICHA,
  FICHA_ELEGIDA,
  FICHA_LIBRE,
} from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { crearTienda } from "@/app/crear/acciones"
import {
  PasarelaDePlantillas,
  type PlantillaDeLaPasarela,
} from "@/components/panel/pasarela-de-plantillas"

export interface RubroDelAlta {
  clave: string
  nombre: string
}

/**
 * Paso 2 del alta: los rubros como fichas y, debajo, la pasarela de
 * plantillas —la misma de Apariencia— con el nombre del negocio adentro de
 * cada dibujo. "Crear mi tienda con X" la crea de una vez: el negocio ya está
 * en el borrador. En el celular el botón va en una bandeja fija abajo, al
 * alcance del pulgar; desde 1024 px, bajo la plantilla.
 */
export function ElegirPlantilla({
  rubros,
  plantillas,
  rubroDe,
  miniaturas,
}: {
  rubros: RubroDelAlta[]
  /** Todas, en el orden de "Todas": la recomendada de cada rubro primero. */
  plantillas: PlantillaDeLaPasarela[]
  /** El rubro de cada plantilla, en el mismo orden. */
  rubroDe: string[]
  /** Los dibujos, en el mismo orden, con el negocio adentro. */
  miniaturas: React.ReactNode[]
}) {
  const router = useRouter()
  const [rubro, setRubro] = React.useState<string | null>(null)
  const [vista, setVista] = React.useState<PlantillaDeLaPasarela | null>(
    plantillas[0] ?? null
  )
  const [creando, setCreando] = React.useState(false)

  const visibles = React.useMemo(() => {
    const indices = plantillas
      .map((_, i) => i)
      .filter((i) => rubro === null || rubroDe[i] === rubro)
    return {
      plantillas: indices.map((i) => plantillas[i]),
      miniaturas: indices.map((i) => miniaturas[i]),
    }
  }, [plantillas, miniaturas, rubroDe, rubro])

  async function crear() {
    if (!vista || creando) return
    setCreando(true)
    const resultado = await crearTienda(vista.clave)
    if (resultado.ok) {
      router.push("/crear/listo")
      router.refresh()
      return
    }
    setCreando(false)
    if (resultado.yaTieneTienda) {
      router.replace("/panel")
      return
    }
    if (resultado.sinBorrador) {
      router.replace("/crear")
      return
    }
    if (resultado.revisarWhatsapp) {
      toast.error(resultado.error ?? "Revisa el WhatsApp de tu negocio.", {
        action: { label: "Corregir", onClick: () => router.push("/crear") },
      })
      return
    }
    toast.error(
      navigator.onLine
        ? (resultado.error ?? "No pudimos crear tu tienda. Inténtalo de nuevo.")
        : "No pudimos crear tu tienda. Revisa tu conexión e inténtalo de nuevo."
    )
  }

  const boton = vista ? (
    <button
      type="button"
      onClick={crear}
      disabled={creando}
      className={cn(BOTON_PRIMARIO, "w-full")}
    >
      {creando ? (
        <>
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Creando tu tienda…
        </>
      ) : (
        <span className="truncate">Crear mi tienda con {vista.nombre}</span>
      )}
    </button>
  ) : null

  return (
    <div className="flex flex-col gap-6">
      {rubros.length > 1 ? (
        // Columnas iguales: cuatro no entran en 375 px, y una sola abajo
        // quedaba desalineada (`GRILLA_DE_FICHAS`).
        <div
          role="group"
          aria-label="Filtrar por rubro"
          className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"
        >
          {[null, ...rubros.map((r) => r.clave)].map((clave) => {
            const activo = rubro === clave
            const nombre =
              clave === null
                ? "Todas"
                : (rubros.find((r) => r.clave === clave)?.nombre ?? clave)
            return (
              <button
                key={clave ?? "todas"}
                type="button"
                aria-pressed={activo}
                disabled={creando}
                onClick={() => setRubro(clave)}
                className={cn(
                  FICHA,
                  "w-full justify-center text-sm",
                  activo ? FICHA_ELEGIDA : FICHA_LIBRE
                )}
              >
                <span className="truncate">{nombre}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      <PasarelaDePlantillas
        // Al cambiar de rubro vuelve a la primera, la recomendada.
        key={rubro ?? "todas"}
        plantillas={visibles.plantillas}
        miniaturas={visibles.miniaturas}
        notas={["Con productos de ejemplo."]}
        bloqueada={creando}
        alCambiar={(nueva) => setVista(nueva)}
        acciones={() => (
          <div className="w-full max-lg:hidden sm:max-w-[26rem]">{boton}</div>
        )}
      />

      {/* En el celular, fija abajo. */}
      <div className="pieza-bandeja bandeja-al-borde fixed inset-x-0 bottom-0 z-20 border-t border-tinta bg-papel px-4 py-3 lg:hidden">
        {boton}
      </div>
    </div>
  )
}
