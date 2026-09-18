import {
  getMiInvitacion,
  getMiTienda,
  getVendedoresDeMiTienda,
} from "@/lib/data/panel"
import { getSiteUrl } from "@/lib/env"
import { formatDate, formatPercent } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { EnlaceInvitacion } from "@/components/panel/enlace-invitacion"

export const metadata = { title: "Vendedores" }

const ESTADO: Record<
  string,
  { texto: string; variant: "default" | "outline" }
> = {
  activo: { texto: "Activo", variant: "default" },
  pendiente: { texto: "Pendiente", variant: "outline" },
  rechazado: { texto: "Rechazado", variant: "outline" },
  suspendido: { texto: "Suspendido", variant: "outline" },
}

export default async function VendedoresPage() {
  const [tienda, invitacion, vendedores] = await Promise.all([
    getMiTienda(),
    getMiInvitacion(),
    getVendedoresDeMiTienda(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Promotores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quiénes promocionan lo tuyo y cuánto generaron.
        </p>
      </div>

      {tienda ? (
        <EnlaceInvitacion
          slug={tienda.slug}
          codigo={invitacion}
          siteUrl={getSiteUrl()}
        />
      ) : null}

      {vendedores.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8">
          <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            Todavía no promociona nadie lo tuyo. Tus productos ya están en el
            catálogo: cualquier promotor puede tomarlos y empezar a venderlos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Promotor</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 font-medium">Código</th>
                <th className="py-2 font-medium">Desde</th>
              </tr>
            </thead>
            <tbody>
              {vendedores.map((vendedor) => {
                const estado = ESTADO[vendedor.status] ?? {
                  texto: vendedor.status,
                  variant: "outline" as const,
                }

                return (
                  <tr key={vendedor.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{vendedor.nombre}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={estado.variant}>{estado.texto}</Badge>
                    </td>
                    <td className="py-3 pr-4 font-mono tracking-wider">
                      {vendedor.referralCode}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatDate(vendedor.joinedAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        {tienda?.seller_network_enabled ? (
          <>
            La comisión sale del precio y la calcula Venduo según el rango de
            cada producto: más alta en lo barato, más baja en lo caro. Se
            congela en cada venta, así que cambiarla no reescribe lo ya
            vendido.{" "}
          </>
        ) : (
          <>Tus productos todavía no están abiertos a promotores. </>
        )}
        Seguir las comisiones de cada promotor todavía no está construido.
      </p>
    </div>
  )
}
