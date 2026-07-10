"use client";

import { useQuery } from "@tanstack/react-query";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getAmortizationSchedule,
  isBankExperienceEndpointUnavailable,
} from "@/lib/credit-hub/api/bankExperienceClient";
import { chMoneyExact } from "@/lib/credit-hub/ch-base";
import { usePrimaryOfferId } from "@/lib/credit-hub/hooks/usePrimaryOfferId";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AmortizationTable({
  applicationId,
  offerId: offerIdProp,
  actorRole = "dealer",
}: {
  applicationId: string;
  offerId?: string | null;
  actorRole?: "dealer" | "bank_analyst";
}) {
  const { apiTenantId } = useTenant();
  const { offerId: resolvedOfferId, isLoading: offerLoading } = usePrimaryOfferId(applicationId);
  const offerId = offerIdProp ?? resolvedOfferId;

  const q = useQuery({
    queryKey: ["amortization", apiTenantId, applicationId, offerId],
    queryFn: () =>
      getAmortizationSchedule({
        tenantId: apiTenantId!,
        applicationId,
        offerId: offerId!,
        actorRole,
      }),
    enabled: !!apiTenantId && !!offerId,
    retry: false,
  });

  if (!offerId && !offerLoading) return null;
  if (q.error instanceof CHApiError && isBankExperienceEndpointUnavailable(q.error)) return null;

  const rows = q.data?.schedule ?? [];

  if (q.isLoading || offerLoading) {
    return (
      <div className="ch-card p-4 text-sm text-forgeGray-500" data-testid="amortization-loading">
        Cargando tabla de amortización…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="ch-card p-4 text-sm text-forgeGray-500" data-testid="amortization-empty">
        Tabla de pagos no disponible para esta solicitud.
      </div>
    );
  }

  return (
    <div className="ch-card overflow-hidden p-0" data-testid="amortization-table">
      <div className="border-b border-forgeGray-100 px-4 py-3">
        <h3 className="ch-serif" style={{ margin: 0, fontSize: 16 }}>
          Tabla de amortización
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ch-text-3)" }}>
          Proyección de pagos según términos aprobados o solicitados.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--ch-surface-2)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Cuota</th>
              <th className="px-3 py-2">Capital</th>
              <th className="px-3 py-2">Interés</th>
              <th className="px-3 py-2">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.period} className="border-t border-forgeGray-100" data-testid={`amort-row-${row.period}`}>
                <td className="px-3 py-2 ch-mono">{row.period}</td>
                <td className="px-3 py-2">{formatDate(row.due_date)}</td>
                <td className="px-3 py-2 ch-mono">{chMoneyExact(row.payment)}</td>
                <td className="px-3 py-2 ch-mono">{chMoneyExact(row.principal)}</td>
                <td className="px-3 py-2 ch-mono">{chMoneyExact(row.interest)}</td>
                <td className="px-3 py-2 ch-mono">{chMoneyExact(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
