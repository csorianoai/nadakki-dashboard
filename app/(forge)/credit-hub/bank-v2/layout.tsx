"use client";

import { type ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";
import { BancoV2Shell } from "./BancoV2Shell";

/**
 * Panel del banco rediseñado (serie B). Vive aparte de /credit-hub/bank:
 * bank/layout.tsx impone BankChShell y un layout hijo no puede quitarlo. Las
 * rutas actuales no cambian ni redirigen, y el menu global todavia no enlaza
 * aqui (D-B3).
 */
export default function BancoV2Layout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary segment="credit-hub.bank-v2">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <BancoV2Shell>{children}</BancoV2Shell>
      </div>
    </RouteErrorBoundary>
  );
}
