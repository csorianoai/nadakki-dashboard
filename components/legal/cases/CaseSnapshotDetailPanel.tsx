"use client";

import { useEffect, useState } from "react";
import { fetchSnapshotDetail } from "@/lib/legal/cases/legal-cases-api";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";

export function CaseSnapshotDetailPanel({
  tenantId,
  caseId,
  snapshotId,
  onClose,
}: {
  tenantId: string;
  caseId: string;
  snapshotId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchSnapshotDetail(tenantId, caseId, snapshotId)
      .then((raw) => {
        if (!cancelled) setData(raw);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, caseId, snapshotId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forgeGray-900/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-6 shadow-forge-md">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-forgeGray-900">Detalle de versión</h2>
          <button type="button" className="text-sm text-forgeBrand-700" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <p className="mt-1 font-mono text-xs text-forgeGray-500">{snapshotId}</p>
        {loading ? <p className="mt-4 text-sm text-forgeGray-500">Cargando…</p> : null}
        {error ? (
          <div className="mt-4">
            <LegalApiErrorPanel title="No se pudo cargar el snapshot" error={error} />
          </div>
        ) : null}
        {data ? (
          <pre className="mt-4 max-h-[60vh] overflow-auto rounded-forge-sm bg-forgeGray-50 p-3 text-xs leading-snug">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
