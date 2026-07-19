"use client";

import { useMemo, useState } from "react";
import type { CaseSnapshot } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { fetchSnapshotDiff, fetchSnapshotVerify } from "@/lib/legal/cases/legal-cases-api";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";
import { CaseSnapshotDetailPanel } from "@/components/legal/cases/CaseSnapshotDetailPanel";

export function CaseSnapshotsList({
  tenantId,
  caseId,
  snapshots,
}: {
  tenantId: string;
  caseId: string;
  snapshots: CaseSnapshot[];
}) {
  const m = useLegalCasesMessages();
  const [verifyError, setVerifyError] = useState<unknown>(null);
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);
  const [diffError, setDiffError] = useState<unknown>(null);
  const [diffPayload, setDiffPayload] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...snapshots].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [snapshots],
  );

  const verifyChain = async () => {
    setBusy(true);
    setVerifyError(null);
    setVerifyOk(null);
    try {
      await fetchSnapshotVerify(tenantId, caseId);
      setVerifyOk(true);
    } catch (e) {
      setVerifyError(e);
      setVerifyOk(false);
    } finally {
      setBusy(false);
    }
  };

  const viewDiff = async (a: string, b: string) => {
    setBusy(true);
    setDiffError(null);
    setDiffPayload(null);
    try {
      const raw = await fetchSnapshotDiff(tenantId, caseId, a, b);
      setDiffPayload(raw);
    } catch (e) {
      setDiffError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-forgeGray-900">{m.snapshots.title}</h2>
        <button
          type="button"
          disabled={busy}
          className="text-xs font-medium text-forgeBrand-700 hover:underline disabled:opacity-50"
          onClick={() => void verifyChain()}
        >
          {m.snapshots.verify_chain}
        </button>
      </div>
      {verifyOk === true ? (
        <p className="mb-3 text-sm text-forgeSuccess-700" role="status">
          {m.snapshots.chain_valid}
        </p>
      ) : null}
      {verifyError ? (
        <div className="mb-3">
          <LegalApiErrorPanel title="Verificación de cadena no disponible" error={verifyError} />
        </div>
      ) : null}
      {!ordered.length ? (
        <p className="text-sm text-forgeGray-500">{m.snapshots.none}</p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((s, idx) => (
            <li key={s.snapshot_id} className="rounded-forge-md border border-forgeGray-200 p-3 text-sm">
              <p className="font-medium text-forgeGray-900">{s.snapshot_reason ?? "—"}</p>
              <p className="text-xs text-forgeGray-500">{new Date(s.created_at).toLocaleString("es-DO")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-forgeBrand-700"
                  onClick={() => setDetailId(s.snapshot_id)}
                >
                  {m.snapshots.view_diff}
                </button>
                {idx < ordered.length - 1 ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="text-xs font-medium text-forgeBrand-700 underline disabled:opacity-50"
                    onClick={() => void viewDiff(s.snapshot_id, ordered[idx + 1]!.snapshot_id)}
                  >
                    {m.snapshots.diff_vs_previous}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {diffError ? (
        <div className="mt-3">
          <LegalApiErrorPanel title="Diff de snapshots no disponible" error={diffError} />
        </div>
      ) : null}
      {diffPayload ? (
        <details className="mt-3 rounded-forge-md border border-forgeGray-200 p-3 text-xs">
          <summary className="cursor-pointer font-medium">Diff (respuesta API)</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap">{JSON.stringify(diffPayload, null, 2)}</pre>
        </details>
      ) : null}
      {detailId ? (
        <CaseSnapshotDetailPanel
          tenantId={tenantId}
          caseId={caseId}
          snapshotId={detailId}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </div>
  );
}
