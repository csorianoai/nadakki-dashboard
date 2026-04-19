"use client";

import type { GoogleAdsPreflightResult } from "@/lib/api/googleAdsPreflight";

interface Props {
  result: GoogleAdsPreflightResult | null;
  onClose: () => void;
  onContinue: () => void;
}

const CONFIG = {
  allowed: { color: "text-emerald-400", bg: "border-emerald-500/30", title: "Ready to Execute" },
  proposal_only: { color: "text-blue-400", bg: "border-blue-500/30", title: "Will be sent for approval" },
  blocked: { color: "text-rose-400", bg: "border-rose-500/30", title: "Action Blocked" },
  not_ready: { color: "text-amber-400", bg: "border-amber-500/30", title: "Not Ready" },
} as const;

export default function PreflightResultModal({ result, onClose, onContinue }: Props) {
  if (!result) return null;
  const ui = CONFIG[result.status] ?? CONFIG.blocked;
  const canContinue = result.status === "allowed" || result.status === "proposal_only";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`bg-slate-900 border rounded-xl w-full max-w-lg p-6 ${ui.bg}`}>
        <h2 className={`text-lg font-semibold mb-1 ${ui.color}`}>{ui.title}</h2>
        <p className="text-xs text-slate-400 mb-4">
          Action: <span className="font-mono">{result.action_key}</span>
        </p>

        {(result.reasons?.length ?? 0) > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Reasons</p>
            <ul className="space-y-1">
              {result.reasons.map((r, i) => (
                <li key={i} className="text-sm text-slate-300">
                  • {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(result.required_fixes?.length ?? 0) > 0 && (
          <div className="mb-4">
            <p className="text-xs text-amber-500 mb-1 uppercase tracking-wide">Required fixes</p>
            <ul className="space-y-1">
              {result.required_fixes.map((r, i) => (
                <li key={i} className="text-sm text-amber-300">
                  • {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.next_step ? (
          <p className="text-xs text-slate-400 mb-4 italic">{result.next_step}</p>
        ) : null}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {canContinue && (
            <button
              type="button"
              onClick={() => {
                onContinue();
                onClose();
              }}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              {result.status === "proposal_only" ? "Continue as Proposal" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
