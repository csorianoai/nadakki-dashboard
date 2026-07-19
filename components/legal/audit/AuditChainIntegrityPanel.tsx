"use client";

import { useState } from "react";
import { fetchAuditChainVerification, fetchSnapshotVerify } from "@/lib/legal/cases/legal-cases-api";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";

type VerifyOutcome =
  | { kind: "ok"; label: string; detail?: string }
  | { kind: "error"; error: unknown; defectId: string };

export function AuditChainIntegrityPanel({
  tenantId,
  caseId,
}: {
  tenantId: string;
  caseId: string;
}) {
  const [auditOutcome, setAuditOutcome] = useState<VerifyOutcome | null>(null);
  const [snapOutcome, setSnapOutcome] = useState<VerifyOutcome | null>(null);
  const [busy, setBusy] = useState<"audit" | "snap" | null>(null);

  const runAuditChain = async () => {
    setBusy("audit");
    setAuditOutcome(null);
    try {
      const raw = await fetchAuditChainVerification(tenantId, caseId);
      setAuditOutcome({
        kind: "ok",
        label: "Cadena de auditoría — respuesta recibida",
        detail: JSON.stringify(raw, null, 2),
      });
    } catch (e) {
      setAuditOutcome({ kind: "error", error: e, defectId: "BD-006" });
    } finally {
      setBusy(null);
    }
  };

  const runSnapshotChain = async () => {
    setBusy("snap");
    setSnapOutcome(null);
    try {
      const raw = await fetchSnapshotVerify(tenantId, caseId);
      setSnapOutcome({
        kind: "ok",
        label: "Cadena de snapshots — íntegra",
        detail: JSON.stringify(raw, null, 2),
      });
    } catch (e) {
      setSnapOutcome({ kind: "error", error: e, defectId: "BD-003" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-100">Verificación de integridad de cadena</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Expediente <code className="font-mono text-zinc-400">{caseId}</code>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          onClick={() => void runAuditChain()}
        >
          {busy === "audit" ? "Verificando…" : "audit_chain_verification"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          className="rounded-lg ring-1 ring-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 disabled:opacity-50"
          onClick={() => void runSnapshotChain()}
        >
          {busy === "snap" ? "Verificando…" : "snapshots/verify (fallback)"}
        </button>
      </div>
      {auditOutcome?.kind === "ok" ? (
        <p className="mt-3 text-sm text-emerald-400" role="status">
          {auditOutcome.label}
        </p>
      ) : null}
      {auditOutcome?.kind === "error" ? (
        <div className="mt-3">
          <LegalApiErrorPanel
            title="audit_chain_verification no disponible"
            error={auditOutcome.error}
            defectId={auditOutcome.defectId}
          />
        </div>
      ) : null}
      {snapOutcome?.kind === "ok" ? (
        <details className="mt-3 text-xs text-zinc-400">
          <summary className="cursor-pointer text-emerald-400">Detalle snapshots/verify</summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-zinc-950 p-2">{snapOutcome.detail}</pre>
        </details>
      ) : null}
      {snapOutcome?.kind === "error" ? (
        <div className="mt-3">
          <LegalApiErrorPanel
            title="snapshots/verify — defecto de enrutamiento backend"
            error={snapOutcome.error}
            defectId={snapOutcome.defectId}
          />
        </div>
      ) : null}
    </section>
  );
}
