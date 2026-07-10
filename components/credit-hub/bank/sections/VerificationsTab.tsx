"use client";

import type { ReactNode } from "react";
import { CircleSlash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  complianceMatchesFromResults,
  complianceStatusFromResults,
  getComplianceResults,
  getVehicleHistory,
  isSecurityEndpointUnavailable,
} from "@/lib/credit-hub/api/securityClient";
import { CHApiError } from "@/lib/credit-hub/api/client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useCreditHubActor } from "@/lib/credit-hub/hooks/useCreditHubActor";
import { getDeclaracionSemaforoRows, type DeclaracionVehiculoPayload } from "@/lib/credit-hub/dealer/vehicle-declaration";
import type { PreScreenStatus } from "@/lib/credit-hub/api/securityClient";

function Card({ title, children, testId }: { title: string; children: ReactNode; testId: string }) {
  return (
    <div className="ch-card p-4" data-testid={testId}>
      <h4 className="ch-eyebrow" style={{ marginBottom: 8 }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function EmptyVerificationState({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-forgeGray-500" data-testid="verification-empty-state">
      <CircleSlash className="h-4 w-4 shrink-0 text-forgeGray-400" aria-hidden />
      {message}
    </p>
  );
}

function useSafeQuery<T>(key: string[], fn: () => Promise<T>) {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: key,
    queryFn: fn,
    enabled: !!apiTenantId,
    retry: false,
  });
}

function hasIdentitySnapshot(status: string | null | undefined): boolean {
  return Boolean(status && status.trim());
}

export function VerificationsTab({
  applicationId,
  declaracion,
  vehicleVin,
  prescreenStatus,
  prescreenReport,
  identityStatus,
  identityDetail,
}: {
  applicationId: string;
  declaracion?: DeclaracionVehiculoPayload | null;
  vehicleVin?: string | null;
  prescreenStatus?: PreScreenStatus | "" | null;
  prescreenReport?: Record<string, unknown> | null;
  identityStatus?: string | null;
  identityDetail?: string | null;
}) {
  const { apiTenantId } = useTenant();
  const { roleKey } = useCreditHubActor();
  const isBankAnalyst = roleKey === "bank_analyst" || roleKey === "bank_admin" || roleKey === "credit_admin";

  const complianceQ = useSafeQuery(["compliance-results", apiTenantId ?? "", applicationId], () =>
    getComplianceResults({ tenantId: apiTenantId!, applicationId }),
  );
  const vin = (vehicleVin ?? "").trim();
  const historyQ = useSafeQuery(["vehicle-history", apiTenantId ?? "", vin], () =>
    getVehicleHistory({ tenantId: apiTenantId!, vin }),
  );

  const complianceHidden = complianceQ.error instanceof CHApiError && isSecurityEndpointUnavailable(complianceQ.error);
  const historyHidden =
    !vin || (historyQ.error instanceof CHApiError && isSecurityEndpointUnavailable(historyQ.error));

  const complianceStatus = complianceStatusFromResults(complianceQ.data?.results);
  const complianceMatches = complianceMatchesFromResults(complianceQ.data?.results);
  const hasPrescreenSnapshot = Boolean(prescreenStatus && prescreenStatus.trim());

  return (
    <div className="space-y-3" data-testid="verifications-tab">
      <Card title="Identidad (KYC)" testId="verification-card-identity">
        {!hasIdentitySnapshot(identityStatus) ? (
          <EmptyVerificationState message="No solicitada por el dealer" />
        ) : identityStatus === "VERIFIED" ? (
          <p className="text-sm text-green-700">
            ✓ Verificada por Nadakki{identityDetail ? ` — ${identityDetail}` : ""}
          </p>
        ) : identityStatus === "MISMATCH" ? (
          <p className="text-sm text-red-700">✗ Datos no coinciden{identityDetail ? ` — ${identityDetail}` : ""}</p>
        ) : identityStatus === "UNVERIFIED" ? (
          <p className="text-sm text-amber-700">⚠ Verificación solicitada — resultado pendiente o incompleto</p>
        ) : (
          <EmptyVerificationState message="No solicitada por el dealer" />
        )}
      </Card>

      <Card title="Pre-screening buró" testId="verification-card-prescreen">
        {!hasPrescreenSnapshot ? (
          <EmptyVerificationState message="No consultado" />
        ) : prescreenStatus === "ELIGIBLE" ? (
          <p className="text-sm text-green-700">🟢 Elegible para envío</p>
        ) : prescreenStatus === "ELIGIBLE_WITH_RESERVATIONS" ? (
          <p className="text-sm text-amber-700">🟡 Elegible con reservas</p>
        ) : (
          <p className="text-sm text-red-700">🔴 No elegible</p>
        )}
        {isBankAnalyst && prescreenReport ? (
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-forgeSurface-sunken p-2 text-xs">
            {JSON.stringify(prescreenReport, null, 2)}
          </pre>
        ) : null}
      </Card>

      {!complianceHidden ? (
        <Card title="Compliance AML" testId="verification-card-compliance">
          {complianceQ.isLoading ? <p className="text-forge-sm text-forgeGray-500">Cargando…</p> : null}
          {complianceStatus === "CLEAR" ? (
            <p className="text-sm text-green-700">✓ Sin coincidencias en listas restrictivas</p>
          ) : complianceStatus === "MATCH_FOUND" ? (
            <div className="text-sm text-red-700">
              ✗ Coincidencia encontrada
              <ul className="mt-1 list-disc pl-5">
                {complianceMatches.map((m, i) => (
                  <li key={i}>
                    {m.name ?? "—"}
                    {m.score != null ? ` (score ${m.score})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : complianceStatus === "REVIEW_PENDING" ? (
            <p className="text-sm text-amber-700">🟡 En revisión por oficial de cumplimiento</p>
          ) : (
            <EmptyVerificationState message="Sin resultado de screening" />
          )}
        </Card>
      ) : null}

      {!historyHidden ? (
        <Card title="Historial del vehículo (VIN)" testId="verification-card-vin">
          {historyQ.isLoading ? <p className="text-forge-sm text-forgeGray-500">Cargando…</p> : null}
          {(historyQ.data?.events ?? []).length === 0 ? (
            <EmptyVerificationState message="Sin registros previos en Nadakki" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(historyQ.data?.events ?? []).map((ev, i) => (
                <li key={i}>
                  {ev.label ?? ev.type ?? "Evento"}
                  {ev.at ? <span className="text-forgeGray-500"> · {ev.at}</span> : null}
                </li>
              ))}
            </ul>
          )}
          {(historyQ.data?.alerts ?? []).includes("ROLLBACK") ? (
            <p className="mt-2 text-sm text-red-700">Posible alteración de kilometraje</p>
          ) : null}
          {(historyQ.data?.alerts ?? []).includes("ACTIVE_LIEN") ? (
            <p className="mt-1 text-sm text-red-700">Crédito activo en otra institución</p>
          ) : null}
        </Card>
      ) : null}

      <Card title="Declaración del dealer" testId="verification-card-declaration">
        {!declaracion ? (
          <EmptyVerificationState message="Sin declaración registrada" />
        ) : (
          <ul className="space-y-1 text-sm">
            {getDeclaracionSemaforoRows(declaracion).map(({ label, isBad }) => (
              <li key={label} className={isBad ? "text-red-700" : "text-green-700"}>
                {isBad ? "✗" : "✓"} {label}
              </li>
            ))}
            <li className="text-forgeGray-600">
              Firma: {declaracion.firma_dealer} · {declaracion.fecha_firma}
            </li>
          </ul>
        )}
      </Card>
    </div>
  );
}
