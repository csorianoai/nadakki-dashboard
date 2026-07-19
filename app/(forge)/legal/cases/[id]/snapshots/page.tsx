"use client";

import { use, useState } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useCaseSnapshots } from "@/hooks/legal/useCaseSnapshots";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseSnapshotsList } from "@/components/legal/cases/CaseSnapshotsList";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export default function LegalCaseSnapshotsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const m = useLegalCasesMessages();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error } = useLegalCase(effectiveTenantId, id);
  const { data: sn, refetch, createSnapshot, creating } = useCaseSnapshots(effectiveTenantId, id);
  const [msg, setMsg] = useState<string | null>(null);

  if (!tenantHydrated) return <p className="text-sm text-forgeGray-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (isLoading || error || !c) {
    return <p className="text-sm text-forgeGray-500">{isLoading ? "Cargando…" : "Error"}</p>;
  }

  const snapshots = sn?.snapshots ?? [];

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <CaseDetailHeader legalCase={c} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={creating}
          className="rounded-forge-sm bg-forgeBrand-600 px-3 py-2 text-sm font-medium text-forgeGray-50 disabled:opacity-50"
          onClick={async () => {
            setMsg(null);
            try {
              await createSnapshot({ snapshot_reason: "manual", notes: "Versión manual desde portal" });
              void refetch();
            } catch {
              setMsg("No se pudo crear la versión");
            }
          }}
        >
          {m.snapshots.create_manual}
        </button>
      </div>
      {msg ? (
        <p className="text-sm text-forgeDanger-700" role="alert">
          {msg}
        </p>
      ) : null}
      <CaseSnapshotsList tenantId={effectiveTenantId} caseId={id} snapshots={snapshots} />
    </main>
  );
}
