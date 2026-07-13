"use client";

import { useCallback, useEffect, useState } from "react";
import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";
import { FinanceKpiGrid } from "@/components/cockpit/finance/revenue/FinanceKpiGrid";
import { MrrByCoreChart } from "@/components/cockpit/finance/revenue/MrrByCoreChart";
import { TenantFinancialsTable } from "@/components/cockpit/finance/revenue/TenantFinancialsTable";
import {
  fetchFinanceKpisPanel,
  fetchMrrByCorePanel,
  fetchTenantFinancialsPanel,
} from "@/lib/cockpit/api/finance";
import { useCockpit } from "@/lib/cockpit/context";
import type {
  FinanceKpisEnvelope,
  MrrByCoreEnvelope,
  TenantFinancialsListEnvelope,
} from "@/lib/cockpit/finance-v3/contracts/finance";

export function RevenueView() {
  const { locale, currency } = useCockpit();
  const [kpis, setKpis] = useState<FinanceKpisEnvelope | null>(null);
  const [mrrByCore, setMrrByCore] = useState<MrrByCoreEnvelope | null>(null);
  const [tenants, setTenants] = useState<TenantFinancialsListEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, m, t] = await Promise.all([
        fetchFinanceKpisPanel(),
        fetchMrrByCorePanel(),
        fetchTenantFinancialsPanel({ limit: 50 }),
      ]);
      setKpis(k.envelope);
      setMrrByCore(m.envelope);
      setTenants(t.envelope);
      const errs = [k.error, m.error, t.error].filter(Boolean);
      if (errs.length) setError(errs.join(" · "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando ingresos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-cockpit-text">Finanzas</h1>
        <p className="text-sm text-cockpit-muted">Ingresos y suscripciones de la red</p>
      </header>
      <FinanceSubNav />
      {error ? (
        <p className="rounded-lg border border-cockpit-warn/40 bg-cockpit-warn/10 px-3 py-2 text-xs text-cockpit-warn">
          {error}
        </p>
      ) : null}
      {loading || !kpis || !mrrByCore || !tenants ? (
        <p className="text-sm text-cockpit-muted">Cargando ingresos…</p>
      ) : (
        <>
          <FinanceKpiGrid envelope={kpis} locale={locale} currency={currency} />
          <MrrByCoreChart envelope={mrrByCore} locale={locale} currency={currency} />
          <TenantFinancialsTable envelope={tenants} locale={locale} currency={currency} />
        </>
      )}
    </div>
  );
}
