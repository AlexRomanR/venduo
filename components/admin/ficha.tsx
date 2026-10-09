"use client"

import * as React from "react"
import { EyeOff, Package, Trash2 } from "lucide-react"

import { formatMoney, formatNumber, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  agregarNota,
  borrarNota,
  cambiarSuscripcion,
  moderarProducto,
  pausarTienda,
  reanudarTienda,
} from "@/app/admin/acciones"
import { useAccion } from "@/components/admin/usar-accion"
import { useConfirmacion } from "@/components/panel/confirmar"
import { Insignia, Miniatura } from "@/components/panel/piezas"

const BOTON =
  "flex min-h-11 items-center justify-center gap-2 border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:opacity-50"
const BOTON_ALERTA =
  "flex min-h-11 items-center justify-center gap-2 border-2 border-senal px-4 text-sm font-semibold text-senal transition-colors hover:bg-senal hover:text-white disabled:opacity-50"
const CAMPO =
  "w-full border-b border-tinta bg-transparent py-2 text-base outline-none placeholder:text-tinta/40 focus-visible:border-senal"

/* ---------------------------------------------------------------- suscripción */

export function AccionesDeSuscripcion({
  tienda,
  estado,
}: {
  tienda: string
  estado: string | null
}) {
  const { enCurso, correr } = useAccion()
  const { preguntar, dialogo } = useConfirmacion()
  const [dias, setDias] = React.useState("30")

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(evento) => {
          evento.preventDefault()
          const n = Number(dias)
          if (!Number.isInteger(n) || n < 1 || n > 365) return
          correr(
            () => cambiarSuscripcion({ accion: "extender", tienda, dias: n }),
            `Prueba extendida ${n} días.`
          )
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            Extender la prueba
          </span>
          <span className="flex items-baseline gap-2">
            <input
              inputMode="numeric"
              value={dias}
              onChange={(evento) =>
                setDias(evento.target.value.replace(/\D/g, ""))
              }
              className={cn(CAMPO, "w-20")}
              aria-label="Días"
            />
            <span className="text-sm opacity-70">días</span>
          </span>
        </label>
        <button type="submit" disabled={enCurso} className={BOTON}>
          Extender
        </button>
      </form>

      <div className="flex flex-wrap gap-2 border-t border-tinta/15 pt-4">
        {estado !== "activa" ? (
          <button
            type="button"
            disabled={enCurso}
            className={BOTON}
            onClick={() =>
              correr(
                () => cambiarSuscripcion({ accion: "desbloquear", tienda }),
                "La suscripción quedó activa."
              )
            }
          >
            Marcar activa
          </button>
        ) : null}
        {estado !== "bloqueada" ? (
          <button
            type="button"
            disabled={enCurso}
            className={BOTON_ALERTA}
            onClick={async () => {
              const si = await preguntar({
                titulo: "¿Bloquear esta tienda?",
                texto:
                  "La tienda deja de verse y el panel queda en solo lectura. Si nadie la desbloquea, se purga en 90 días.",
                confirmar: "Bloquear",
              })
              if (si) {
                correr(
                  () => cambiarSuscripcion({ accion: "bloquear", tienda }),
                  "Tienda bloqueada."
                )
              }
            }}
          >
            Bloquear
          </button>
        ) : null}
      </div>
      {dialogo}
    </div>
  )
}

/* ---------------------------------------------------------------- pausa */

export function PausaDeTienda({
  tienda,
  pausada,
  motivo,
}: {
  tienda: string
  pausada: boolean
  motivo: string | null
}) {
  const { enCurso, correr } = useAccion()
  const [texto, setTexto] = React.useState("")

  if (pausada) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-senal">Pausada por Venduo</p>
          {motivo ? <p className="text-sm opacity-70">{motivo}</p> : null}
        </div>
        <button
          type="button"
          disabled={enCurso}
          className={BOTON}
          onClick={() =>
            correr(
              () => reanudarTienda({ tienda }),
              "La tienda vuelve a verse."
            )
          }
        >
          Reanudar
        </button>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(evento) => {
        evento.preventDefault()
        correr(
          () => pausarTienda({ tienda, motivo: texto }),
          "Tienda pausada: deja de verse al público."
        )
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">
          La tienda deja de verse al público, sin tocar su suscripción. El dueño
          sigue entrando a su panel. El motivo queda anotado, solo para ti.
        </span>
        <input
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Motivo: productos prohibidos, una denuncia…"
          maxLength={300}
          className={CAMPO}
        />
      </label>
      <button
        type="submit"
        disabled={enCurso || texto.trim().length < 3}
        className={cn(BOTON_ALERTA, "self-start")}
      >
        Pausar la tienda
      </button>
    </form>
  )
}

/* ---------------------------------------------------------------- productos */

export function ModeracionDeProductos({
  tienda,
  productos,
}: {
  tienda: string
  productos: {
    id: string
    name: string
    image_url: string | null
    price_cents: number
    stock: number
    is_active: boolean
    moderated_at: string | null
    moderation_reason: string | null
  }[]
}) {
  const { enCurso, correr } = useAccion()
  const [abierto, setAbierto] = React.useState<string | null>(null)
  const [motivo, setMotivo] = React.useState("")

  return (
    <ul>
      {productos.map((p) => (
        <li
          key={p.id}
          className="flex flex-col gap-3 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5"
        >
          <div className="flex items-center gap-3">
            <Miniatura foto={p.image_url} icono={Package} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold">{p.name}</span>
                {p.moderated_at ? (
                  <Insignia tono="senal">Oculto por Venduo</Insignia>
                ) : !p.is_active ? (
                  <Insignia tono="anulada">Oculto por la tienda</Insignia>
                ) : null}
              </p>
              <p className="text-sm opacity-70">
                {formatMoney(p.price_cents)} · {formatNumber(p.stock)} en stock
                {p.moderation_reason ? ` · ${p.moderation_reason}` : ""}
              </p>
            </div>
            {p.moderated_at ? (
              <button
                type="button"
                disabled={enCurso}
                className={BOTON}
                onClick={() =>
                  correr(
                    () =>
                      moderarProducto({ producto: p.id, tienda, motivo: null }),
                    "El producto vuelve a verse."
                  )
                }
              >
                Mostrar
              </button>
            ) : (
              <button
                type="button"
                aria-label={`Ocultar ${p.name}`}
                aria-expanded={abierto === p.id}
                disabled={enCurso}
                className="flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal disabled:opacity-50"
                onClick={() => {
                  setAbierto(abierto === p.id ? null : p.id)
                  setMotivo("")
                }}
              >
                <EyeOff aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
          {abierto === p.id ? (
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(evento) => {
                evento.preventDefault()
                correr(
                  () => moderarProducto({ producto: p.id, tienda, motivo }),
                  "Producto oculto de la tienda pública."
                )
                setAbierto(null)
              }}
            >
              <input
                autoFocus
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
                placeholder="Por qué se oculta"
                maxLength={300}
                className={cn(CAMPO, "flex-1")}
              />
              <button
                type="submit"
                disabled={enCurso || motivo.trim().length < 3}
                className={BOTON_ALERTA}
              >
                Ocultar
              </button>
            </form>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

/* ---------------------------------------------------------------- notas */

export function NotasDeTienda({
  tienda,
  notas,
  ahora,
}: {
  tienda: string
  notas: { id: string; body: string; created_at: string }[]
  ahora: number
}) {
  const { enCurso, correr } = useAccion()
  const [texto, setTexto] = React.useState("")

  return (
    <div>
      <form
        className="flex flex-col gap-3 px-4 py-4 sm:px-5"
        onSubmit={(evento) => {
          evento.preventDefault()
          correr(() => agregarNota({ tienda, texto }), "Nota guardada.")
          setTexto("")
        }}
      >
        <textarea
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Lo hablado por WhatsApp, lo prometido, lo que falta…"
          rows={3}
          maxLength={2000}
          className={cn(CAMPO, "resize-y")}
        />
        <button
          type="submit"
          disabled={enCurso || texto.trim() === ""}
          className={cn(BOTON, "self-start")}
        >
          Guardar la nota
        </button>
      </form>
      {notas.length > 0 ? (
        <ul>
          {notas.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-3 border-t border-tinta/15 px-4 py-3 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                <p className="mt-1 text-xs opacity-65">
                  {formatRelative(n.created_at, new Date(ahora))}
                </p>
              </div>
              <button
                type="button"
                aria-label="Borrar la nota"
                disabled={enCurso}
                onClick={() =>
                  correr(
                    () => borrarNota({ nota: n.id, tienda }),
                    "Nota borrada."
                  )
                }
                className="flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal disabled:opacity-50"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
