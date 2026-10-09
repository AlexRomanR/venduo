import { exigirAdmin } from "@/lib/admin"
import { ArmazonDeAdmin } from "@/components/admin/armazon"

export const metadata = {
  title: { default: "Administración", template: "%s · Admin · Venduo" },
  robots: { index: false, follow: false },
}

/**
 * `/admin`: solo para la cuenta de administrador de Venduo. Para cualquier
 * otra, 404. Cada página vuelve a pedir `exigirAdmin()`: un layout no protege
 * por sí solo lo que se pide sin pasar por él.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await exigirAdmin()
  return <ArmazonDeAdmin>{children}</ArmazonDeAdmin>
}
