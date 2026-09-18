import { MarcoMarketplace } from "@/components/marketplace/marco"
import { ProveedorCarritoMarketplace } from "@/components/marketplace/carrito"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProveedorCarritoMarketplace>
      <MarcoMarketplace>{children}</MarcoMarketplace>
    </ProveedorCarritoMarketplace>
  )
}
