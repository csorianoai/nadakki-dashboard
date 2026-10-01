"use client";

/**
 * Cockpit de Dealer-Bank.
 *
 * Dos cosas cambian aqui, y las dos son sobre el dinero.
 *
 * 1. La moneda sale del BRANDING del tenant, no de `tenantConfig.currency_code`,
 *    que cae a "DOP" por defecto (useTenantConfig.ts:77). Esa caida es la que
 *    hacia que un tenant argentino viera pesos dominicanos. Sin moneda en el
 *    branding se pasa `null` y los importes salen como em dash: una cifra con la
 *    moneda equivocada es peor que una cifra que falta.
 *
 * 2. Los importes solo se pintan con la capability de credito concedida, y
 *    mientras readiness no declare el core operable se dice "Próximamente" en
 *    vez de ensenar numeros que no se pueden sostener. Las claves salen de
 *    DEALER_CORE_STATUS_ROWS (catalogo 097); este modulo no declara ninguna.
 */

import { useAuth } from "@/contexts/AuthContext";
import { DealerDashboardView } from "@/components/credit-hub/dealer/DealerDashboardView";
import { WelcomeGuide } from "@/components/credit-hub/onboarding/WelcomeGuide";
import { useAccessEntitlementsBatch, useAccessReadiness } from "@/lib/access/hooks";
import { DEALER_CORE_STATUS_ROWS, deriveDealerCoreUiState } from "@/lib/dealer/core-status";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useCreditStats } from "@/lib/credit-hub/hooks/useCreditStats";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";

const DEALER_BANK_ROW = DEALER_CORE_STATUS_ROWS.find((row) => row.name === "Dealer-Bank");

const AVISO_CLASS = "mb-4 rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg";

export default function DealerDashboardPage() {
  const { tenantName } = useAuth();
  const { tenantConfig } = useTenantConfig();
  const branding = useTenantBranding();
  const locale = localeDeTenant(branding.data);
  const applicationsQuery = useCreditApplications();
  const statsQuery = useCreditStats();

  const readinessKey = DEALER_BANK_ROW?.readinessKey ?? null;
  const actionCapability = DEALER_BANK_ROW?.actionCapability ?? "";
  const keys = [readinessKey, actionCapability].filter((key): key is string => Boolean(key));
  const access = useAccessEntitlementsBatch(keys);
  const readiness = useAccessReadiness();

  const accessError = Boolean(access.error || readiness.error);
  const cargandoAcceso =
    access.isPending || access.isLoading || readiness.isPending || readiness.isLoading;

  const estado = deriveDealerCoreUiState({
    accessError,
    readinessKey,
    entry: readiness.data?.entries.find((item) => item.capability_key === readinessKey) ?? null,
    batch: access.data?.results[actionCapability] ?? null,
  });

  /**
   * Fail-closed. READY solo habla de readiness --"Batch does not set READY",
   * core-status.ts:4--, asi que la capability se pide aparte: `action === "open"`
   * es lo que dice que el batch concedio.
   */
  const montosVisibles =
    !cargandoAcceso && !accessError && estado.state === "READY" && estado.action === "open";

  return (
    <>
      <WelcomeGuide
        persona="dealer"
        userName={tenantName !== "—" ? tenantName : undefined}
        institutionName={tenantConfig.institution_name}
      />

      {montosVisibles ? null : (
        <div role="status" data-testid="dealer-bank-montos-ocultos" data-core-state={estado.state} className={AVISO_CLASS}>
          {cargandoAcceso ? (
            <span>Verificando el acceso a Dealer-Bank…</span>
          ) : estado.state === "NOT_READY" || estado.state === "BLOCKED" ? (
            <>
              <strong>Próximamente.</strong> Dealer-Bank todavía no está certificado para este tenant, así
              que los montos no se publican. {estado.reason}
            </>
          ) : (
            <>
              Los montos de Dealer-Bank están reservados a quien tenga la capability{" "}
              <code>{actionCapability}</code>.{" "}
              {estado.reason_code ? (
                <>
                  reason_code: <code>{estado.reason_code}</code>
                </>
              ) : null}
            </>
          )}
        </div>
      )}

      <DealerDashboardView
        applications={applicationsQuery.data ?? []}
        stats={statsQuery.data}
        institutionName={tenantConfig.institution_name}
        userName={tenantName !== "—" ? tenantName : undefined}
        locale={locale.locale}
        currency={montosVisibles ? locale.currency : null}
        isLoading={applicationsQuery.isLoading || statsQuery.isLoading}
        isError={!!applicationsQuery.error || !!statsQuery.error}
        onRetry={() => {
          void applicationsQuery.refetch();
          void statsQuery.refetch();
        }}
      />
    </>
  );
}
