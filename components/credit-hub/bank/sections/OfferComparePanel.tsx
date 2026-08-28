"use client";

import { useQuery } from "@tanstack/react-query";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getOfferCompare,
  isBankExperienceEndpointUnavailable,
} from "@/lib/credit-hub/api/bankExperienceClient";
import { chMoneyExact } from "@/lib/credit-hub/ch-base";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { normalizeOfferCompareRows } from "@/lib/credit-hub/bank/offer-compare";

export function OfferComparePanel({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();

  const q = useQuery({
    queryKey: ["offer-compare", apiTenantId, applicationId],
    queryFn: () => getOfferCompare({ tenantId: apiTenantId!, applicationId }),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (q.error instanceof CHApiError && isBankExperienceEndpointUnavailable(q.error)) return null;

  const rows = normalizeOfferCompareRows(q.data ?? {});

  if (q.isLoading) {
    return (
      <div className="ch-card p-4 text-sm text-forgeGray-500" data-testid="offer-compare-loading">
        Cargando comparador de ofertas…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="ch-card p-4 text-sm text-forgeGray-500" data-testid="offer-compare-empty">
        Sin ofertas comparables en este expediente.
      </div>
    );
  }

  return (
    <div className="ch-card overflow-hidden p-0" data-testid="offer-compare-panel">
      <div className="border-b border-forgeGray-100 px-4 py-3">
        <h3 className="ch-serif" style={{ margin: 0, fontSize: 16 }}>
          Comparador de ofertas
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ch-text-3)" }}>
          Vista lado a lado de respuestas multi-banco.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ background: "var(--ch-surface-2)", fontSize: 11, textTransform: "uppercase" }}>
              <th className="px-3 py-2">Banco</th>
              <th className="px-3 py-2">Monto</th>
              <th className="px-3 py-2">Tasa</th>
              <th className="px-3 py-2">Plazo</th>
              <th className="px-3 py-2">Cuota</th>
              <th className="px-3 py-2">Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.lender_code}
                className="border-t border-forgeGray-100"
                data-testid={`compare-row-${row.lender_code}`}
                style={row.is_best ? { background: "var(--ch-success-soft)" } : undefined}
              >
                <td className="px-3 py-2 font-medium">
                  {row.lender_display_name ?? row.lender_code}
                  {row.is_best ? (
                    <span className="ml-2 text-[10px] font-bold uppercase" style={{ color: "var(--ch-success-text)" }}>
                      Mejor
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 ch-mono">{row.amount != null ? chMoneyExact(row.amount) : "—"}</td>
                <td className="px-3 py-2 ch-mono">{row.rate_apr != null ? `${row.rate_apr}%` : "—"}</td>
                <td className="px-3 py-2 ch-mono">{row.term_months != null ? `${row.term_months}m` : "—"}</td>
                <td className="px-3 py-2 ch-mono">{row.monthly_payment != null ? chMoneyExact(row.monthly_payment) : "—"}</td>
                <td className="px-3 py-2 ch-mono">{row.rank ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
