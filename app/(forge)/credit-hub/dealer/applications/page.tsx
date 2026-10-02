"use client";

/**
 * Solicitudes del dealer.
 *
 * Mismo criterio que el cockpit: la moneda sale del BRANDING del tenant, no de
 * `tenantConfig.currency_code`, que cae a "DOP" (useTenantConfig.ts:77). Y los
 * importes solo se publican con la capability de credito concedida y con
 * readiness declarando el core operable; mientras no, se dice "Próximamente" en
 * vez de ensenar cifras que no se sostienen.
 *
 * Las claves vienen de DEALER_CORE_STATUS_ROWS (catalogo 097). Este modulo no
 * declara ninguna.
 */

import { DealerApplicationsListView } from "@/components/credit-hub/dealer/DealerApplicationsListView";
import { useAccessEntitlementsBatch, useAccessReadiness } from "@/lib/access/hooks";
import {
  ACCESS_UNVERIFIED_DETAIL,
  ACCESS_UNVERIFIED_MESSAGE,
  unverifiedReasonFromBatch,
} from "@/lib/access/reason-codes";
import { DEALER_CORE_STATUS_ROWS, deriveDealerCoreUiState } from "@/lib/dealer/core-status";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";

const DEALER_BANK_ROW = DEALER_CORE_STATUS_ROWS.find((row) => row.name === "Dealer-Bank");

export default function DealerApplicationsPage() {
  const applicationsQuery = useCreditApplications();
  const branding = useTenantBranding();
  const locale = localeDeTenant(branding.data);

  const readinessKey = DEALER_BANK_ROW?.readinessKey ?? null;
  const actionCapability = DEALER_BANK_ROW?.actionCapability ?? "";
  const access = useAccessEntitlementsBatch(
    [readinessKey, actionCapability].filter((key): key is string => Boolean(key)),
  );
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
 * READY solo habla de readiness; la concesion del batch es `action === "open"`.
 *
 * Y el motivo de la denegacion se PUBLICA: `estado.reason_code` sale tal cual lo
 * emite el motor de acceso, sin recapitalizar --los emite en minuscula y dentro
 * de un 200--, porque un cierre sin motivo visible no se puede ni diagnosticar ni
 * discutir. Era el blocker DENIAL_REASON_CODE_NOT_VISIBLE de la auditoria.
 */
  const montosVisibles =
    !cargandoAcceso && !accessError && estado.state === "READY" && estado.action === "open";

  /**
   * "No pude evaluarte" no es "no tienes derecho" (#550). Con
   * `no_organization_unit` o `no_beneficiary_entitlement` el motor no dice que
   * falte la capability: dice que no llego a comprobarlo --sin
   * `organization_unit_id` la cadena BENEFICIARY deniega cerrado antes de
   * consultar nada, services/access/entitlements.py:330-339--. Nombrar la
   * capability ahi manda al usuario a pedir un permiso que quiza ya tiene.
   *
   * Se lee del BATCH y no de `estado.reason_code`: con readiness en NOT_READY,
   * `deriveDealerCoreUiState` llena `reason_code` con lo de readiness y el codigo
   * del batch no llega. `unverifiedReasonFromBatch` recorre los items porque la
   * denegacion es POR capability. Y gana sobre "Próximamente": si no se evaluo, no
   * se afirma que el core no este certificado.
   */
  const motivoNoVerificado = cargandoAcceso
    ? null
    : unverifiedReasonFromBatch(access.data?.results);
  const noVerificado = Boolean(motivoNoVerificado);

  return (
    <>
      {montosVisibles ? null : (
        <div
          role="status"
          data-testid="solicitudes-montos-ocultos"
          data-core-state={estado.state}
          data-no-verificado={noVerificado ? "true" : "false"}
          className="mb-4 rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg"
        >
          {cargandoAcceso ? (
            <span>Verificando el acceso a Dealer-Bank…</span>
          ) : noVerificado ? (
            <>
              <strong>{ACCESS_UNVERIFIED_MESSAGE}.</strong> {ACCESS_UNVERIFIED_DETAIL}{" "}
              reason_code:{" "}
              <code data-testid="solicitudes-reason-code">{motivoNoVerificado}</code>
            </>
          ) : estado.state === "NOT_READY" || estado.state === "BLOCKED" ? (
            <>
              <strong>Próximamente.</strong> Dealer-Bank todavía no está certificado para este tenant, así
              que los montos de las solicitudes no se publican. {estado.reason}
            </>
          ) : (
            <>
              Los montos están reservados a quien tenga la capability{" "}
              <code>{actionCapability}</code>.{" "}
              {estado.reason_code ? (
                <>
                  reason_code: <code data-testid="solicitudes-reason-code">{estado.reason_code}</code>
                </>
              ) : null}
            </>
          )}
        </div>
      )}

      <DealerApplicationsListView
        applications={applicationsQuery.data ?? []}
        currency={montosVisibles ? locale.currency : null}
        isLoading={applicationsQuery.isLoading}
        isError={!!applicationsQuery.error}
        onRetry={() => void applicationsQuery.refetch()}
      />
    </>
  );
}
