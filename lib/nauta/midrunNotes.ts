import { coerceOutputText, coerceString } from "@/lib/nauta/safeValues";

export interface RunReportNoteInput {
  status: string;
  failureCause: string | null;
  outcomeCategory: string | null;
  output: string | null | undefined;
}

export function isRedirectedParentRun(
  failureCause: string | null,
  outcomeCategory: string | null,
): boolean {
  const fc = coerceString(failureCause).toLowerCase();
  const oc = coerceString(outcomeCategory).toLowerCase();
  return fc.includes("redirect") || oc.includes("redirect");
}

export function resolveRunReportNotes(input: RunReportNoteInput): {
  showPartialStop: boolean;
  showStoppedNoOutput: boolean;
  showRedirectedParent: boolean;
} {
  const outputText = coerceOutputText(input.output) ?? "";
  const failure = coerceString(input.failureCause).toLowerCase();
  const outcome = coerceString(input.outcomeCategory).toLowerCase();
  const stoppedByUser = failure.includes("stopped_by_user");
  const partialOutcome = outcome === "completed_partial";

  return {
    showPartialStop: partialOutcome || (stoppedByUser && Boolean(outputText)),
    showStoppedNoOutput: stoppedByUser && !outputText && input.status === "failed",
    showRedirectedParent: isRedirectedParentRun(input.failureCause, input.outcomeCategory),
  };
}
