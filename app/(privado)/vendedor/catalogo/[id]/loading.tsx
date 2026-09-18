export default function LoadingProductoPromotor() {
  return (
    <div className="animate-pulse space-y-8" aria-label="Cargando producto">
      <div className="h-11 w-40 bg-tinta/10" />
      <div className="grid gap-9 lg:grid-cols-2 lg:gap-14">
        <div className="aspect-[4/3] bg-tinta/10" />
        <div className="space-y-5">
          <div className="h-4 w-32 bg-tinta/10" />
          <div className="h-24 w-4/5 bg-tinta/10" />
          <div className="h-20 w-full bg-tinta/10" />
          <div className="h-14 w-full bg-tinta/10" />
        </div>
      </div>
    </div>
  )
}
