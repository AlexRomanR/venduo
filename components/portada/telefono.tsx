import Image from "next/image"
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MessageCircle,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { producto } from "@/components/portada/productos"

/**
 * El celular de la entrada de la portada, dibujado en código para que cada pieza
 * se pueda mover. Cinco pantallas apiladas: la tienda, el producto, el chat de
 * WhatsApp con el pedido, el cobro y el stock en el panel. La tienda es de
 * ejemplo y los números, ilustrativos.
 *
 * Todo se mide en `cqw`: el texto crece con el celular, no con la página.
 */

const PRODUCTOS_TIENDA = ["zapatillas", "chamarra", "audifonos", "cartera"]

function Foto({ clave, className }: { clave: string; className?: string }) {
  const p = producto(clave)
  return (
    <Image
      src={p.foto}
      alt=""
      width={p.ancho}
      height={p.alto}
      sizes="160px"
      className={cn("h-auto object-contain", className)}
    />
  )
}

function BarraDeEstado({ oscura }: { oscura?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-[7cqw] pt-[4.5cqw] pb-[2cqw] text-[3.4cqw] font-semibold tabular-nums",
        oscura ? "text-white" : "text-[#16110e]"
      )}
    >
      <span>21:47</span>
      <span className="flex items-center gap-[1.4cqw]">
        <span className="h-[2.4cqw] w-[4.4cqw] rounded-[0.6cqw] border border-current opacity-80" />
      </span>
    </div>
  )
}

function Tienda() {
  return (
    <div className="js-pantalla absolute inset-0 flex flex-col bg-[#f4f0ea] text-[#16110e]">
      <BarraDeEstado />
      <div className="flex items-center justify-between border-b border-black/10 px-[5cqw] py-[3cqw]">
        <span className="text-[4.6cqw] font-black tracking-[-0.01em] uppercase [font-stretch:75%]">
          Rosa Deportes
        </span>
        <ShoppingBag className="size-[5cqw]" aria-hidden="true" />
      </div>
      <p className="px-[5cqw] pt-[4cqw] text-[7cqw] font-black uppercase [font-stretch:62%]">
        Lo nuevo
      </p>
      <div className="grid grid-cols-2 gap-[3cqw] px-[5cqw] pt-[3cqw]">
        {PRODUCTOS_TIENDA.map((clave, i) => {
          const p = producto(clave)
          return (
            <div key={clave} className={cn(i === 0 && "js-tocado")}>
              <div className="flex aspect-[4/5] items-center justify-center rounded-[2cqw] bg-[#e7e0d5] p-[2cqw]">
                <Foto clave={clave} className="max-h-full w-full" />
              </div>
              <p className="mt-[1.6cqw] truncate text-[3.2cqw] font-semibold">
                {p.nombre}
              </p>
              <p className="text-[3.2cqw] opacity-70">{p.precio}</p>
            </div>
          )
        })}
      </div>
      <span
        aria-hidden="true"
        className="js-dedo absolute top-[42%] left-[26%] size-[11cqw] rounded-full border-[0.8cqw] border-white/90 bg-white/30 opacity-0 shadow-[0_0_0_2cqw_color-mix(in_srgb,var(--boli)_25%,transparent)]"
      />
    </div>
  )
}

function Ficha() {
  const p = producto("zapatillas")
  return (
    <div className="js-pantalla absolute inset-0 flex flex-col bg-[#f4f0ea] text-[#16110e] opacity-0">
      <BarraDeEstado />
      <div className="flex items-center justify-between px-[5cqw] py-[3cqw]">
        <ArrowLeft className="size-[5cqw]" aria-hidden="true" />
        <span className="relative">
          <ShoppingBag className="size-[5.4cqw]" aria-hidden="true" />
          <span className="js-insignia absolute -top-[1.6cqw] -right-[2cqw] flex size-[4.2cqw] scale-0 items-center justify-center rounded-full bg-[var(--boli)] text-[2.6cqw] font-bold text-white">
            1
          </span>
        </span>
      </div>
      <div className="mx-[5cqw] flex aspect-square items-center justify-center rounded-[3cqw] bg-[#e7e0d5]">
        <Foto clave="zapatillas" className="w-[86%] -rotate-6" />
      </div>
      <div className="px-[5cqw] pt-[4cqw]">
        <p className="text-[7.5cqw] leading-[0.9] font-black uppercase [font-stretch:62%]">
          {p.nombre}
        </p>
        <div className="mt-[2cqw] flex items-baseline gap-[3cqw]">
          <span className="text-[5cqw] font-bold">{p.precio}</span>
          <span className="text-[3.2cqw] font-semibold text-[#1d3aa8]">
            Quedan {p.quedan}
          </span>
        </div>
        <div className="js-agregar relative mt-[4cqw] h-[11cqw] overflow-hidden rounded-full bg-[#16110e] text-[3.6cqw] font-semibold text-white">
          <span className="js-agregar-a absolute inset-0 flex items-center justify-center">
            Agregar al carrito
          </span>
          <span className="js-agregar-b absolute inset-0 flex translate-y-full items-center justify-center gap-[1.5cqw] bg-[var(--boli)]">
            <Check className="size-[4cqw]" aria-hidden="true" />
            Agregado
          </span>
        </div>
      </div>
      <div className="js-hoja absolute inset-x-0 bottom-0 translate-y-full rounded-t-[5cqw] bg-white px-[5cqw] pt-[4cqw] pb-[6cqw] shadow-[0_-10px_40px_rgb(0_0_0/0.18)]">
        <div className="flex items-center justify-between text-[3.6cqw]">
          <span className="opacity-70">Tu pedido · 1 producto</span>
          <span className="font-bold">Bs 450</span>
        </div>
        <div className="mt-[3cqw] flex h-[11cqw] items-center justify-center gap-[2cqw] rounded-full bg-[#1fa855] text-[3.6cqw] font-semibold text-white">
          <MessageCircle className="size-[4.4cqw]" aria-hidden="true" />
          Enviar pedido por WhatsApp
        </div>
      </div>
    </div>
  )
}

function CabeceraDeChat() {
  return (
    <div className="flex items-center gap-[3cqw] bg-[#1f2c34] px-[4cqw] pb-[3cqw] text-white">
      <ArrowLeft className="size-[5cqw]" aria-hidden="true" />
      <span className="flex size-[9cqw] items-center justify-center rounded-full bg-[var(--boli)] text-[3.6cqw] font-bold">
        C
      </span>
      <span className="leading-tight">
        <span className="block text-[4cqw] font-semibold">Carla</span>
        <span className="block text-[3cqw] opacity-60">en línea</span>
      </span>
    </div>
  )
}

function MensajeDelPedido({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[84%] rounded-[3cqw] rounded-tl-none bg-[#202c33] px-[3.4cqw] py-[2.6cqw] text-[3.4cqw] leading-snug text-[#e9edef]",
        className
      )}
    >
      <p>Hola Rosa Deportes, quiero hacer este pedido (#152):</p>
      <p className="mt-[2cqw]">· 1× Zapatillas rojas (Talla 38) — Bs 450</p>
      <p className="mt-[1.4cqw] font-semibold">Total: Bs 450</p>
      <p className="mt-[1cqw] text-right text-[2.6cqw] opacity-50">21:47</p>
    </div>
  )
}

function Chat() {
  return (
    <div className="js-pantalla absolute inset-0 flex flex-col bg-[#0b141a] opacity-0">
      <div className="bg-[#1f2c34]">
        <BarraDeEstado oscura />
      </div>
      <CabeceraDeChat />
      <div className="flex flex-1 flex-col gap-[2.4cqw] px-[4cqw] pt-[5cqw]">
        <p className="mx-auto rounded-[1.6cqw] bg-[#182229] px-[3cqw] py-[1cqw] text-[2.8cqw] text-white/60">
          Hoy
        </p>
        <div className="js-escribe flex w-fit gap-[1.2cqw] rounded-[3cqw] rounded-tl-none bg-[#202c33] px-[3.4cqw] py-[3cqw]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-[1.8cqw] animate-pulse rounded-full bg-white/60"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
        <MensajeDelPedido className="js-pedido -mt-[9cqw] opacity-0" />
      </div>
    </div>
  )
}

function Cobro() {
  return (
    <div className="js-pantalla absolute inset-0 flex flex-col bg-[#0b141a] opacity-0">
      <div className="bg-[#1f2c34]">
        <BarraDeEstado oscura />
      </div>
      <CabeceraDeChat />
      <div className="flex flex-1 flex-col gap-[2.4cqw] px-[4cqw] pt-[5cqw]">
        <MensajeDelPedido />
        <div className="js-burbuja ml-auto max-w-[80%] rounded-[3cqw] rounded-tr-none bg-[#005c4b] px-[3.4cqw] py-[2.4cqw] text-[3.4cqw] text-[#e9edef] opacity-0">
          ¡Gracias! Te paso el QR.
          <span className="mt-[0.6cqw] flex items-center justify-end gap-[1cqw] text-[2.6cqw] opacity-60">
            21:48 <CheckCheck className="size-[3.4cqw] text-[#53bdeb]" />
          </span>
        </div>
        <div className="js-burbuja max-w-[80%] rounded-[3cqw] rounded-tl-none bg-[#202c33] px-[3.4cqw] py-[2.4cqw] text-[3.4cqw] text-[#e9edef] opacity-0">
          Listo, ya te pagué.
        </div>
      </div>
      <div className="js-panel absolute inset-x-[3cqw] bottom-[4cqw] translate-y-[130%] rounded-[4cqw] bg-[#ece8e1] p-[4cqw] text-[#0c0d0f] shadow-[0_20px_50px_rgb(0_0_0/0.6)]">
        <div className="flex items-center justify-between">
          <span className="text-[3cqw] font-semibold opacity-60">
            Venduo · Pedido #152
          </span>
          <span className="text-[4.4cqw] font-black">Bs 450</span>
        </div>
        <p className="mt-[1cqw] text-[3.4cqw]">1 × Zapatillas rojas</p>
        <div className="js-pagar relative mt-[3cqw] h-[10.5cqw] overflow-hidden rounded-full border-[0.5cqw] border-[#0c0d0f] text-[3.6cqw] font-bold">
          <span className="js-pagar-a absolute inset-0 flex items-center justify-center">
            Marcar como pagado
          </span>
          <span className="js-pagar-b absolute inset-0 flex translate-y-full items-center justify-center gap-[1.5cqw] bg-[#0c0d0f] text-[#ece8e1]">
            <Check
              className="size-[4cqw] text-[var(--boli)]"
              aria-hidden="true"
            />
            Pagado
          </span>
        </div>
      </div>
    </div>
  )
}

function Stock() {
  return (
    <div className="js-pantalla absolute inset-0 flex flex-col bg-[#0c0d0f] text-[#ece8e1] opacity-0">
      <BarraDeEstado oscura />
      <div className="px-[5cqw] pt-[2cqw]">
        <p className="text-[3.2cqw] opacity-60">Tu panel</p>
        <p className="text-[8cqw] leading-none font-black uppercase [font-stretch:62%]">
          Productos
        </p>
      </div>
      <div className="mx-[5cqw] mt-[5cqw] rounded-[4cqw] border border-[#ece8e1]/12 bg-[#17181c] p-[4cqw]">
        <div className="flex items-center gap-[3cqw]">
          <div className="flex size-[16cqw] shrink-0 items-center justify-center rounded-[2.4cqw] bg-[#222328]">
            <Foto clave="zapatillas" className="w-[90%] -rotate-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[3.8cqw] font-semibold">Zapatillas rojas</p>
            <p className="text-[3.2cqw] opacity-60">Bs 450</p>
          </div>
          <div className="text-right">
            <p className="text-[2.8cqw] opacity-60">Stock</p>
            <div className="relative h-[11cqw] w-[9cqw] overflow-hidden text-[11cqw] leading-none font-black [font-stretch:62%]">
              <span className="js-num-a absolute inset-0 text-right">3</span>
              <span className="js-num-b absolute inset-0 translate-y-full text-right text-[var(--boli)]">
                2
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="js-aviso mx-[5cqw] mt-[3cqw] flex translate-y-[20%] items-start gap-[2.4cqw] rounded-[4cqw] bg-[var(--boli)] p-[3.6cqw] text-white opacity-0">
        <TriangleAlert
          className="mt-[0.4cqw] size-[4.6cqw] shrink-0"
          aria-hidden="true"
        />
        <p className="text-[3.4cqw] leading-snug font-semibold">
          Quedan 2 zapatillas rojas. Repón antes de que se acaben.
        </p>
      </div>
      <div className="mx-[5cqw] mt-auto mb-[6cqw] grid grid-cols-2 gap-[3cqw]">
        {[
          ["Ventas de hoy", "Bs 450"],
          ["Pedidos pagados", "1"],
        ].map(([rotulo, valor]) => (
          <div
            key={rotulo}
            className="rounded-[3cqw] border border-[#ece8e1]/12 p-[3cqw]"
          >
            <p className="text-[2.8cqw] opacity-60">{rotulo}</p>
            <p className="js-cifra text-[6.4cqw] font-black [font-stretch:75%]">
              {valor}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Telefono({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19.2] rounded-[14%/6.6%] bg-[#050506] p-[3.2%] shadow-[0_40px_120px_-30px_rgb(29_28_26/0.35),0_0_0_1px_rgb(236_232_225/0.12)]",
        className
      )}
    >
      <div className="@container relative h-full overflow-hidden rounded-[11%/5.2%] bg-black">
        <Tienda />
        <Ficha />
        <Chat />
        <Cobro />
        <Stock />
        <span
          aria-hidden="true"
          className="absolute top-[1.6%] left-1/2 z-10 h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-black"
        />
      </div>
    </div>
  )
}
