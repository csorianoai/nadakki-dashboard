"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getAuditTrailProject,
  verifyProyectosAuditTrail,
} from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { ProyectosWorkspaceNav } from "@/components/proyectos/ProyectosWorkspaceNav";
import { useTenant } from "@/contexts/TenantContext";

export function AuditProjectClient({ proyectoId }: { proyectoId: string }) {
  const { tenantId } = useTenant();
  const tid = (tenantId ?? "").trim();

  const [trailLoading, setTrailLoading] = useState(true);
  const [trailError, setTrailError] = useState<Error | null>(null);
  const [trailData, setTrailData] = useState<unknown | null>(null);

  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyData, setVerifyData] = useState<unknown | null>(undefined);
  const [verifyBanner, setVerifyBanner] = useState<string | null>(null);

  const loadTrail = useCallback(async () => {
    if (!tid) return;
    setTrailLoading(true);
    setTrailError(null);
    try {
      setTrailData(await getAuditTrailProject(tid, proyectoId));
      setVerifyBanner(null);
      setVerifyData(undefined);
    } catch (e) {
      setTrailError(e instanceof Error ? e : new Error("Fallo al cargar audit trail"));
      setTrailData(null);
    } finally {
      setTrailLoading(false);
    }
  }, [tid, proyectoId]);

  useEffect(() => {
    void loadTrail();
  }, [loadTrail]);

  const runVerify = async () => {
    if (!tid) return;
    setVerifyBusy(true);
    setVerifyBanner(null);
    try {
      const out = await verifyProyectosAuditTrail(tid, proyectoId);
      setVerifyData(out);
      if (out === null) {
        setVerifyBanner(
          "VERIFY no respondió por ninguna variante conocida (/audit/verify y /audit-trail/verify). Revisar OpenAPI vivo.",
        );
      }
    } catch (e) {
      setVerifyData(null);
      setVerifyBanner(e instanceof Error ? e.message : "Error en verify");
    } finally {
      setVerifyBusy(false);
    }
  };

  let verifyPreview = "";
  if (verifyData !== undefined && verifyData !== null) {
    try {
      verifyPreview = JSON.stringify(verifyData, null, 2);
    } catch {
      verifyPreview = String(verifyData);
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/proyectos" className="text-sm font-medium text-violet-600 underline dark:text-violet-400">
        ← Listado de proyectos
      </Link>
      <ProyectosWorkspaceNav proyectoId={proyectoId} />
      <ProyectosDataViewer
        title="Audit trail del proyecto"
        subtitle={`GET /api/v1/proyectos/{id}/audit-trail`}
        loading={trailLoading}
        error={trailError}
        data={trailData}
        onRetry={() => void loadTrail()}
      />

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950/60">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">VERIFY audit</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ejecuta comprobación de cadena/notarización según rutas esperadas por el gateway.
        </p>
        <button
          type="button"
          className="inline-flex min-h-10 items-center rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 dark:bg-violet-600 dark:hover:bg-violet-500"
          disabled={verifyBusy || !tid}
          onClick={() => void runVerify()}
        >
          {verifyBusy ? "Verificando…" : "Ejecutar VERIFY"}
        </button>
        {verifyBanner ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            {verifyBanner}
          </div>
        ) : null}
        {verifyBusy ? (
          <div className="animate-pulse h-24 rounded bg-gray-100 dark:bg-gray-800" aria-busy />
        ) : null}
        {!verifyBusy && verifyData !== undefined ? (
          verifyData === null ? null : (
            <pre className="max-h-64 overflow-auto rounded border border-gray-200 bg-slate-50 p-3 text-xs text-slate-800 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-100">
              {verifyPreview || "Sin cuerpo JSON"}
            </pre>
          )
        ) : null}
      </section>
    </div>
  );
}
