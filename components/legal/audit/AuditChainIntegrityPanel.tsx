"use client";

import { useState } from "react";
import { fetchAuditChainVerification, fetchSnapshotVerify } from "@/lib/legal/cases/legal-cases-api";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

type VerifyOutcome =
  | { kind: "ok"; label: string; detail?: string }
  | { kind: "error"; error: unknown };

function chainIntegrityLabel(
  m: ReturnType<typeof useLegalCasesMessages>,
  raw: unknown,
): { label: string; ok: boolean; detail?: string } {
  if (raw && typeof raw === "object" && "chain_integrity" in raw) {
    const integrity = String((raw as { chain_integrity?: string }).chain_integrity ?? "").toUpperCase();
    const valid = integrity === "VALID" || integrity === "INTEGRA";
    return {
      label: valid ? m.audit.chain_valid : m.audit.chain_invalid,
      ok: valid,
      detail: JSON.stringify(raw, null, 2),
    };
  }
  return { label: m.audit.chain_response_received, ok: true, detail: JSON.stringify(raw, null, 2) };
}

export function AuditChainIntegrityPanel({
  tenantId,
  caseId,
}: {
  tenantId: string;
  caseId: string;
}) {
  const m = useLegalCasesMessages();
  const [auditOutcome, setAuditOutcome] = useState<VerifyOutcome | null>(null);
  const [snapOutcome, setSnapOutcome] = useState<VerifyOutcome | null>(null);
  const [busy, setBusy] = useState<"audit" | "snap" | null>(null);

  const runAuditChain = async () => {
    setBusy("audit");
    setAuditOutcome(null);
    try {
      const raw = await fetchAuditChainVerification(tenantId, caseId);
      const parsed = chainIntegrityLabel(m, raw);
      setAuditOutcome({ kind: "ok", label: parsed.label, detail: parsed.detail });
    } catch (e) {
      setAuditOutcome({ kind: "error", error: e });
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
        label: m.audit.snapshot_chain_valid,
        detail: JSON.stringify(raw, null, 2),
      });
    } catch (e) {
      setSnapOutcome({ kind: "error", error: e });
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
          {busy === "audit" ? "Verificando…" : m.audit.chain_verify_button}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          className="rounded-lg ring-1 ring-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 disabled:opacity-50"
          onClick={() => void runSnapshotChain()}
        >
          {busy === "snap" ? "Verificando…" : m.audit.snapshot_verify_fallback}
        </button>
      </div>
      {auditOutcome?.kind === "ok" ? (
        <p className="mt-3 text-sm text-emerald-400" role="status">
          {auditOutcome.label}
        </p>
      ) : null}
      {auditOutcome?.kind === "error" ? (
        <div className="mt-3">
          <LegalApiErrorPanel title={m.audit.chain_unavailable} error={auditOutcome.error} />
        </div>
      ) : null}
      {snapOutcome?.kind === "ok" ? (
        <details className="mt-3 text-xs text-zinc-400">
          <summary className="cursor-pointer text-emerald-400">{m.audit.snapshot_verify_detail}</summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-zinc-950 p-2">{snapOutcome.detail}</pre>
        </details>
      ) : null}
      {snapOutcome?.kind === "error" ? (
        <div className="mt-3">
          <LegalApiErrorPanel title={m.audit.snapshot_unavailable} error={snapOutcome.error} />
        </div>
      ) : null}
    </section>
  );
}
