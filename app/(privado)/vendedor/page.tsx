export const metadata = { title: "Mis ventas" }

/**
 * Placeholder del panel del vendedor.
 *
 * Acá van sus ventas, sus comisiones y sus materiales de promoción.
 */
export default function VendedorPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mis ventas</h1>
        <p className="text-sm text-muted-foreground">
          Acá vas a ver tus ventas, tus comisiones y tus materiales.
        </p>
      </div>
    </div>
  )
}
