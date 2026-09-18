import { redirect } from "next/navigation"

/**
 * La vitrina vieja. El catálogo del promotor vive ahora dentro de su panel,
 * en `/vendedor/catalogo`; esta ruta queda para los enlaces que ya circulan.
 */
export default async function ExplorarProductos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  redirect(
    q ? `/vendedor/catalogo?q=${encodeURIComponent(q)}` : "/vendedor/catalogo"
  )
}
