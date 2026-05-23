"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getPortafolio, listProyectos } from "@/app/hooks/useProyectos";
import { ProyectosDisclaimerBanner } from "@/components/proyectos/ProyectosDisclaimerBanner";
import { ProyectosSpecialistReviewBanner } from "@/components/proyectos/ProyectosSpecialistReviewBanner";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { useTenant } from "@/contexts/TenantContext";

interface DashboardCombined {
  portfolio: unknown | null;
  list: unknown | null;
}

function payloadInvestor(parts: DashboardCombined): Record<string, unknown> {
  return {
    role_context: "inversionista",
    disclosures: ["usar disclaimers institucionales"],
    valuation_inputs: parts.portfolio,
    proyectos_outline: parts.list,
  };
}

/** CAP-94 · Inversionistas — mismo fetch base hasta dashboard dedicado riesgos/ROI. */
export function DashboardInvestorClient() {
  const { tenantId } = useTenant();
  const tid = (tenantId ?? "").trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      const [pf, lst] = await Promise.all([
        getPortafolio(tid).catch(() => null),
        listProyectos(tid),
      ]);
      setData(payloadInvestor({ portfolio: pf, list: lst }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("No se cargó dashboard inversionista"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-2">
        <ProyectosDisclaimerBanner />
        <ProyectosSpecialistReviewBanner />
      </div>
      <Link href="/proyectos" className="text-sm font-medium text-violet-600 underline dark:text-violet-400">
        ← Proyectos
      </Link>
      <ProyectosDataViewer
        title="Dashboard inversionista"
        subtitle="Portfolio + cartera proyectos hasta endpoints específicos cap-table / IRR."
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
