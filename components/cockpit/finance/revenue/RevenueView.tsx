"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchFinanceKpis, fetchMrrByCore } from "@/lib/cockpit/api/financeRevenue";
import { CockpitErrorBoundary } from "@/lib/cockpit/components/ErrorBoundary";
import { useCockpit } from "@/lib/cockpit/context";
import { longDateEsDO } from "@/lib/cockpit/format";
import { KpiRow } from "./KpiRow";
import { MrrByCoreBar } from "./MrrByCoreBar";
import { TenantsFinancialsTable } from "./TenantsFinancialsTable";

export function RevenueView() {
  const { locale, currency } = useCockpit();
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof fetchFinanceKpis>> | null>(null);
  const [mrr, setMrr] = useState<Awaited<ReturnType<typeof fetchMrrByCore>> | null>(null);

  const load = useCallback(async () => {
    const [k, m] = await Promise.all([fetchFinanceKpis(), fetchMrrByCore()]);
    setKpis(k);
    setMrr(m);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const headerDemo = (kpis?.isDemo || mrr?.isDemo) ?? false;

  return (
    <div className="space-y-6" data-testid="finance-revenue-view">
      <header>
        <h1 className="text-[32px] font-semibold">Ingresos</h1>
        <p className="mt-1 text-cockpit-muted">
          MRR, ARR y economía por tenant · {longDateEsDO()}
          {headerDemo ? (
            <span className="ml-2 inline-block align-middle">
              <DataTruthBadge level="DEMO" />
            </span>
          ) : null}
        </p>
      </header>

      <CockpitErrorBoundary title="KPIs de ingresos">
        {kpis ? <KpiRow data={kpis.data} isDemo={kpis.isDemo} locale={locale} currency={currency} /> : null}
      </CockpitErrorBoundary>

      <CockpitErrorBoundary title="MRR por core">
        {mrr ? (
          <MrrByCoreBar cores={mrr.data.cores ?? []} isDemo={mrr.isDemo} locale={locale} currency={currency} />
        ) : null}
      </CockpitErrorBoundary>

      <CockpitErrorBoundary title="Tenants">
        <TenantsFinancialsTable locale={locale} currency={currency} />
      </CockpitErrorBoundary>
    </div>
  );
}
