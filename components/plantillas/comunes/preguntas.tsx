import { Plus } from "lucide-react"
import type { ComponentType } from "react"

import { items, preguntaYRespuesta, texto } from "@/lib/plantillas/bloques"
import { cn } from "@/lib/utils"
import type { PropsBloque } from "@/components/plantillas/kit"

/**
 * Las preguntas frecuentes plegadas, con el título de cada kit.
 *
 * Quien compra busca una sola —la del cambio, la de la talla—: plegadas, se
 * leen las preguntas de un vistazo y se abre la que interesa. Cada kit pone
 * su título de sección y, si quiere, el color de la regla.
 */
export function preguntasPlegadas(
  Titulo: ComponentType<{ titulo: string }>,
  { regla = "border-tinta/20" }: { regla?: string } = {}
) {
  return function Preguntas({ bloque }: PropsBloque) {
    const lista = items(bloque)
      .map(preguntaYRespuesta)
      .filter((item) => item.pregunta)
    if (lista.length === 0) return null

    return (
      <section className="mx-auto w-full max-w-3xl px-5 py-12 md:py-20">
        <Titulo titulo={texto(bloque, "title") ?? "Antes de comprar"} />
        <div className={cn("mt-7 border-t", regla)}>
          {lista.map((item, i) => (
            <details key={i} className={cn("group border-b", regla)}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg leading-snug [&::-webkit-details-marker]:hidden">
                {item.pregunta}
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              {item.respuesta ? (
                <p className="max-w-[60ch] pb-5 leading-relaxed opacity-80">
                  {item.respuesta}
                </p>
              ) : null}
            </details>
          ))}
        </div>
      </section>
    )
  }
}
