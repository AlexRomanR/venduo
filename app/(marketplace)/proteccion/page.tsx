import { AlertTriangle, Check, LockKeyhole, ShieldCheck } from "lucide-react"

const PASOS = [
  {
    icono: LockKeyhole,
    titulo: "Pagas a PagoFácil",
    detalle: "El dinero no entra a una cuenta de Venduo ni del negocio.",
  },
  {
    icono: ShieldCheck,
    titulo: "El monto queda retenido",
    detalle:
      "El negocio coordina la entrega, pero todavía no puede retirar el pago.",
  },
  {
    icono: Check,
    titulo: "Tú confirmas la entrega",
    detalle:
      "Recién entonces PagoFácil libera y reparte el monto entre las partes.",
  },
]

export default function ProteccionPage() {
  return (
    <div className="px-5 py-10 lg:px-10 lg:py-14">
      <h1 className="max-w-[14ch] font-titular text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.93] font-extrabold tracking-[-0.04em]">
        Tu pago no se libera antes que tu compra.
      </h1>
      <p className="mt-6 max-w-[60ch] text-lg leading-relaxed opacity-65">
        La protección de Venduo se parece a una custodia: PagoFácil retiene el
        monto y Venduo solo da la instrucción de liberar o devolver. En el MVP,
        la pasarela es simulada y no hace cargos reales.
      </p>

      <div className="mt-12 grid gap-0 lg:grid-cols-3">
        {PASOS.map(({ icono: Icono, titulo, detalle }) => (
          <section
            key={titulo}
            className="border-t border-tinta/20 py-7 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0"
          >
            <Icono aria-hidden="true" className="size-6 text-senal" />
            <h2 className="mt-5 font-titular text-xl font-bold tracking-[-0.02em]">
              {titulo}
            </h2>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed opacity-65">
              {detalle}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-12 bg-tinta px-6 py-8 text-papel sm:px-9">
        <div className="flex items-start gap-4">
          <AlertTriangle
            aria-hidden="true"
            className="mt-1 size-6 shrink-0 text-senal"
          />
          <div>
            <h2 className="font-titular text-2xl font-bold tracking-[-0.03em]">
              Si algo sale mal, reclama antes de liberar.
            </h2>
            <p className="mt-3 max-w-[58ch] leading-relaxed text-papel/65">
              El pedido pasa a disputa y el pago queda congelado mientras Venduo
              revisa. Liberar y devolver son acciones excluyentes: nunca pueden
              ocurrir las dos.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
