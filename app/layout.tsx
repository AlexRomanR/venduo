import type { Metadata } from "next"
import { Archivo, Geist, Geist_Mono } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

/**
 * Voz de titular y de cifra.
 *
 * Un grotesco industrial, más apretado y con más carácter que la cara de
 * interfaz. Se carga solo el rango de pesos que se usa, y solo el subconjunto
 * latino, porque el público está en datos móviles y cada byte de fuente se
 * paga en la primera carga.
 */
const archivo = Archivo({
  variable: "--font-titular",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Venduo — tu tienda online en minutos",
    template: "%s · Venduo",
  },
  description:
    "Crea tu tienda, carga productos, cobra con QR y entiende tus ventas con IA.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Las variables de fuente van en <html> y no en <body>: `globals.css`
    // aplica `font-sans` sobre <html>, y una variable declarada en <body> no
    // es visible para su propio padre. Con ellas abajo, --font-sans resolvía
    // vacío y todo el texto de párrafo caía al serif del navegador.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable}`}
    >
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
