import { cn } from "@/lib/utils"

/**
 * Las marcas de las redes donde se comparte el enlace, dibujadas simples:
 * solo indican dónde va el enlace, no son parte de Venduo.
 */

export function LogoTikTok({ className }: { className?: string }) {
  const nota =
    "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z"
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <path d={nota} fill="#25f4ee" transform="translate(-0.8 -0.6)" />
      <path d={nota} fill="#fe2c55" transform="translate(0.8 0.6)" />
      <path d={nota} fill="#ffffff" />
    </svg>
  )
}

export function LogoInstagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <defs>
        <linearGradient id="ig-degradado" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#feda75" />
          <stop offset="0.45" stopColor="#d62976" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="6"
        fill="url(#ig-degradado)"
      />
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="2.8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <circle cx="16.6" cy="7.4" r="1" fill="#fff" />
    </svg>
  )
}

export function LogoWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <path
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z"
        fill="#25d366"
      />
      <path
        d="M9.2 7.4c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.5 4 2.2.9 2.7.7 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2-1.3-.8-.7-1.3-1.5-1.4-1.8-.2-.3 0-.4.1-.5l.4-.5.3-.4v-.5l-.7-1.9Z"
        fill="#fff"
      />
    </svg>
  )
}

export function LogoFacebook({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <circle cx="12" cy="12" r="10" fill="#1877f2" />
      <path
        d="M13.4 22v-7.2h2.4l.4-2.8h-2.8v-1.8c0-.8.2-1.4 1.4-1.4h1.5V6.3a19 19 0 0 0-2.2-.1c-2.2 0-3.7 1.3-3.7 3.8v2h-2.4v2.8h2.4V22h3Z"
        fill="#fff"
      />
    </svg>
  )
}
