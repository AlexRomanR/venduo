"use client"

import * as React from "react"

/**
 * Panel de raspado de una tarjeta de recarga.
 *
 * El contenido revelado se renderiza en HTML y este componente lo TAPA al
 * montarse. Si el JavaScript no corre, o falla el canvas, la persona ve el
 * número igual: la interacción es un premio, nunca un requisito para
 * entender la oferta.
 *
 * Pensado para Android de gama baja: el canvas es del tamaño del panel, el
 * muestreo de progreso mira un píxel de cada ocho y corre como mucho cada
 * 150 ms.
 */
export function PanelRaspable({
  children,
  etiqueta = "Raspa para ver cuánto ganas",
}: {
  children: React.ReactNode
  etiqueta?: string
}) {
  const contenedorRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const raspandoRef = React.useRef(false)
  const ultimoMuestreoRef = React.useRef(0)

  // Arranca en false para que el servidor y el cliente rindan lo mismo; el
  // panel aparece recién al montarse.
  const [tapado, setTapado] = React.useState(false)
  const [revelado, setRevelado] = React.useState(false)

  React.useEffect(() => {
    setTapado(true)
  }, [])

  const pintarPlata = React.useCallback(() => {
    const canvas = canvasRef.current
    const contenedor = contenedorRef.current
    if (!canvas || !contenedor) return

    const { width, height } = contenedor.getBoundingClientRect()
    if (width === 0 || height === 0) return

    // Se limita a 2 para no pintar cuatro veces los píxeles en pantallas
    // densas de gama baja.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.globalCompositeOperation = "source-over"

    const veta = ctx.createLinearGradient(0, 0, width, height)
    veta.addColorStop(0, "#9ea3a8")
    veta.addColorStop(0.45, "#c9cdd1")
    veta.addColorStop(0.55, "#b1b6bb")
    veta.addColorStop(1, "#8d9297")
    ctx.fillStyle = veta
    ctx.fillRect(0, 0, width, height)

    // Grano: sin esto la plata se lee como un rectángulo gris plano.
    ctx.globalAlpha = 0.06
    ctx.fillStyle = "#3b3f43"
    for (let i = 0; i < Math.floor(width * height * 0.015); i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1)
    }
    ctx.globalAlpha = 1
  }, [])

  React.useEffect(() => {
    if (!tapado || revelado) return

    pintarPlata()
    const alRedimensionar = () => pintarPlata()
    window.addEventListener("resize", alRedimensionar)
    return () => window.removeEventListener("resize", alRedimensionar)
  }, [tapado, revelado, pintarPlata])

  function medirProgreso() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ahora = Date.now()
    if (ahora - ultimoMuestreoRef.current < 150) return
    ultimoMuestreoRef.current = ahora

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let transparentes = 0
    let mirados = 0
    for (let i = 3; i < data.length; i += 32) {
      if (data[i] === 0) transparentes++
      mirados++
    }

    if (mirados > 0 && transparentes / mirados > 0.45) setRevelado(true)
  }

  function raspar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!raspandoRef.current || revelado) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const caja = canvas.getBoundingClientRect()
    if (!ctx) return

    const dpr = canvas.width / caja.width
    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(
      (e.clientX - caja.left) * dpr,
      (e.clientY - caja.top) * dpr,
      22 * dpr,
      0,
      Math.PI * 2
    )
    ctx.fill()

    medirProgreso()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={contenedorRef}
        className="relative w-full overflow-hidden rounded-md"
      >
        <div className="flex min-h-28 flex-col items-center justify-center bg-carton px-4 py-5 text-center text-tinta">
          {children}
        </div>

        {tapado && !revelado ? (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={(e) => {
              raspandoRef.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              raspar(e)
            }}
            onPointerMove={raspar}
            onPointerUp={() => {
              raspandoRef.current = false
              medirProgreso()
            }}
            onPointerLeave={() => {
              raspandoRef.current = false
            }}
          />
        ) : null}
      </div>

      {tapado && !revelado ? (
        <button
          type="button"
          onClick={() => setRevelado(true)}
          className="text-sm font-medium text-white/80 underline underline-offset-4 transition-colors hover:text-white"
        >
          {etiqueta}
          <span className="sr-only"> — o presiona aquí para revelarlo</span>
        </button>
      ) : null}
    </div>
  )
}
