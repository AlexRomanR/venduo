import { Marco } from "@/components/onboarding/marco"
import { NavExplorar } from "@/components/explorar/nav"

export default function ExplorarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Marco>
      <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
        <NavExplorar />
        {children}
      </div>
    </Marco>
  )
}
