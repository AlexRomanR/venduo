import { EsqueletoDelResumen } from "@/components/panel/esqueleto"

/**
 * El Resumen mientras carga.
 *
 * Cada sección del panel tiene su propio `loading.tsx`, y no es por gusto:
 * se ve el más cercano a la página, así que una sección sin el suyo
 * mostraría la forma del Resumen mientras carga.
 */
export default function Cargando() {
  return <EsqueletoDelResumen />
}
