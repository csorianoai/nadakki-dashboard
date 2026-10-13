"use client";

import { type ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";
import { BancoV2Shell } from "./BancoV2Shell";

/**
 * Panel del banco (serie B). Vive aparte de /credit-hub/bank: bank/layout.tsx
 * impone BankChShell y un layout hijo no puede quitarlo. Desde UNA-VERSION es
 * el banco: las rutas de /credit-hub/bank redirigen aqui (next.config.js) y el
 * menu global y el login enlazan aqui.
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
