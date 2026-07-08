import { describe, expect, test } from "@jest/globals";
import { buildRunReportDownloadText, mergePollArtifacts } from "@/lib/nauta/runReportUtils";
import { formatRunOutcomeSection, resolveRunOutcome } from "@/lib/nauta/runOutcome";

describe("runOutcome", () => {
  test("failed with root outcome_text → failed_with_output caution", () => {
    const model = resolveRunOutcome({
      status: "failed",
      outcomeCategory: "task_unsuccessful",
      failureCause: "task_unsuccessful",
      output: "| Banco | Tasa |\n| Popular | 8% |",
      lastStepSummary: "Scraped partial table",
    });
    expect(model.variant).toBe("failed_with_output");
    expect(model.visualTone).toBe("caution");
    expect(model.headline).toContain("RESULTADO PARCIAL");
    expect(model.sublines.some((l) => l.includes("task_unsuccessful"))).toBe(true);
    expect(model.sublines.some((l) => l.includes("Scraped partial table"))).toBe(true);
  });

  test("failed without output → emptyBody, never blank", () => {
    const model = resolveRunOutcome({
      status: "failed",
      failureCause: "timeout",
      output: null,
      lastStepSummary: "Clicked login",
    });
    expect(model.variant).toBe("failed_without_output");
    expect(model.emptyBody).toContain("timeout");
    expect(model.emptyBody).toContain("Clicked login");
  });

  test("completed_partial → own headline without failed warning", () => {
    const model = resolveRunOutcome({
      status: "completed",
      outcomeCategory: "completed_partial",
      output: "partial",
      failureCause: null,
    });
    expect(model.variant).toBe("completed_partial");
    expect(model.headline).toContain("detenida por el usuario");
    expect(model.headline).not.toContain("RESULTADO PARCIAL");
  });

  test("completed success → no header", () => {
    const model = resolveRunOutcome({
      status: "completed",
      outcomeCategory: null,
      output: "all good",
    });
    expect(model.variant).toBe("none");
    expect(model.headline).toBeNull();
    expect(model.visualTone).toBe("neutral");
  });

  test("formatRunOutcomeSection matches panel headline for download", () => {
    const model = resolveRunOutcome({
      status: "failed",
      failureCause: "task_unsuccessful",
      output: "table data",
      lastStepSummary: "step 53",
    });
    const section = formatRunOutcomeSection(model);
    expect(section[0]).toContain("RESULTADO PARCIAL");
    expect(section.some((l) => l.includes("task_unsuccessful"))).toBe(true);
  });
});

describe("mergePollArtifacts", () => {
  test("merges root outcome_text when artifacts.output missing (e0055501 case)", () => {
    const merged = mergePollArtifacts({
      artifacts: null,
      outcome_text: "| Banco Popular | 8.5% |",
      last_step_summary: "Extracted rates table",
    });
    expect(merged?.output).toBe("| Banco Popular | 8.5% |");
    expect(merged?.lastStepSummary).toBe("Extracted rates table");
  });

  test("buildRunReportDownloadText includes outcome header and output for failed partial", () => {
    const text = buildRunReportDownloadText({
      runId: "e0055501",
      status: "failed",
      taskName: "multi-site",
      durationSeconds: 120,
      estimatedCostUsd: 0.3,
      estimatedTokens: 1000,
      stepCount: 53,
      failureCause: "task_unsuccessful",
      outcomeCategory: "task_unsuccessful",
      artifacts: mergePollArtifacts({
        outcome_text: "| Popular | 8% |",
        last_step_summary: "step 53",
      }),
      completedAtIso: "2026-07-08T12:00:00.000Z",
      apiCompletedAt: null,
    });
    expect(text).toContain("ESTADO DEL RESULTADO");
    expect(text).toContain("RESULTADO PARCIAL");
    expect(text).toContain("task_unsuccessful");
    expect(text).toContain("| Popular | 8% |");
    expect(text).toContain("step 53");
  });
});
