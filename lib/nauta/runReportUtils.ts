import type { NautaRunArtifacts } from "@/lib/nauta/types";
import type { NautaLiveViewStatus } from "@/lib/nauta/types";
import { formatRunOutcomeSection, resolveRunOutcome } from "@/lib/nauta/runOutcome";
import { S } from "@/lib/nauta/strings";
import {
  coerceFiniteNumber,
  coerceOptionalFiniteNumber,
  coerceOutputText,
  coerceString,
  coerceStringArray,
  logNautaViewError,
  safeFormatFixed,
  sanitizeRunArtifacts,
} from "@/lib/nauta/safeValues";

export interface RunReportInput {
  runId: string;
  status: NautaLiveViewStatus;
  taskName: string;
  taskInstruction?: string;
  durationSeconds: number;
  estimatedCostUsd: number;
  estimatedTokens: number;
  stepCount: number | null;
  failureCause: string | null;
  artifacts: NautaRunArtifacts | null;
  outcomeCategory?: string | null;
  /** ISO timestamp — client fallback when API omits completed_at. */
  completedAtIso: string;
  apiCompletedAt: string | null;
}

/** Fields expected on GET /api/v1/nauta/runs/{id} — report as GAP when absent. */
export function collectBackendGaps(input: RunReportInput): string[] {
  const gaps: string[] = [];
  const { artifacts, status, stepCount, apiCompletedAt } = input;

  if (apiCompletedAt == null) gaps.push("completed_at");

  if (stepCount == null) gaps.push("step_count");

  if (!artifacts) {
    gaps.push("artifacts");
    gaps.push("artifacts.output");
    gaps.push("outcome_text");
    return gaps;
  }

  const outputText = coerceOutputText(artifacts.output);
  if (!outputText) {
    gaps.push("artifacts.output");
    gaps.push("outcome_text");
  }

  if (status === "failed" && !coerceString(artifacts.lastStepSummary).trim()) {
    gaps.push("artifacts.lastStepSummary");
  }

  const recordings = coerceStringArray(artifacts.recordingUrls);
  if (!recordings.length) gaps.push("artifacts.recordingUrls");

  if (!artifacts.screenshotUrl) gaps.push("artifacts.screenshotUrl");

  return gaps;
}

/** Merge root outcome_text / last_step_summary with artifacts (GET #516). */
export function mergePollArtifacts(data: {
  artifacts?: unknown;
  outcome_text?: unknown;
  last_step_summary?: unknown;
}): NautaRunArtifacts | null {
  const base = sanitizeRunArtifacts(data.artifacts);
  const rootOutput = coerceOutputText(data.outcome_text);
  const rootLastStep =
    typeof data.last_step_summary === "string" && data.last_step_summary.trim()
      ? data.last_step_summary.trim()
      : null;

  const output = coerceOutputText(base?.output) ?? rootOutput;
  const lastStepSummary = base?.lastStepSummary ?? rootLastStep;
  const recordingUrls = base?.recordingUrls ?? [];
  const screenshotUrl = base?.screenshotUrl ?? null;

  if (!output && !lastStepSummary && !recordingUrls.length && !screenshotUrl) return null;
  return { recordingUrls, screenshotUrl, output, lastStepSummary };
}

export function buildRunReportDownloadText(
  input: RunReportInput,
  options?: { includeCostMetrics?: boolean },
): string {
  try {
    const includeCostMetrics = options?.includeCostMetrics === true;
    const duration = safeFormatFixed(input.durationSeconds, 1);
    const lines: string[] = [
      "=== NAUTA RUN EVIDENCE REPORT ===",
      `run_id: ${coerceString(input.runId, "unknown")}`,
      `timestamp: ${coerceString(input.completedAtIso, new Date().toISOString())}`,
      `status: ${coerceString(input.status)}`,
      `task_name: ${coerceString(input.taskName)}`,
    ];

    if (input.taskInstruction?.trim()) {
      lines.push("", "--- INSTRUCCIÓN ASIGNADA ---", input.taskInstruction.trim());
    }

    lines.push("", "--- MÉTRICAS ---", `duration_seconds: ${duration}`);

    if (includeCostMetrics) {
      lines.push(
        `estimated_cost_usd: ${safeFormatFixed(input.estimatedCostUsd, 4)}`,
        `estimated_tokens: ${coerceFiniteNumber(input.estimatedTokens, 0)}`,
      );
    }

    if (input.stepCount != null) {
      lines.push(`step_count: ${input.stepCount}`);
    }

    const artifacts = input.artifacts;
    const outcomeModel = resolveRunOutcome({
      status: input.status,
      outcomeCategory: input.outcomeCategory ?? null,
      failureCause: input.failureCause,
      output: artifacts?.output,
      lastStepSummary: artifacts?.lastStepSummary,
    });
    const outcomeLines = formatRunOutcomeSection(outcomeModel);
    if (outcomeLines.length) {
      lines.push("", S.outcome.evidenceSection, ...outcomeLines);
    }

    const output = outcomeModel.outputText;
    lines.push("", S.outcome.outputSection, output ?? S.outcome.outputUnavailable);

    const recordings = coerceStringArray(artifacts?.recordingUrls);
    if (recordings.length) {
      lines.push("", "--- RECORDINGS ---", ...recordings);
    }

    if (artifacts?.screenshotUrl) {
      lines.push("", "--- SCREENSHOT ---", artifacts.screenshotUrl);
    }

    const gaps = collectBackendGaps(input);
    if (gaps.length) {
      lines.push("", "--- GAP BACKEND (campos ausentes en GET) ---", ...gaps);
    }

    lines.push("", "=== END REPORT ===");
    return lines.join("\n");
  } catch (error) {
    logNautaViewError("buildRunReportDownloadText", error, {
      runId: input.runId,
      field: "download_text",
    });
    return [
      "=== NAUTA RUN EVIDENCE REPORT ===",
      `run_id: ${coerceString(input.runId, "unknown")}`,
      "status: error_building_report",
      "=== END REPORT ===",
    ].join("\n");
  }
}

export function isVideoRecordingUrl(url: unknown): boolean {
  const value = coerceString(url);
  if (!value) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(value) || value.includes("video");
}

/** Normalize poll GET payload before setState — prevents .toFixed throws in report panel. */
export function sanitizeLivePollSnapshot(data: {
  duration_seconds?: unknown;
  estimated_cost_usd?: unknown;
  estimated_tokens?: unknown;
  findings_count?: unknown;
  step_count?: unknown;
  completed_at?: unknown;
  stall_hint?: unknown;
  parent_run_id?: unknown;
  outcome_category?: unknown;
  outcome_text?: unknown;
  last_step_summary?: unknown;
  artifacts?: unknown;
}): {
  durationSeconds: number;
  estimatedCostUsd: number;
  estimatedTokens: number;
  findingsCount: number;
  stepCount: number | null;
  apiCompletedAt: string | null;
  stallHint: boolean;
  parentRunId: string | null;
  outcomeCategory: string | null;
  artifacts: NautaRunArtifacts | null;
} {
  const apiCompletedAt =
    typeof data.completed_at === "string" && data.completed_at.trim()
      ? data.completed_at.trim()
      : null;

  const parentRunId =
    typeof data.parent_run_id === "string" && data.parent_run_id.trim()
      ? data.parent_run_id.trim()
      : null;

  const outcomeCategory =
    typeof data.outcome_category === "string" && data.outcome_category.trim()
      ? data.outcome_category.trim()
      : null;

  let artifacts: NautaRunArtifacts | null = null;
  try {
    artifacts = mergePollArtifacts(data);
  } catch (error) {
    logNautaViewError("sanitizeLivePollSnapshot", error, {
      field: "artifacts",
    });
  }

  return {
    durationSeconds: coerceFiniteNumber(data.duration_seconds, 0),
    estimatedCostUsd: coerceFiniteNumber(data.estimated_cost_usd, 0),
    estimatedTokens: coerceFiniteNumber(data.estimated_tokens, 0),
    findingsCount: coerceFiniteNumber(data.findings_count, 0),
    stepCount: coerceOptionalFiniteNumber(data.step_count),
    apiCompletedAt,
    stallHint: data.stall_hint === true,
    parentRunId,
    outcomeCategory,
    artifacts,
  };
}
