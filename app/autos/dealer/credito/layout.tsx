import type { ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";
import { DealerCreditOsFrame } from "@/components/credit-hub/dealer/DealerCreditOsFrame";

/** Crédito del concesionario dentro de Dealer OS; la carcasa la pone app/autos/dealer/layout.tsx. */
export default function DealerCreditoLayout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary segment="autos.dealer.credito">
      <DealerCreditOsFrame>{children}</DealerCreditOsFrame>
    </RouteErrorBoundary>
  );
}
