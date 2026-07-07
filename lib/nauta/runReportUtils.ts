import type { NautaRunArtifacts } from "@/lib/nauta/types";
import type { NautaLiveViewStatus } from "@/lib/nauta/types";
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

    if (input.failureCause) {
      lines.push("", "--- FALLO ---", input.failureCause);
    }

    const artifacts = input.artifacts;
    const lastStep = coerceString(artifacts?.lastStepSummary).trim();
    if (lastStep) {
      lines.push("", "--- LAST STEP SUMMARY ---", lastStep);
    }

    const output = coerceOutputText(artifacts?.output);
    if (output) {
      lines.push("", "--- AGENT OUTPUT ---", output);
    }

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
  artifacts?: unknown;
}): {
  durationSeconds: number;
  estimatedCostUsd: number;
  estimatedTokens: number;
  findingsCount: number;
  stepCount: number | null;
  apiCompletedAt: string | null;
  artifacts: NautaRunArtifacts | null;
} {
  const apiCompletedAt =
    typeof data.completed_at === "string" && data.completed_at.trim()
      ? data.completed_at.trim()
      : null;

  let artifacts: NautaRunArtifacts | null = null;
  try {
    artifacts = sanitizeRunArtifacts(data.artifacts);
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
    artifacts,
  };
}
