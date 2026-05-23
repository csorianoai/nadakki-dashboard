"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getEscenarios } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { ProyectosWorkspaceNav } from "@/components/proyectos/ProyectosWorkspaceNav";
import { useTenant } from "@/contexts/TenantContext";

export function EscenariosClient({ proyectoId }: { proyectoId: string }) {
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
      setData(await getEscenarios(tid, proyectoId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Fallo al cargar escenarios"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <Link href="/proyectos" className="text-sm font-medium text-violet-600 underline dark:text-violet-400">
        ← Listado de proyectos
      </Link>
      <ProyectosWorkspaceNav proyectoId={proyectoId} />
      <ProyectosDataViewer
        title="Escenarios"
        subtitle={`Proyecto · ${proyectoId} · GET /api/v1/proyectos/{id}/escenarios`}
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
