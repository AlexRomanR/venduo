/**
 * Vista previa de una plantilla.
 *
 * Se dibuja desde los bloques reales que la plantilla siembra, así que cuando
 * alguien edite el catálogo la vista previa cambia sola. Una captura de
 * pantalla guardada aparte se desactualiza en silencio y termina mostrando una
 * tienda que ya no existe.
 *
 * Va en tinta sobre papel y sin el color de la plantilla: el rojo de señal es
 * el único acento del sistema, y meter aquí seis paletas distintas rompería
 * esa regla en la primera pantalla que alguien ve después de registrarse.
 */
function Banda({ tipo }: { tipo: string }) {
  switch (tipo) {
    case "hero":
      return (
        <div className="space-y-1.5 bg-tinta/10 p-2.5">
          <div className="h-2 w-3/5 bg-tinta/40" />
          <div className="h-1 w-2/5 bg-tinta/20" />
        </div>
      )

    case "product_grid":
      return (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-square bg-tinta/10" />
          ))}
        </div>
      )

    case "about":
      return (
        <div className="space-y-1">
          <div className="h-1.5 w-1/3 bg-tinta/30" />
          <div className="h-1 w-full bg-tinta/15" />
          <div className="h-1 w-4/5 bg-tinta/15" />
        </div>
      )

    case "testimonials":
      return (
        <div className="grid grid-cols-2 gap-1">
          <div className="h-6 bg-tinta/10" />
          <div className="h-6 bg-tinta/10" />
        </div>
      )

    case "cta":
      return (
        <div className="flex flex-col items-center gap-1.5 bg-tinta/10 p-2">
          <div className="h-1 w-1/2 bg-tinta/30" />
          <div className="h-2 w-14 bg-tinta/40" />
        </div>
      )

    case "faq":
      return (
        <div className="space-y-1">
          <div className="h-1 w-4/5 bg-tinta/20" />
          <div className="h-1 w-2/3 bg-tinta/20" />
          <div className="h-1 w-3/4 bg-tinta/20" />
        </div>
      )

    case "contact":
    default:
      return (
        <div className="space-y-1 border-t border-tinta/15 pt-2">
          <div className="h-1 w-1/4 bg-tinta/30" />
          <div className="h-1 w-1/2 bg-tinta/15" />
        </div>
      )
  }
}

export function VistaPrevia({ bloques }: { bloques: string[] }) {
  return (
    <div
      aria-hidden="true"
      className="aspect-[4/3] space-y-2 overflow-hidden border border-tinta bg-papel p-3"
    >
      {/* Barra del navegador: sitúa el resto como una página, no como un icono. */}
      <div className="flex items-center gap-1 border-b border-tinta/15 pb-2">
        <div className="h-1 w-1 rounded-full bg-tinta/25" />
        <div className="h-1 w-1 rounded-full bg-tinta/25" />
        <div className="ml-1 h-1 flex-1 bg-tinta/10" />
      </div>

      {bloques.map((bloque, i) => (
        <Banda key={`${bloque}-${i}`} tipo={bloque} />
      ))}
    </div>
  )
}
