import { activePipelineCountFromStats } from "@/lib/credit-hub/dealer/dealer-pipeline-metrics";
import { normalizeStats } from "@/lib/credit-hub/api/normalizers";

describe("dealer pipeline metrics", () => {
  test("active count excludes COMPLETED terminal bucket", () => {
    const stats = normalizeStats({
      total_applications: 800,
      states: {
        DRAFT: 10,
        COMPLETED: 758,
        BANK_SUBMITTED: 20,
        HYBRID_IN_PROGRESS: 12,
      },
      avg_score: 710,
      approval_rate: 0.42,
    });

    expect(stats.submitted_applications).toBe(20);
    expect(stats.completed_applications).toBe(758);
    expect(activePipelineCountFromStats(stats)).toBe(32);
  });
});
