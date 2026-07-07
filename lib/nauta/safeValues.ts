import type { NautaRunArtifacts } from "@/lib/nauta/types";

/** Structured console.error for production diagnosis (screenshot-friendly). */
export function logNautaViewError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[nauta:${scope}]`, {
    ...context,
    field: context?.field ?? undefined,
    runId: context?.runId ?? undefined,
    message: err.message,
    stack: err.stack,
  });
}

export function coerceFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function coerceOptionalFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = coerceFiniteNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

export function coerceString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => coerceString(item).trim()).filter((item) => item.length > 0);
}

const OUTPUT_DICT_KEYS = ["outcome_text", "text", "content", "output", "message", "result"] as const;

/** Coerce API output — string, legacy output-dict, or outcome_text object. */
export function coerceOutputText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
  if (record) {
    for (const key of OUTPUT_DICT_KEYS) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
    try {
      return JSON.stringify(record, null, 2);
    } catch {
      return null;
    }
  }
  return null;
}

/** Defensive artifacts shape — never throws; safe for report render. */
export function sanitizeRunArtifacts(raw: unknown): NautaRunArtifacts | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const recordingUrls = coerceStringArray(o.recordingUrls ?? o.recording_urls);
  const screenshotRaw = o.screenshotUrl ?? o.screenshot_url;
  const screenshotUrl =
    typeof screenshotRaw === "string" && screenshotRaw.trim() ? screenshotRaw.trim() : null;
  const output = coerceOutputText(o.output ?? o.outcome_text);
  const lastStepSummaryRaw = o.lastStepSummary ?? o.last_step_summary;
  const lastStepSummary =
    typeof lastStepSummaryRaw === "string" && lastStepSummaryRaw.trim()
      ? lastStepSummaryRaw.trim()
      : null;

  if (!recordingUrls.length && !screenshotUrl && !output && !lastStepSummary) return null;
  return { recordingUrls, screenshotUrl, output, lastStepSummary };
}

export function safeFormatFixed(value: unknown, digits: number, fallback = "0"): string {
  try {
    return coerceFiniteNumber(value, 0).toFixed(digits);
  } catch (error) {
    logNautaViewError("safeFormatFixed", error, { field: "numeric", value });
    return fallback;
  }
}
