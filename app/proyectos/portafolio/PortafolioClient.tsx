"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getPortafolio } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { useTenant } from "@/contexts/TenantContext";

/** CAP-91 — Vista agregada de portafolio. */
export function PortafolioClient() {
  const { tenantId } = useTenant();
  const tid = (tenantId ?? "").trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      const out = await getPortafolio(tid);
      setData(out);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Portafolio no disponible"));
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
      <Link href="/proyectos" className="text-sm font-medium text-violet-600 underline dark:text-violet-400">
        ← Volver al panel Projects
      </Link>
      <ProyectosDataViewer
        title="Portafolio de proyectos"
        subtitle="GET /api/v1/proyectos/portafolio · visión tenant-scoped según políticas IAM del core"
        loading={loading}
        error={error}
        data={data}
        emptyMessage="Sin datos portafolio aún para este tenant (semilla IAM o filtros)."
        onRetry={() => void load()}
      />
    </div>
  );
}
