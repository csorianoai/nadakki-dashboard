"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CaseSnapshot } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseSnapshotsList({ caseId, snapshots }: { caseId: string; snapshots: CaseSnapshot[] }) {
  const m = useLegalCasesMessages();
  const [chainOk, setChainOk] = useState<boolean | null>(null);

  const ordered = useMemo(
    () => [...snapshots].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [snapshots]
  );

  const verify = () => {
    if (ordered.length === 0) {
      setChainOk(true);
      return;
    }
    const ok = ordered.every((s) => Boolean(s.chained_hash && String(s.chained_hash).length > 8));
    setChainOk(ok);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-forgeInk-900">{m.snapshots.title}</h2>
        <button type="button" className="text-xs font-medium text-forgeBrand-700 hover:underline" onClick={verify}>
          {m.snapshots.verify_chain}
        </button>
      </div>
      {chainOk !== null ? (
        <p className={`mb-3 text-sm ${chainOk ? "text-forgeSuccess-700" : "text-forgeDanger-700"}`} role="status">
          {chainOk ? m.snapshots.chain_valid : m.snapshots.chain_broken}
        </p>
      ) : null}
      {!ordered.length ? (
        <p className="text-sm text-forgeInk-500">{m.snapshots.none}</p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((s) => (
            <li key={s.snapshot_id} className="rounded-forge-md border border-forgeInk-200 p-3 text-sm">
              <p className="font-medium text-forgeInk-900">{s.snapshot_reason ?? "—"}</p>
              <p className="text-xs text-forgeInk-500">{new Date(s.created_at).toLocaleString("es-DO")}</p>
              <Link href={`/legal/cases/${caseId}/snapshots?snapshot=${s.snapshot_id}`} className="mt-1 inline-block text-xs font-medium text-forgeBrand-700">
                {m.snapshots.view_diff}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
