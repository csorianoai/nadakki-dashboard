"use client";

import type { GoogleAdsPreflightResult } from "@/lib/api/googleAdsPreflight";

interface Props {
  result: GoogleAdsPreflightResult | null;
  onClose: () => void;
  onContinue: () => void;
}

const CONFIG = {
  allowed: {
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    title: "Ready to Execute",
    canContinue: true,
    ctaLabel: "Continue",
  },
  proposal_only: {
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    title: "Will be sent for approval",
    canContinue: true,
    ctaLabel: "Continue as Proposal",
  },
  blocked: {
    color: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    title: "Action Blocked",
    canContinue: false,
    ctaLabel: "",
  },
  not_ready: {
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    title: "Not Ready",
    canContinue: false,
    ctaLabel: "",
  },
} as const;

export default function PreflightResultModal({ result, onClose, onContinue }: Props) {
  if (!result) return null;
  const ui = CONFIG[result.status] ?? CONFIG.blocked;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div
        className={`rounded-xl border w-full max-w-lg p-6 ${ui.border} ${ui.bg}`}
        style={{ backgroundColor: "rgba(15, 20, 40, 0.97)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${ui.color}`}>{ui.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4 font-mono">action: {result.action_key}</p>
        {(result.reasons?.length ?? 0) > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Reasons</p>
            <ul className="space-y-1">
              {result.reasons.map((r, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-slate-500">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(result.required_fixes?.length ?? 0) > 0 && (
          <div className="mb-4">
            <p className="text-xs text-amber-500 uppercase tracking-wider mb-2">Required fixes</p>
            <ul className="space-y-1">
              {result.required_fixes.map((r, i) => (
                <li key={i} className="text-sm text-amber-300 flex gap-2">
                  <span className="text-amber-600">!</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.next_step ? <p className="text-xs text-slate-500 italic mb-4">{result.next_step}</p> : null}
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-700/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {ui.canContinue && (
            <button
              type="button"
              onClick={() => {
                onContinue();
                onClose();
              }}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              {ui.ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
