"use client"

import * as React from "react"

import { formatMoney, formatNumber } from "@/lib/format"
import { construirPrecio, porcentaje, type Tramo } from "@/lib/precio"

/**
 * Cuánto puede ganar, con sus propios números.
 *
 * Los valores del producto no son lineales a propósito: entre Bs 30 y Bs 150
 * está casi todo lo que vende un joven por WhatsApp, y un deslizador lineal
 * hasta Bs 1.500 dejaría ese tramo en el primer centímetro.
 *
 * Los porcentajes salen de `pricing_tiers`, pasados desde el servidor: la
 * promesa que se hace acá es la que después paga `create_order`.
 */
const COSTOS_BS = [30, 45, 60, 80, 100, 130, 160, 220, 300, 450, 700, 1000]

/** Cuatro semanas y un tercio: el mes promedio, no el de 28 días. */
const SEMANAS_POR_MES = 4.33

export function Calculadora({ tramos }: { tramos: Tramo[] }) {
  const [indice, setIndice] = React.useState(4)
  const [ventas, setVentas] = React.useState(3)

  const precio = construirPrecio(COSTOS_BS[indice] * 100, tramos)
  const mensual = Math.round(precio.comisionCents * ventas * SEMANAS_POR_MES)

  return (
    <div className="border-2 border-tinta bg-papel p-5 sm:p-7">
      <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        Haz la cuenta
      </p>

      <label className="mt-6 block">
        <span className="flex items-baseline justify-between gap-4 text-sm">
          <span className="opacity-70">Un producto de</span>
          <span className="tabular font-titular text-lg font-bold tracking-[-0.02em]">
            {formatMoney(precio.precioCents)}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={COSTOS_BS.length - 1}
          step={1}
          value={indice}
          onChange={(e) => setIndice(Number(e.target.value))}
          aria-valuetext={formatMoney(precio.precioCents)}
          className="mt-3 h-11 w-full cursor-pointer accent-senal"
        />
      </label>

      <label className="mt-2 block">
        <span className="flex items-baseline justify-between gap-4 text-sm">
          <span className="opacity-70">Vendido por semana</span>
          <span className="tabular font-titular text-lg font-bold tracking-[-0.02em]">
            {formatNumber(ventas)} {ventas === 1 ? "vez" : "veces"}
          </span>
        </span>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={ventas}
          onChange={(e) => setVentas(Number(e.target.value))}
          aria-valuetext={`${ventas} por semana`}
          className="mt-3 h-11 w-full cursor-pointer accent-senal"
        />
      </label>

      <div className="mt-6 border-t-2 border-tinta pt-5">
        <p className="text-xs tracking-[0.12em] uppercase opacity-55">
          Ganarías al mes
        </p>
        <p
          aria-live="polite"
          className="tabular mt-2 font-titular text-[clamp(2.5rem,9vw,3.5rem)] leading-none font-extrabold tracking-[-0.05em] text-senal"
        >
          {formatMoney(mensual)}
        </p>
        <p className="mt-3 text-sm leading-relaxed opacity-70">
          <span className="tabular font-semibold opacity-100">
            {formatMoney(precio.comisionCents)}
          </span>{" "}
          por cada venta, el {porcentaje(precio.comisionBps)} de lo que cobra el
          negocio. Sin comprar nada antes.
        </p>
      </div>
    </div>
  )
}
