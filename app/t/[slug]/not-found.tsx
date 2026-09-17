"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { BOTON_PRIMARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"

/**
 * Lo que no existe dentro de una tienda: un producto que se dio de baja, un
 * pedido de otra tienda, o la tienda misma si ya no se sirve.
 *
 * Suele llegar desde un enlace viejo de WhatsApp. Si la tienda existe, el
 * layout ya pintó su tema y la salida lleva a su portada.
 */
export default function NoEncontrado() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-55">
        No encontrado
      </p>
      <h1 className="mt-4 font-titular text-[clamp(2rem,7vw,3rem)] leading-tight font-extrabold tracking-[-0.03em]">
        Esto no está disponible
      </h1>
      {/* Un solo texto para los tres casos: esta pantalla no sabe cuál fue, y
          decir "el producto se agotó" a quien abre una tienda despublicada lo
          manda a buscar el error en el lugar equivocado. */}
      <p className="mt-4 max-w-[44ch] leading-relaxed opacity-70">
        Puede que la tienda todavía no esté publicada, que el producto ya no
        exista o que el enlace esté incompleto.
      </p>
      {slug ? (
        <Link href={`/t/${slug}`} className={cn(BOTON_PRIMARIO, "mt-9")}>
          Ver la tienda
        </Link>
      ) : null}
    </main>
  )
}
