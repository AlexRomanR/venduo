import { ArmazonDelPanel } from "@/components/panel/armazon"

/**
 * Shell de las áreas privadas: `/panel`, `/vendedor` y `/cuenta`.
 *
 * Una barra lateral en escritorio y un cajón en el celular. La barra horizontal
 * de antes envolvía en dos filas a 375 px y no tenía dónde mostrar lo que pide
 * atención —cuántos pedidos esperan, qué se quedó sin stock— ni la tienda y su
 * enlace, que es lo que un emprendedor busca más veces por día.
 *
 * El panel es una herramienta de Venduo y se ve igual para todos, con el
 * mundo de DESIGN.md. Antes tomaba la plantilla de la tienda, y una letra o un
 * color elegidos para vender —una condensada en mayúsculas, el azul de un
 * botón de compra, una antigua fina para las cifras— terminaban en cada rótulo
 * de una pantalla de trabajo. La identidad de la tienda sigue a la vista
 * donde la representa: su tarjeta en la barra y su sello en el Resumen.
 *
 * El armazón es el mismo que usan las vitrinas y `/sumarme` cuando la persona
 * ya tiene panel: vive en `components/panel/armazon.tsx`.
 */
export default function PrivadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ArmazonDelPanel>{children}</ArmazonDelPanel>
}
