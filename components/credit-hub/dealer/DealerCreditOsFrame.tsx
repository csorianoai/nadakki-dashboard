"use client";

import type { ReactNode } from "react";
import "@/app/credit-hub/credit-hub.css";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";

/**
 * Marco del crédito del concesionario dentro de Dealer OS (/autos/dealer/credito/**).
 *
 * La carcasa (barra lateral, barra superior, contexto del dealer) la pone DealerShell desde
 * app/autos/dealer/layout.tsx. Aquí va solo lo que las pantallas de crédito necesitan y que
 * en /credit-hub/dealer ponían CreditHubLayoutClient y DealerChShell:
 * - los mismos guards de tenant y de rol (portal "dealer": dealer, tenant_admin,
 *   platform_superadmin, admin; lib/credit-hub/auth/portal-access.ts);
 * - el arranque de i18n de credit-hub (mapa de errores de Zod, idioma del tenant);
 * - el ámbito `credit-hub-forge` con persona dealer, del que cuelgan los tokens y las
 *   clases `ch-*` (app/credit-hub/credit-hub.css, todo bajo `.credit-hub-forge`).
 */
export function DealerCreditOsFrame({ children }: { children: ReactNode }) {
  return (
    <CHTenantGuard>
      <CHPortalAccessGuard portal="dealer">
        <CreditHubI18nBootstrap />
        <div className="credit-hub-forge" data-persona="dealer" data-testid="dealer-credito-frame">
          {children}
        </div>
      </CHPortalAccessGuard>
    </CHTenantGuard>
  );
}
