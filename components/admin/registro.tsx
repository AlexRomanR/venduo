"use client"

import * as React from "react"
import { Copy, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { FICHA, FICHA_ELEGIDA, FICHA_LIBRE } from "@/lib/estilos"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  borrarInvitacion,
  cambiarAjuste,
  crearInvitacion,
} from "@/app/admin/acciones"
import { useAccion } from "@/components/admin/usar-accion"
import { Insignia } from "@/components/panel/piezas"

type Registro = "abierto" | "cerrado" | "invitacion"

const OPCIONES: { valor: Registro; nombre: string; detalle: string }[] = [
  {
    valor: "abierto",
    nombre: "Abierto",
    detalle: "Cualquiera crea su cuenta desde la portada.",
  },
  {
    valor: "invitacion",
    nombre: "Con invitación",
    detalle:
      "Solo quien tiene un código. Las cuentas que ya existen siguen entrando.",
  },
  {
    valor: "cerrado",
    nombre: "Cerrado",
    detalle: "Nadie nuevo. Las cuentas que ya existen siguen entrando.",
  },
]

const BOTON =
  "flex min-h-11 items-center justify-center gap-2 border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:opacity-50"
const CAMPO =
  "w-full border-b border-tinta bg-transparent py-2 text-base outline-none placeholder:text-tinta/40 focus-visible:border-senal"

export function EstadoDelRegistro({ estado }: { estado: Registro }) {
  const { enCurso, correr } = useAccion()
  return (
    <div
      role="radiogroup"
      aria-label="Cómo está el registro"
      className="flex flex-col"
    >
      {OPCIONES.map((o) => {
        const elegida = estado === o.valor
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={elegida}
            disabled={enCurso}
            onClick={() =>
              !elegida &&
              correr(
                () => cambiarAjuste({ clave: "registro", valor: o.valor }),
                `Registro: ${o.nombre.toLowerCase()}.`
              )
            }
            className="flex min-h-11 items-start gap-3 border-t border-tinta/15 px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-tinta/[0.03] disabled:opacity-60 sm:px-5"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                elegida ? "border-tinta" : "border-tinta/35"
              )}
            >
              {elegida ? (
                <span className="size-1.5 rounded-full bg-tinta" />
              ) : null}
            </span>
            <span>
              <span className="block font-semibold">{o.nombre}</span>
              <span className="block text-sm opacity-70">{o.detalle}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function copiar(texto: string) {
  navigator.clipboard
    .writeText(texto)
    .then(() => toast.success(`Código ${texto} copiado.`))
    .catch(() => toast.error("No se pudo copiar. Selecciónalo a mano."))
}

const VENCIMIENTOS = [
  { dias: 7, nombre: "7 días" },
  { dias: 30, nombre: "30 días" },
  { dias: null, nombre: "Sin vencimiento" },
] as const

export function Invitaciones({
  invitaciones,
  ahora,
}: {
  invitaciones: {
    code: string
    note: string | null
    created_at: string
    expires_at: string | null
    used_at: string | null
  }[]
  ahora: number
}) {
  const { enCurso, correr } = useAccion()
  const [nota, setNota] = React.useState("")
  const [dias, setDias] = React.useState<number | null>(7)
  const [creando, setCreando] = React.useTransition()

  return (
    <div>
      <form
        className="flex flex-col gap-3 px-4 py-4 sm:px-5"
        onSubmit={(evento) => {
          evento.preventDefault()
          setCreando(async () => {
            const resultado = await crearInvitacion({ nota, dias }).catch(
              () => ({
                ok: false as const,
                error: "No se pudo crear. Inténtalo de nuevo.",
              })
            )
            if (!resultado.ok) {
              toast.error(resultado.error)
              return
            }
            setNota("")
            if ("codigo" in resultado && resultado.codigo)
              copiar(resultado.codigo)
          })
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            Para quién
          </span>
          <input
            value={nota}
            onChange={(evento) => setNota(evento.target.value)}
            placeholder="Opcional: “Rosa, la de las zapatillas”"
            maxLength={120}
            className={CAMPO}
          />
        </label>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Vence en"
        >
          {VENCIMIENTOS.map((v) => (
            <button
              key={v.nombre}
              type="button"
              aria-pressed={dias === v.dias}
              onClick={() => setDias(v.dias)}
              className={cn(
                FICHA,
                dias === v.dias ? FICHA_ELEGIDA : FICHA_LIBRE
              )}
            >
              {v.nombre}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={creando}
          className={cn(BOTON, "self-start")}
        >
          Crear y copiar el código
        </button>
      </form>

      {invitaciones.length > 0 ? (
        <ul>
          {invitaciones.map((i) => {
            const vencida =
              i.expires_at !== null && Date.parse(i.expires_at) < ahora
            const libre = !i.used_at && !vencida
            return (
              <li
                key={i.code}
                className="flex items-center gap-3 border-t border-tinta/15 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold tracking-wider">
                      {i.code}
                    </span>
                    {i.used_at ? (
                      <Insignia tono="tinta">Usada</Insignia>
                    ) : vencida ? (
                      <Insignia tono="anulada">Vencida</Insignia>
                    ) : null}
                  </p>
                  <p className="text-sm opacity-70">
                    {i.note ? `${i.note} · ` : ""}
                    {i.used_at
                      ? `Usada el ${formatDate(i.used_at)}`
                      : i.expires_at
                        ? `Vence el ${formatDate(i.expires_at)}`
                        : "Sin vencimiento"}
                  </p>
                </div>
                {libre ? (
                  <button
                    type="button"
                    aria-label={`Copiar ${i.code}`}
                    onClick={() => copiar(i.code)}
                    className="flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal"
                  >
                    <Copy aria-hidden="true" className="size-4" />
                  </button>
                ) : null}
                {!i.used_at ? (
                  <button
                    type="button"
                    aria-label={`Borrar ${i.code}`}
                    disabled={enCurso}
                    onClick={() =>
                      correr(
                        () => borrarInvitacion({ codigo: i.code }),
                        "Invitación borrada."
                      )
                    }
                    className="flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
