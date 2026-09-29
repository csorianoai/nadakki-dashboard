"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { VoiceOverlayProvider } from "@/components/voice/VoiceOverlayContext";
import { ShopperMatchesNotification } from "@/components/shopper/ShopperMatchesNotification";
import { isDealerManagementPath } from "@/lib/autos-portal/routes";

const ConciergeHost = dynamic(
  () => import("@/components/concierge/ConciergeSheet").then((m) => m.ConciergeHost),
  { ssr: false },
);

const VoiceOverlay = dynamic(
  () => import("@/components/voice/VoiceOverlay").then((m) => m.VoiceOverlay),
  { ssr: false },
);

export function AutosLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /**
   * Superposiciones del marketplace para el comprador: Concierge AI, avisos del
   * personal shopper y overlay de voz. En el panel del dealer no aplican y
   * ademas estorban: el boton de Concierge es `fixed bottom-6 left-6` y tapa
   * los ultimos items del sidebar nuevo. Se ocultan aqui por el mismo motivo
   * que la TopNav del marketplace. El provider se mantiene para no romper el
   * contexto de quien lo consuma.
   */
  const consumerOverlays = !isDealerManagementPath(pathname);

  return (
    <VoiceOverlayProvider>
      {children}
      {consumerOverlays ? (
        <>
          <ShopperMatchesNotification />
          <ConciergeHost />
          <VoiceOverlay />
        </>
      ) : null}
    </VoiceOverlayProvider>
  );
}
