"use client";

export function CaseSubStateIndicator({ subState }: { subState?: string | null }) {
  if (!subState?.trim()) return null;
  return (
    <span className="mt-0.5 block text-xs text-forgeGray-500" data-testid="case-sub-state">
      {subState.replace(/_/g, " ")}
    </span>
  );
}
