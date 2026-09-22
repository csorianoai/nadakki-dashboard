"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AccessApiError } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import {
  DMS02R_AUTHENTICATED_GET_PATHS,
  DMS02R_HTTP_IN_PRODUCTION_OPENAPI,
  PUBLIC_MARKETPLACE_VEHICLE_PATH,
} from "@/lib/dealer/dms02r-http";
import type { EntitlementDecision } from "@/types/entitlements";
import { REASON_CODE_INFO } from "@/types/entitlements";

export const DEALER_VEHICLE_CAPABILITY = "autos.inventory.view";

function asDecision(query: ReturnType<typeof useAccessEntitlementsBatch>): EntitlementDecision {
  if (query.error instanceof AccessApiError) {
    return {
      allowed: false,
      reason_code: (query.error.reason_code as EntitlementDecision["reason_code"]) || "DEFAULT_DENY",
    };
  }
  const item = query.data?.results?.[DEALER_VEHICLE_CAPABILITY];
  if (!item) return { allowed: false, reason_code: "DEFAULT_DENY" };
  return {
    allowed: item.allowed === true,
    reason_code: (item.reason_code as EntitlementDecision["reason_code"]) || "DEFAULT_DENY",
  };
}

function FichaBlocked() {
  return (
    <section
      role="alert"
      data-testid="dealer-vehicle-blocked-by-backend"
      data-blocked-by-backend="true"
      className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
    >
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Ficha del dealer no disponible</h2>
      <p className="mt-2 text-sm text-nk-fg-muted">
        BLOCKED_BY_BACKEND. El writer DMS-02R está en backend main (#1361). La superficie HTTP
        autenticada (#1365) no está en el OpenAPI de producción. El GET público del marketplace
        no es fuente.
      </p>
      {DMS02R_HTTP_IN_PRODUCTION_OPENAPI ? null : (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-nk-fg break-words">
          <li>
            <code>{`GET ${DMS02R_AUTHENTICATED_GET_PATHS.dealerVehicle}`}</code>
          </li>
          <li>
            <code>{`GET ${DMS02R_AUTHENTICATED_GET_PATHS.margin}`}</code>
          </li>
          <li>
            <code>{`GET ${DMS02R_AUTHENTICATED_GET_PATHS.days}`}</code>
          </li>
          <li>
            <code>{`GET ${DMS02R_AUTHENTICATED_GET_PATHS.costs}`}</code>
          </li>
        </ul>
      )}
      <p className="mt-3 text-xs text-nk-fg-muted break-words">
        Fuera de fuente: <code>{`GET ${PUBLIC_MARKETPLACE_VEHICLE_PATH}`}</code>
      </p>
    </section>
  );
}

export default function DealerVehicleEconomicsPage() {
  const params = useParams();
  const vehicleId = String(params?.vehicleId ?? "").trim();
  const query = useAccessEntitlementsBatch([DEALER_VEHICLE_CAPABILITY]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const decision = asDecision(query);

  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg break-words">
          {vehicleId || "Vehículo"}
        </h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Ficha autenticada DMS-02R. El marketplace público no es fuente.
        </p>
      </header>

      {!vehicleId ? (
        <p role="alert" className="text-sm text-nk-fg-muted">
          Falta el identificador del vehículo.
        </p>
      ) : query.isPending || query.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-vehicle-loading">
          Cargando acceso…
        </p>
      ) : query.error instanceof AccessApiError ? (
        <section
          role="alert"
          data-testid="dealer-vehicle-error"
          data-reason-code={query.error.reason_code ?? ""}
          data-http-status={String(query.error.status)}
          data-allowed="false"
          className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
        >
          <h2 className="font-manrope text-lg font-bold text-nk-fg">No se pudo verificar el acceso</h2>
          <p className="mt-1 text-sm text-nk-fg-muted">
            reason_code: <code>{query.error.reason_code ?? `HTTP_${query.error.status}`}</code>
          </p>
        </section>
      ) : !decision.allowed ? (
        <section
          role="alert"
          data-testid="dealer-vehicle-gated"
          data-reason-code={decision.reason_code}
          data-allowed="false"
          className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
        >
          <h2 className="font-manrope text-lg font-bold text-nk-fg">
            {REASON_CODE_INFO[decision.reason_code]?.title ?? decision.reason_code}
          </h2>
          <p className="mt-1 text-sm text-nk-fg-muted">
            {REASON_CODE_INFO[decision.reason_code]?.description ?? "Esta superficie no está disponible."}
          </p>
          <p className="mt-2 text-xs font-semibold text-nk-fg">
            reason_code: <code>{decision.reason_code}</code>
          </p>
          {REASON_CODE_INFO[decision.reason_code]?.action_required === "upgrade_plan" ||
          decision.reason_code === "UPGRADE_REQUIRED" ? (
            <button
              type="button"
              className="mt-3 min-h-11 w-full rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-semibold text-nk-fg"
              onClick={() => setUpgradeOpen(true)}
            >
              Ver planes publicados
            </button>
          ) : null}
          {upgradeOpen ? (
            <UpgradeModal decision={decision} onClose={() => setUpgradeOpen(false)} />
          ) : null}
        </section>
      ) : (
        <FichaBlocked />
      )}
    </main>
  );
}
