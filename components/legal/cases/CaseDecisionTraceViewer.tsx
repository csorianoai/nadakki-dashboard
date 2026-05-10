"use client";

export function CaseDecisionTraceViewer({ trace }: { trace: Record<string, unknown> }) {
  return (
    <pre
      className="mt-2 max-h-64 overflow-auto rounded-forge-sm bg-forgeGray-50 p-2 text-xs text-forgeGray-800"
      tabIndex={0}
    >
      {JSON.stringify(trace, null, 2)}
    </pre>
  );
}
