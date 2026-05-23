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

function payloadPm(parts: DashboardCombined): Record<string, unknown> {
  return {
    role_context: "pm",
    emphasis: ["plazos entregables", "dependencias WBS"],
    portfolio: parts.portfolio,
    backlog_signal: parts.list,
  };
}

/** CAP-93 · PM — mismo fetch base, texto operativo portfolio. */
export function DashboardPmClient() {
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
      setData(payloadPm({ portfolio: pf, list: lst }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("No se cargó dashboard PM"));
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
        <ProyectosDisclaimerBanner variant="compact" />
        <ProyectosSpecialistReviewBanner variant="compact" />
      </div>
      <Link href="/proyectos" className="text-sm font-medium text-violet-600 underline dark:text-violet-400">
        ← Proyectos
      </Link>
      <ProyectosDataViewer
        title="Dashboard Project Manager"
        subtitle="Orientado a entrega; enlaza workspaces individuales para WBS/Riesgos."
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
