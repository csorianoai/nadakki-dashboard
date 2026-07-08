import { describe, expect, test } from "@jest/globals";
import { resolveRunReportNotes } from "@/lib/nauta/midrunNotes";
import { sanitizeLivePollSnapshot } from "@/lib/nauta/runReportUtils";
import { truncateRunId } from "@/lib/nauta/runIdDisplay";

describe("nauta midrun helpers", () => {
  test("sanitizeLivePollSnapshot defaults stall_hint and parent_run_id safely", () => {
    const snap = sanitizeLivePollSnapshot({
      duration_seconds: 10,
      stall_hint: undefined,
      parent_run_id: null,
    });
    expect(snap.stallHint).toBe(false);
    expect(snap.parentRunId).toBeNull();
  });

  test("sanitizeLivePollSnapshot reads stall_hint true", () => {
    const snap = sanitizeLivePollSnapshot({ stall_hint: true });
    expect(snap.stallHint).toBe(true);
  });

  test("truncateRunId shortens long ids", () => {
    expect(truncateRunId("abcdef12-3456-7890-abcd-ef1234567890")).toBe("abcdef12…");
  });

  test("resolveRunReportNotes detects partial stop", () => {
    const notes = resolveRunReportNotes({
      status: "completed",
      failureCause: null,
      outcomeCategory: "completed_partial",
      output: "partial work",
    });
    expect(notes.showPartialStop).toBe(true);
    expect(notes.showStoppedNoOutput).toBe(false);
  });

  test("resolveRunReportNotes detects stopped_by_user without output", () => {
    const notes = resolveRunReportNotes({
      status: "failed",
      failureCause: "stopped_by_user",
      outcomeCategory: null,
      output: null,
    });
    expect(notes.showStoppedNoOutput).toBe(true);
  });

  test("resolveRunReportNotes detects redirected parent", () => {
    const notes = resolveRunReportNotes({
      status: "failed",
      failureCause: "stopped_for_redirect",
      outcomeCategory: null,
      output: null,
    });
    expect(notes.showRedirectedParent).toBe(true);
  });
});
