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

function buildPayload(parts: DashboardCombined): Record<string, unknown> {
  return {
    role_context: "ceo",
    portfolio: parts.portfolio,
    projects_list: parts.list,
  };
}

/** CAP-92 — Dashboard CEO — misma fuente técnica, copy orientado a ejecutivo. */
export function DashboardCeoClient() {
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
      setData(buildPayload({ portfolio: pf, list: lst }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("No se cargó dashboard CEO"));
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
        <ProyectosSpecialistReviewBanner variant="compact" />
      </div>
      <Link href="/proyectos" className="text-sm font-medium text-violet-600 underline dark:text-violet-400">
        ← Proyectos
      </Link>
      <Link href="/proyectos/portafolio" className="block text-xs font-semibold text-gray-700 underline dark:text-gray-300">
        Ir a vista portafolio (CAP-91)
      </Link>
      <ProyectosDataViewer
        title="Dashboard ejecutivo · CEO"
        subtitle="Fusiona `/portafolio` + listado proyectos hasta que existan endpoints exclusivos rol-CEO."
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
