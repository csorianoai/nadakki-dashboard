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
import {
  ACCESS_UNVERIFIED_DETAIL,
  ACCESS_UNVERIFIED_MESSAGE,
  unverifiedReasonFromBatch,
} from "@/lib/access/reason-codes";
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

  /**
   * "No pude evaluarte" no es "no tienes derecho" (#550). Con
   * `no_organization_unit` o `no_beneficiary_entitlement` el motor no esta diciendo
   * que falte la capability: esta diciendo que no llego a comprobarlo. Nombrar la
   * capability ahi manda al usuario a pedir un permiso que quiza ya tiene.
   *
   * Se lee del BATCH y no de `estado.reason_code`: cuando readiness declara
   * NOT_READY, `deriveDealerCoreUiState` llena `reason_code` con lo de readiness y
   * el codigo del batch no llega hasta aqui. Medido con un caso que fallaba:
   * readiness PENDING_EXTERNAL_ACTIVATION + batch `no_organization_unit` pintaba
   * "Próximamente", afirmando que el core no esta certificado cuando en realidad
   * no se pudo comprobar nada. `unverifiedReasonFromBatch` recorre los items
   * porque la denegacion es por capability: basta una para saber que la unidad no
   * llego.
   */
  const motivoNoVerificado = cargandoAcceso
    ? null
    : unverifiedReasonFromBatch(access.data?.results);
  const noVerificado = Boolean(motivoNoVerificado);

  return (
    <>
      <WelcomeGuide
        persona="dealer"
        userName={tenantName !== "—" ? tenantName : undefined}
        institutionName={tenantConfig.institution_name}
      />

      {montosVisibles ? null : (
        <div
          role="status"
          data-testid="dealer-bank-montos-ocultos"
          data-core-state={estado.state}
          data-no-verificado={noVerificado ? "true" : "false"}
          className={AVISO_CLASS}
        >
          {cargandoAcceso ? (
            <span>Verificando el acceso a Dealer-Bank…</span>
          ) : noVerificado ? (
            <>
              <strong>{ACCESS_UNVERIFIED_MESSAGE}.</strong> {ACCESS_UNVERIFIED_DETAIL}{" "}
              reason_code: <code>{motivoNoVerificado}</code>
            </>
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
