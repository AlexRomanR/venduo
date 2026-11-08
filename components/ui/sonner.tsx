"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // Los colores de Venduo en vez de los de Sonner: con `richColors`
          // un aviso salía azul y un éxito verde, dos acentos que el sistema
          // no tiene. La frambuesa queda para el error, que pide algo.
          "--info-bg": "var(--hoja)",
          "--info-text": "var(--tinta)",
          "--info-border": "color-mix(in srgb, var(--tinta) 15%, transparent)",
          "--success-bg": "var(--hoja)",
          "--success-text": "var(--tinta)",
          "--success-border": "color-mix(in srgb, var(--tinta) 15%, transparent)",
          "--warning-bg": "var(--hoja)",
          "--warning-text": "var(--tinta)",
          "--warning-border": "color-mix(in srgb, var(--tinta) 25%, transparent)",
          "--error-bg": "var(--hoja)",
          "--error-text": "var(--senal)",
          "--error-border": "var(--senal)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
