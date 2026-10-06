import type { Metadata } from "next"

import { VARIABLES_DE_FUENTES } from "@/lib/fuentes"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Venduo — tu tienda online, y todo lo que hay detrás",
    template: "%s · Venduo",
  },
  description:
    "Para quien vende por TikTok, Instagram y WhatsApp: tu tienda online con stock al día, pedidos que llegan a tu WhatsApp y catálogos en PDF.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Las variables de fuente van en <html> y no en <body>: `globals.css`
    // aplica `font-sans` sobre <html>, y una variable declarada en <body> no
    // es visible para su propio padre. Con ellas abajo, --font-sans resolvía
    // vacío y todo el texto de párrafo caía al serif del navegador. Están
    // todas, las de cada plantilla incluidas: ver `lib/fuentes.ts`.
    <html lang="es" suppressHydrationWarning className={VARIABLES_DE_FUENTES}>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
