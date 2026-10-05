"use client";

import { useState } from "react";
import Link from "next/link";
import { getAccessClientContext } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { isAccessUnverified, unverifiedReasonFromBatch } from "@/lib/access/reason-codes";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import { DEALER_NAV_CAPABILITY_KEYS, visibleDealerNavGroups } from "@/components/dealer-management/shell/dealer-nav";
import type { EntitlementDecision } from "@/types/entitlements";

/**
 * Estado de modulos (P2): los mismos modulos y el mismo batch que el menu
 * (`visibleDealerNavGroups`), asi que nada que rebote puede salir "Disponible".
 * Solo dos estados visibles, con su accion. Sin reason_code, readiness ni notas
 * del catalogo: son internos.
 */
const UPGRADE_REASONS = new Set(["UPGRADE_REQUIRED", "NO_ACTIVE_SUBSCRIPTION", "LIMIT_REACHED", "ADD_ON_REQUIRED"]);
const MODULE_GROUPS = visibleDealerNavGroups((capability) => capability !== null);
const CARD = "max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4";
const BOTON = "mt-3 min-h-11 rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-semibold text-nk-fg";

export function DealerCoreStatusHome() {
  const context = getAccessClientContext();
  const batch = useAccessEntitlementsBatch(DEALER_NAV_CAPABILITY_KEYS);
  const [upgradeFor, setUpgradeFor] = useState<EntitlementDecision | null>(null);

  if (!context?.tenantId) {
    return (
      <section role="alert" data-testid="dealer-core-status-error" className={CARD}>
        <h2 className="font-manrope text-lg font-bold text-nk-fg">No pudimos identificar tu cuenta</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">Cierra sesión y vuelve a entrar para ver tus módulos.</p>
      </section>
    );
  }

  if (batch.isPending || batch.isLoading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-core-status-loading">
        Cargando tus módulos…
      </p>
    );
  }

  const results = batch.data?.results;
  // Sin verificar el acceso no se sabe que incluye el plan: "No incluido" seria falso.
  if (batch.error || !results || isAccessUnverified(unverifiedReasonFromBatch(results))) {
    return (
      <section role="alert" data-testid="dealer-core-status-error" className={CARD}>
        <h2 className="font-manrope text-lg font-bold text-nk-fg">No pudimos comprobar tus módulos</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Esto no significa que tu plan no los incluya. Vuelve a intentarlo en unos minutos o avisa a soporte.
        </p>
        <button type="button" className={BOTON} onClick={() => void batch.refetch()}>
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <div className="max-w-full space-y-5 overflow-x-hidden" data-testid="dealer-core-status-ready">
      {MODULE_GROUPS.map((group) => (
        <section key={group.id} aria-label={group.label} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">{group.label}</h2>
          {group.items.map((item) => {
            const decision = results[item.capability as string];
            const disponible = decision?.allowed === true;
            return (
              <article key={item.href} data-testid="dealer-core-card" data-module={item.label} className={CARD}>
                <h3 className="font-manrope text-base font-bold text-nk-fg">{item.label}</h3>
                <p className="mt-1 text-sm text-nk-fg-muted">{disponible ? "Disponible" : "No incluido en tu plan"}</p>
                {disponible ? (
                  <Link href={item.href} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-2 underline">
                    Abrir {item.label}
                  </Link>
                ) : decision && UPGRADE_REASONS.has(decision.reason_code ?? "") ? (
                  <button
                    type="button"
                    className={BOTON}
                    onClick={() => setUpgradeFor({ allowed: false, reason_code: decision.reason_code as EntitlementDecision["reason_code"] })}
                  >
                    Ver planes
                  </button>
                ) : (
                  <p className="mt-3 text-sm text-nk-fg">Pídele al administrador de tu cuenta que lo agregue a tu plan.</p>
                )}
              </article>
            );
          })}
        </section>
      ))}
      {upgradeFor ? <UpgradeModal decision={upgradeFor} onClose={() => setUpgradeFor(null)} /> : null}
    </div>
  );
}
