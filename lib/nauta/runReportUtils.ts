import type { NautaRunArtifacts } from "@/lib/nauta/types";
import type { NautaLiveViewStatus } from "@/lib/nauta/types";

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
    return gaps;
  }

  if (!artifacts.output?.trim()) gaps.push("artifacts.output");

  if (status === "failed" && !artifacts.lastStepSummary?.trim()) {
    gaps.push("artifacts.lastStepSummary");
  }

  if (!artifacts.recordingUrls.length) gaps.push("artifacts.recordingUrls");

  if (!artifacts.screenshotUrl) gaps.push("artifacts.screenshotUrl");

  return gaps;
}

export function buildRunReportDownloadText(input: RunReportInput): string {
  const lines: string[] = [
    "=== NAUTA RUN EVIDENCE REPORT ===",
    `run_id: ${input.runId}`,
    `timestamp: ${input.completedAtIso}`,
    `status: ${input.status}`,
    `task_name: ${input.taskName}`,
  ];

  if (input.taskInstruction?.trim()) {
    lines.push("", "--- INSTRUCCIÓN ASIGNADA ---", input.taskInstruction.trim());
  }

  lines.push(
    "",
    "--- MÉTRICAS ---",
    `duration_seconds: ${input.durationSeconds.toFixed(1)}`,
    `estimated_cost_usd: ${input.estimatedCostUsd.toFixed(4)}`,
    `estimated_tokens: ${input.estimatedTokens}`,
  );

  if (input.stepCount != null) {
    lines.push(`step_count: ${input.stepCount}`);
  }

  if (input.failureCause) {
    lines.push("", "--- FALLO ---", input.failureCause);
  }

  const { artifacts } = input;
  if (artifacts?.lastStepSummary?.trim()) {
    lines.push("", "--- LAST STEP SUMMARY ---", artifacts.lastStepSummary.trim());
  }

  if (artifacts?.output?.trim()) {
    lines.push("", "--- AGENT OUTPUT ---", artifacts.output.trim());
  }

  if (artifacts?.recordingUrls.length) {
    lines.push("", "--- RECORDINGS ---", ...artifacts.recordingUrls);
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
}

export function isVideoRecordingUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url) || url.includes("video");
}
