import { AutosPortalShell } from "@/components/system/AutosPortalShell";
import { AutosMarketplaceTopNav } from "@/components/autos/AutosMarketplaceTopNav";
import { AutosLayoutClient } from "@/components/autos/AutosLayoutClient";
import { ThemeProvider } from "@/components/system/ThemeProvider";
import { TenantProvider } from "@/components/system/TenantProvider";
import { ShopperProvider } from "@/components/shopper/ShopperProvider";
import { CartProvider } from "@/components/autos/CartProvider";
import { AuthProvider } from "@/lib/auth-context";

export default function AutosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AutosPortalShell>
      <ThemeProvider>
        <TenantProvider>
          <AuthProvider>
            <CartProvider>
              <ShopperProvider>
                <AutosMarketplaceTopNav />
                <AutosLayoutClient>{children}</AutosLayoutClient>
              </ShopperProvider>
            </CartProvider>
          </AuthProvider>
        </TenantProvider>
      </ThemeProvider>
    </AutosPortalShell>
  );
}