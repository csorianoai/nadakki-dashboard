"use client";

import { useDocumentVersions } from "@/hooks/legal/useDocumentVersions";
import type { DocumentVersion } from "@/hooks/legal/useDocumentVersions";

type Props = {
  tenantId: string;
  caseId: string;
  documentId: string;
};

export function DocumentVersionsList({ tenantId, caseId, documentId }: Props) {
  const { data, isLoading, isError } = useDocumentVersions(tenantId, caseId, documentId);

  if (isLoading) {
    return <p className="text-sm text-forgeGray-500">Cargando versiones…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-forgeDanger-700" role="alert">
        No se pudieron cargar las versiones.
      </p>
    );
  }

  const versions: DocumentVersion[] = (data?.versions ?? []) as DocumentVersion[];

  if (versions.length === 0) {
    return (
      <p className="text-sm text-forgeGray-500" data-testid="no-versions">
        Sin historial de versiones.
      </p>
    );
  }

  return (
    <div data-testid="document-versions-list">
      <h3 className="mb-2 text-sm font-semibold text-forgeGray-900">
        Historial de versiones ({versions.length})
      </h3>
      <ul className="space-y-2">
        {versions.map((v) => {
          const dateStr = v.created_at
            ? new Date(v.created_at).toLocaleString("es-DO")
            : "—";
          return (
            <li
              key={v.version_id}
              className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-forgeGray-900">
                  v{v.version_number}
                </span>
                <span className="text-xs text-forgeGray-500">{dateStr}</span>
              </div>
              {v.reason && (
                <p className="mt-1 text-xs text-forgeGray-600">{v.reason}</p>
              )}
              {v.created_by && (
                <p className="mt-0.5 text-xs text-forgeGray-400">
                  Por: {v.created_by}
                </p>
              )}
              <p className="mt-1 font-mono text-xs text-forgeGray-400">
                {v.content_hash.slice(0, 12)}…
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
