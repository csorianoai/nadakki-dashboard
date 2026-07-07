import { describe, expect, test } from "@jest/globals";
import {
  buildRunReportDownloadText,
  collectBackendGaps,
  sanitizeLivePollSnapshot,
} from "@/lib/nauta/runReportUtils";
import {
  coerceFiniteNumber,
  coerceOutputText,
  safeFormatFixed,
  sanitizeRunArtifacts,
} from "@/lib/nauta/safeValues";

describe("nauta safeValues", () => {
  test("coerceFiniteNumber accepts API string numbers", () => {
    expect(coerceFiniteNumber("45.2", 0)).toBe(45.2);
    expect(coerceFiniteNumber("bad", 7)).toBe(7);
  });

  test("safeFormatFixed never throws on string input", () => {
    expect(safeFormatFixed("12.345", 2)).toBe("12.35");
  });

  test("coerceOutputText reads legacy output-dict and outcome_text", () => {
    expect(coerceOutputText({ outcome_text: "  done  " })).toBe("done");
    expect(coerceOutputText({ text: "legacy" })).toBe("legacy");
  });

  test("sanitizeRunArtifacts tolerates malformed recordingUrls", () => {
    const artifacts = sanitizeRunArtifacts({
      recording_urls: "https://example.com/v.mp4",
      output: { outcome_text: "report body" },
    });
    expect(artifacts?.output).toBe("report body");
    expect(artifacts?.recordingUrls).toEqual([]);
  });
});

describe("nauta runReportUtils", () => {
  const baseInput = {
    runId: "run-1",
    status: "completed" as const,
    taskName: "smoke",
    durationSeconds: "88.5" as unknown as number,
    estimatedCostUsd: "0.042" as unknown as number,
    estimatedTokens: "1200" as unknown as number,
    stepCount: null,
    failureCause: null,
    artifacts: null,
    completedAtIso: "2026-07-01T12:00:00.000Z",
    apiCompletedAt: null,
  };

  test("buildRunReportDownloadText survives string metrics (root crash fix)", () => {
    const text = buildRunReportDownloadText(baseInput);
    expect(text).toContain("duration_seconds: 88.5");
    expect(() => buildRunReportDownloadText(baseInput)).not.toThrow();
  });

  test("collectBackendGaps does not throw when recordingUrls missing", () => {
    const gaps = collectBackendGaps({
      ...baseInput,
      durationSeconds: 1,
      estimatedCostUsd: 0,
      estimatedTokens: 0,
      artifacts: {
        recordingUrls: undefined as unknown as string[],
        screenshotUrl: null,
        output: null,
        lastStepSummary: null,
      },
    });
    expect(gaps).toContain("artifacts.recordingUrls");
    expect(gaps).toContain("outcome_text");
  });

  test("sanitizeLivePollSnapshot coerces string poll fields", () => {
    const snap = sanitizeLivePollSnapshot({
      duration_seconds: "33.3",
      estimated_cost_usd: "0.01",
      estimated_tokens: "500",
      artifacts: { output: "ok" },
    });
    expect(snap.durationSeconds).toBe(33.3);
    expect(snap.estimatedCostUsd).toBe(0.01);
    expect(snap.artifacts?.output).toBe("ok");
  });
});
