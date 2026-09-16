import { Marco } from "@/components/onboarding/marco"

export default function CrearLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Marco>{children}</Marco>
}
