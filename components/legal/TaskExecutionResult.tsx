"use client";

import { AttorneyReviewBadge } from "@/components/legal/AttorneyReviewBadge";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";

type Props = {
  data: Record<string, unknown> | null;
};

export function TaskExecutionResult({ data }: Props) {
  const m = useLegalHomeMessages();
  return (
    <div className="mt-4 space-y-3 rounded-forge-md border border-forgeInk-200 bg-forgeSurface-sunken p-4">
      <p className="text-forge-sm font-semibold text-forge-text">{m.sealed_output_label}</p>
      <pre className="max-h-64 overflow-auto rounded-forge-sm bg-forgeSurface-card p-3 text-xs text-forge-text">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
      <AttorneyReviewBadge variant="full" />
    </div>
  );
}
