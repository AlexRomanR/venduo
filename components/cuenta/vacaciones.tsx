"use client"

import * as React from "react"
import { CalendarDays, CirclePause } from "lucide-react"
import { toast } from "sonner"

import { Fila, HojaDeAjuste, Palanca } from "@/components/panel/ajustes"
import {
  CAMPO_LINEA,
  FICHA,
  FICHA_ELEGIDA,
  FICHA_LIBRE,
  GRILLA_DE_FICHAS,
} from "@/lib/estilos"
import { diaEnBolivia, sumarDias } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  DIAS_MAXIMOS_DE_VACACIONES,
  diaCorto,
  diaEnPalabras,
  fechaDeVueltaValida,
} from "@/lib/vacaciones"

type Guardar = (entrada: {
  activa: boolean
  hasta: string | null
}) => Promise<{ ok: true } | { ok: false; error: string }>

const PLAZOS = [
  { nombre: "1 semana", dias: 7 },
  { nombre: "2 semanas", dias: 14 },
  { nombre: "1 mes", dias: 30 },
]

/**
 * Las vacaciones de la tienda: un sí o no que se guarda en el acto —corta los
 * pedidos, no puede esperar a un "Guardar"— y la fecha de vuelta, opcional.
 * Un toque sin querer se deshace desde el aviso.
 */
export function Vacaciones({
  activa: activaInicial,
  hasta: hastaInicial,
  guardar,
}: {
  activa: boolean
  hasta: string | null
  guardar: Guardar
}) {
  const [activa, setActiva] = React.useState(activaInicial)
  const [hasta, setHasta] = React.useState(hastaInicial)
  const [eligiendo, setEligiendo] = React.useState(false)

  async function cambiar(siguiente: { activa: boolean; hasta: string | null }) {
    const antes = { activa, hasta }
    setActiva(siguiente.activa)
    setHasta(siguiente.hasta)
    const resultado = await guardar(siguiente).catch(() => ({
      ok: false as const,
      error: "No pudimos cambiar tus vacaciones. Revisa tu conexión.",
    }))
    if (!resultado.ok) {
      setActiva(antes.activa)
      setHasta(antes.hasta)
      toast.error(resultado.error)
      return false
    }
    return true
  }

  async function alternar(siguiente: boolean) {
    const datos = { activa: siguiente, hasta: siguiente ? hasta : null }
    if (!(await cambiar(datos))) return
    if (siguiente) {
      toast.success("Tu tienda está de vacaciones: no recibe pedidos.", {
        action: {
          label: "Deshacer",
          onClick: () => void cambiar({ activa: false, hasta: null }),
        },
      })
    } else {
      toast.success("Tu tienda vuelve a recibir pedidos.")
    }
  }

  return (
    <>
      <ul>
        <Palanca
          icono={CirclePause}
          titulo="De vacaciones"
          valor={activa}
          alCambiar={(valor) => void alternar(valor)}
        />
        {activa ? (
          <Fila
            icono={CalendarDays}
            titulo="Vuelves"
            valor={hasta ? diaCorto(hasta) : "Sin fecha"}
            apagado={!hasta}
            alTocar={() => setEligiendo(true)}
          />
        ) : null}
      </ul>
      {eligiendo ? (
        <HojaDeFecha
          hasta={hasta}
          alCerrar={async (nueva) => {
            setEligiendo(false)
            if (nueva === hasta) return
            if (await cambiar({ activa: true, hasta: nueva })) {
              toast.success(
                nueva
                  ? `Vuelves el ${diaEnPalabras(nueva)}.`
                  : "Sin fecha de vuelta: tú decides cuándo."
              )
            }
          }}
        />
      ) : null}
    </>
  )
}

function HojaDeFecha({
  hasta,
  alCerrar,
}: {
  hasta: string | null
  alCerrar: (hasta: string | null) => void
}) {
  const hoy = diaEnBolivia()
  const manana = sumarDias(hoy, 1)
  const tope = sumarDias(hoy, DIAS_MAXIMOS_DE_VACACIONES)
  const [dia, setDia] = React.useState(hasta ?? "")
  const valida = dia === "" || fechaDeVueltaValida(dia)

  return (
    <HojaDeAjuste
      abierta
      titulo="¿Cuándo vuelves?"
      descripcion="Ese día tu tienda vuelve a recibir pedidos sola."
      alCerrar={() => alCerrar(valida && dia ? dia : valida ? null : hasta)}
    >
      <div role="group" aria-label="En cuánto" className={GRILLA_DE_FICHAS}>
        {PLAZOS.map(({ nombre, dias }) => {
          const valor = sumarDias(hoy, dias)
          return (
            <button
              key={nombre}
              type="button"
              aria-pressed={dia === valor}
              onClick={() => setDia(valor)}
              className={cn(
                FICHA,
                "w-full justify-center",
                dia === valor ? FICHA_ELEGIDA : FICHA_LIBRE
              )}
            >
              <span className="truncate">{nombre}</span>
            </button>
          )
        })}
      </div>
      <label className="mt-6 flex flex-col gap-2">
        <span className="text-sm font-semibold">O elige el día</span>
        <input
          type="date"
          value={dia}
          min={manana}
          max={tope}
          aria-invalid={!valida}
          onChange={(evento) => setDia(evento.target.value)}
          className={cn(CAMPO_LINEA, "w-full")}
        />
      </label>
      <p
        className={cn(
          "mt-2 text-sm",
          valida ? "text-tinta/65" : "font-semibold text-senal"
        )}
      >
        {!valida
          ? "Elige un día desde mañana."
          : dia
            ? capitalizar(diaEnPalabras(dia))
            : "Sin fecha: vuelves cuando apagues las vacaciones."}
      </p>
      {dia ? (
        <button
          type="button"
          onClick={() => setDia("")}
          className="mt-2 flex min-h-11 items-center self-start text-sm font-semibold underline underline-offset-4"
        >
          Quitar la fecha
        </button>
      ) : null}
    </HojaDeAjuste>
  )
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
