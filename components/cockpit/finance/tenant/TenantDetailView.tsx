"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";
import { useCockpit } from "@/lib/cockpit/context";
import { fetchTenantOverview } from "@/lib/cockpit/api/tenant";
import { cockpitDataSourceToBadgeLevel } from "@/lib/cockpit/finance-v3/data-source";
import { formatCockpitInteger, formatCockpitMoney } from "@/lib/cockpit/finance-v3/format";
import type { TenantConsolidatedEnvelope } from "@/lib/cockpit/finance-v3/contracts/tenant";

type TenantDetailViewProps = {
  tenantRef: string;
};

export function TenantDetailView({ tenantRef }: TenantDetailViewProps) {
  const searchParams = useSearchParams();
  const highlightedCore = searchParams.get("highlighted_core");
  const { locale, currency } = useCockpit();
  const requestCountRef = useRef(0);

  const [envelope, setEnvelope] = useState<TenantConsolidatedEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    requestCountRef.current += 1;

    const result = await fetchTenantOverview(tenantRef);
    if (result.status === "not_found") {
      setNotFound(true);
      setEnvelope(null);
    } else if (result.status === "error") {
      setError(result.error);
      setEnvelope(null);
    } else {
      setEnvelope(result.envelope);
    }
    setLoading(false);
  }, [tenantRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const badge = envelope ? cockpitDataSourceToBadgeLevel(envelope.data_source) : "NONE";

  return (
    <div className="space-y-6" data-testid="finance-tenant-detail">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-cockpit-text">
            {envelope?.data.tenant_name ?? tenantRef}
          </h1>
          <p className="text-sm text-cockpit-muted">
            {envelope ? (
              <>
                <span className="font-mono">{envelope.data.tenant_slug}</span>
                {envelope.data.country_code ? ` · ${envelope.data.country_code}` : null}
                {envelope.data.plan_name ? ` · ${envelope.data.plan_name}` : null}
              </>
            ) : (
              "Cargando tenant…"
            )}
          </p>
        </div>
        <DataTruthBadge level={badge} onRetry={error ? load : undefined} />
      </header>

      <FinanceSubNav />

      {loading ? (
        <p className="text-sm text-cockpit-muted">Cargando vista consolidada…</p>
      ) : null}

      {notFound ? (
        <div
          className="rounded-xl border border-cockpit-border bg-cockpit-surface p-6 text-sm text-cockpit-muted"
          data-testid="tenant-not-found"
        >
          Tenant no encontrado: <code className="font-mono">{tenantRef}</code>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-cockpit-err" data-testid="tenant-load-error">
          {error}
        </p>
      ) : null}

      {envelope ? (
        <>
          <section
            className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4"
            data-testid="tenant-finance-block"
          >
            <h2 className="mb-3 text-sm font-semibold text-cockpit-text">Finanzas</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-cockpit-muted">MRR aportado</dt>
                <dd className="font-mono tabular-nums">
                  {formatCockpitMoney(
                    envelope.data.finance.mrr_contribution,
                    locale,
                    currency,
                    envelope.data_source,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-cockpit-muted">Plan</dt>
                <dd>{envelope.data.finance.plan_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-cockpit-muted">Estado suscripción</dt>
                <dd className="capitalize">{envelope.data.finance.subscription_status}</dd>
              </div>
              <div>
                <dt className="text-cockpit-muted">Próxima renovación</dt>
                <dd>
                  {envelope.data.finance.next_renewal_at
                    ? new Date(envelope.data.finance.next_renewal_at).toLocaleDateString(locale)
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section data-testid="tenant-core-cards">
            <h2 className="mb-3 text-sm font-semibold text-cockpit-text">Cores habilitados</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {envelope.data.cores_enabled.map((core) => {
                const highlighted = highlightedCore === core.core_code;
                const enabled = core.mrr_attributed != null;
                return (
                  <div
                    key={core.core_code}
                    data-testid={`tenant-core-card-${core.core_code}`}
                    className={`rounded-xl border bg-cockpit-surface p-4 ${
                      highlighted
                        ? "border-cockpit-accent ring-2 ring-cockpit-accent/30"
                        : "border-cockpit-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-cockpit-text">{core.display_name}</h3>
                      <span className="text-xs text-cockpit-muted">{core.core_code}</span>
                    </div>
                    <p className="mt-2 text-sm text-cockpit-muted">
                      {enabled ? (
                        <>
                          {formatCockpitInteger(core.users_count)} usuarios
                          {core.mrr_attributed != null
                            ? ` · MRR ${formatCockpitMoney(core.mrr_attributed, locale, currency, envelope.data_source)}`
                            : null}
                        </>
                      ) : (
                        "No habilitado"
                      )}
                    </p>
                    {core.families.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-cockpit-muted">
                        {core.families.map((f) => (
                          <li key={f.family}>
                            {f.family}: {formatCockpitInteger(f.count)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section
            className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4"
            data-testid="tenant-users-table"
          >
            <h2 className="mb-3 text-sm font-semibold text-cockpit-text">
              Usuarios ({formatCockpitInteger(envelope.data.users.length)})
            </h2>
            {envelope.data.users.length === 0 ? (
              <p className="text-sm text-cockpit-muted">Sin usuarios registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-cockpit-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Rol</th>
                      <th className="px-3 py-2 text-left">Familia</th>
                      <th className="px-3 py-2 text-left">Último acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envelope.data.users.map((u) => (
                      <tr key={u.user_id} className="border-t border-cockpit-border">
                        <td className="px-3 py-2 font-mono text-xs">{u.email_masked}</td>
                        <td className="px-3 py-2">{u.role_key}</td>
                        <td className="px-3 py-2">{u.professional_family ?? "—"}</td>
                        <td className="px-3 py-2">
                          {u.last_login_at
                            ? new Date(u.last_login_at).toLocaleDateString(locale)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}

      <div className="flex items-center gap-4 text-sm">
        <Link href="/cockpit/finance/matrix" className="text-cockpit-accent hover:underline">
          ← Volver a matriz
        </Link>
        <span className="text-cockpit-muted" data-testid="tenant-request-count">
          requests: {requestCountRef.current}
        </span>
      </div>
    </div>
  );
}
