"use client";

import {
  AI_UNAVAILABLE_TITLE,
  aiUnavailableText,
  type AiUnavailableReason,
} from "@/lib/legal/llm-availability";

/** DASH-LEGAL L2c: en lugar del análisis, sin veredicto, riesgo, confianza ni citas. */
export function AiUnavailableNotice({ reason, avisoMock }: { reason: AiUnavailableReason; avisoMock?: string }) {
  return (
    <div
      role="status"
      data-testid="ai-unavailable"
      className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <p className="font-semibold">{AI_UNAVAILABLE_TITLE}</p>
      <p className="mt-1">{aiUnavailableText(reason, avisoMock)}</p>
    </div>
  );
}
