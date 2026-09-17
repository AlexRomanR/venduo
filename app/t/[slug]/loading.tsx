import { Skeleton } from "@/components/ui/skeleton"

/**
 * Mientras carga una pantalla de la tienda.
 *
 * No sabe qué plantilla tiene la tienda —un `loading` no recibe datos—, pero
 * no le hace falta: el layout ya pintó el tema, así que el esqueleto sale con
 * el papel, la tinta y el radio de la plantilla. La forma es la de una grilla
 * de productos, que es lo que viene en casi todas las pantallas.
 */
export default function Cargando() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando la tienda"
      className="mx-auto w-full max-w-6xl flex-1 px-5 py-10"
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-40 rounded-plantilla bg-tinta/10" />
        <Skeleton className="size-11 rounded-plantilla bg-tinta/10" />
      </div>

      <Skeleton className="mt-10 h-14 w-3/4 max-w-lg bg-tinta/10" />
      <Skeleton className="mt-4 h-5 w-2/3 max-w-md bg-tinta/[0.07]" />

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[3/4] w-full rounded-none bg-tinta/[0.07]" />
            <Skeleton className="mt-3 h-4 w-3/4 bg-tinta/10" />
            <Skeleton className="mt-2 h-4 w-1/3 bg-tinta/[0.07]" />
          </div>
        ))}
      </div>
    </div>
  )
}
