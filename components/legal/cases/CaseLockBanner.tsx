"use client";

import type { CaseLock } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseLockBanner({
  lock,
  onRelease,
}: {
  lock?: CaseLock | null;
  onRelease?: () => void;
}) {
  const m = useLegalCasesMessages();
  if (!lock) return null;
  const userLabel = lock.locked_by;
  const text =
    lock.lock_scope === "hard"
      ? m.lock.hard_blocked.replace("{user}", userLabel)
      : m.lock.soft_warning.replace("{user}", userLabel);
  const tone =
    lock.lock_scope === "hard"
      ? "border-forgeDanger-500 bg-forgeDanger-50 text-forgeDanger-900"
      : "border-forgeWarning-500 bg-forgeWarning-50 text-forgeInk-900";
  return (
    <div
      role="status"
      className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-forge-sm border px-4 py-3 text-sm ${tone}`}
    >
      <span>{text}</span>
      {onRelease ? (
        <button
          type="button"
          className="rounded-forge-sm bg-forgeSurface-card px-3 py-1 text-xs font-medium text-forgeBrand-700 ring-1 ring-forgeBrand-400 hover:bg-forgeBrand-50"
          onClick={onRelease}
        >
          {m.lock.release_button}
        </button>
      ) : null}
    </div>
  );
}
