import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"

const PREGUNTAS = [
  [
    "¿Necesito una cuenta para comprar?",
    "No. Solo pedimos tu nombre y WhatsApp para que el negocio coordine la entrega.",
  ],
  [
    "¿Quién entrega el producto?",
    "El negocio coordina contigo por WhatsApp. Venduo no gestiona couriers ni rutas de envío.",
  ],
  [
    "¿Cuándo recibe el dinero el negocio?",
    "Cuando confirmas que recibiste, PagoFácil libera el monto y hace el reparto.",
  ],
  [
    "¿El precio cambia si llegué por un promotor?",
    "No. El precio publicado es el mismo para todas las personas y ya incluye todos sus componentes.",
  ],
]

export default function AyudaMarketplacePage() {
  return (
    <div className="px-5 py-10 lg:px-10 lg:py-14">
      <h1 className="max-w-[13ch] font-titular text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.93] font-extrabold tracking-[-0.04em]">
        Comprar debería sentirse claro.
      </h1>
      <div className="mt-12 max-w-3xl">
        {PREGUNTAS.map(([pregunta, respuesta]) => (
          <details
            key={pregunta}
            className="group border-t border-tinta/20 py-5"
            open={pregunta === PREGUNTAS[0][0]}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-titular text-lg font-bold tracking-[-0.02em]">
              {pregunta}
              <Plus
                aria-hidden="true"
                className="size-5 text-senal transition-transform group-open:rotate-45"
              />
            </summary>
            <p className="mt-3 max-w-[62ch] leading-relaxed opacity-65">
              {respuesta}
            </p>
          </details>
        ))}
      </div>
      <Link
        href="/"
        className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white hover:bg-senal-alta"
      >
        Explorar productos
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  )
}
