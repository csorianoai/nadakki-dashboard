import type { NautaLiveViewStatus } from "@/lib/nauta/types";
import { coerceOutputText, coerceString } from "@/lib/nauta/safeValues";
import { S } from "@/lib/nauta/strings";

export type RunOutcomeVariant =
  | "none"
  | "completed_partial"
  | "failed_with_output"
  | "failed_without_output";

export type RunOutcomeVisualTone = "neutral" | "caution";

export interface RunOutcomeInput {
  status: NautaLiveViewStatus;
  outcomeCategory?: string | null;
  failureCause?: string | null;
  /** artifacts.output and/or root outcome_text — already merged when possible. */
  output?: string | null;
  lastStepSummary?: string | null;
}

export interface RunOutcomeModel {
  variant: RunOutcomeVariant;
  visualTone: RunOutcomeVisualTone;
  /** Primary headline — null for completed success. */
  headline: string | null;
  /** Secondary lines (causa, último paso) shown under headline in panel + .txt. */
  sublines: string[];
  /** Body when there is no output block (failed sin outcome_text). */
  emptyBody: string | null;
  outputText: string | null;
}

export function resolveRunOutcome(input: RunOutcomeInput): RunOutcomeModel {
  const outputText = coerceOutputText(input.output);
  const hasOutput = Boolean(outputText);
  const failureCause = coerceString(input.failureCause).trim();
  const lastStep = coerceString(input.lastStepSummary).trim();
  const outcomeCategory = coerceString(input.outcomeCategory).toLowerCase();
  const status = input.status;

  if (status === "completed" && outcomeCategory !== "completed_partial") {
    return {
      variant: "none",
      visualTone: "neutral",
      headline: null,
      sublines: [],
      emptyBody: null,
      outputText,
    };
  }

  if (outcomeCategory === "completed_partial") {
    return {
      variant: "completed_partial",
      visualTone: hasOutput ? "caution" : "neutral",
      headline: S.outcome.completedPartial,
      sublines: [],
      emptyBody: null,
      outputText,
    };
  }

  if (status === "failed" && hasOutput) {
    const sublines: string[] = [];
    if (failureCause) sublines.push(S.outcome.failureCause(failureCause));
    if (lastStep) sublines.push(S.outcome.lastStepRegistered(lastStep));
    return {
      variant: "failed_with_output",
      visualTone: "caution",
      headline: S.outcome.failedPartialWarning,
      sublines,
      emptyBody: null,
      outputText,
    };
  }

  if (status === "failed") {
    return {
      variant: "failed_without_output",
      visualTone: "caution",
      headline: null,
      sublines: [],
      emptyBody: S.outcome.failedNoResults(failureCause || S.outcome.unknownCause, lastStep),
      outputText: null,
    };
  }

  return {
    variant: "none",
    visualTone: "neutral",
    headline: null,
    sublines: [],
    emptyBody: null,
    outputText,
  };
}

/** Lines for the downloadable evidence .txt — shared with RunOutcomeHeader. */
export function formatRunOutcomeSection(model: RunOutcomeModel): string[] {
  const lines: string[] = [];
  if (model.headline) lines.push(model.headline);
  if (model.sublines.length) lines.push(...model.sublines);
  if (model.emptyBody && !model.outputText) lines.push(model.emptyBody);
  return lines;
}
