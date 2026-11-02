"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/marca/logo"
import estilos from "@/components/portada/portada.module.css"

const ANCLAS = [
  { href: "#como-funciona", texto: "Cómo funciona" },
  { href: "#pedidos", texto: "Pedidos" },
  { href: "#por-que", texto: "Por qué Venduo" },
  { href: "#incluye", texto: "Qué incluye" },
  { href: "#preguntas", texto: "Preguntas" },
]

export function Cabecera({ conSesion }: { conSesion: boolean }) {
  const [bajo, setBajo] = useState(false)

  useEffect(() => {
    const mirar = () => setBajo(window.scrollY > 24)
    mirar()
    window.addEventListener("scroll", mirar, { passive: true })
    return () => window.removeEventListener("scroll", mirar)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300",
        bajo
          ? "border-[var(--regla)] bg-[var(--papel)]/85 backdrop-blur-xl"
          : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-4 px-5 sm:gap-8 sm:px-6 lg:px-10">
        <Link href="/" className="text-[1.4rem]" aria-label="Venduo, inicio">
          <Logo />
        </Link>
        <nav className="ml-6 hidden items-center gap-7 text-[15px] text-[var(--tinta)]/65 lg:flex">
          {ANCLAS.map((ancla) => (
            <a
              key={ancla.href}
              href={ancla.href}
              className="transition-colors hover:text-[var(--tinta)]"
            >
              {ancla.texto}
            </a>
          ))}
        </nav>
        {conSesion ? null : (
          <Link
            href="/login"
            className="ml-auto hidden text-[15px] text-[var(--tinta)]/75 transition-colors hover:text-[var(--tinta)] sm:inline"
          >
            Ingresar
          </Link>
        )}
        <Link
          href={conSesion ? "/auth/destino" : "/login?modo=registro"}
          className={cn(
            estilos.boton,
            "ml-auto min-h-11 px-5 text-sm whitespace-nowrap sm:ml-0"
          )}
        >
          {conSesion ? (
            "Ir a mi panel"
          ) : (
            <span>
              Crear mi tienda
              <span className="hidden sm:inline"> gratis</span>
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
