import {
  validateAnchorReconciliation,
  formatAnchorReport,
  type AnchorReconciliationResult,
} from "@/lib/cockpit/finance-v3/anchor-reconciliation";
import { fetchFinanceAnchor } from "@/lib/cockpit/api/anchor";
import { PlatformApiError } from "@/lib/platformApi";

jest.mock("@/lib/platformApi", () => ({
  PlatformApiError: class PlatformApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  platformFetch: jest.fn(),
}));

const { platformFetch } = jest.requireMock("@/lib/platformApi") as {
  platformFetch: jest.Mock;
};

const ALIGNED_ANCHOR: AnchorReconciliationResult = {
  ok: true,
  priority: null,
  epsilon: 0,
  sources: {
    kpis_total_mrr: 0,
    mrr_by_core_sum: 0,
    matrix_unique_tenant_mrr: 0,
    overview_tenant_mrr_sum: 0,
    overview_tenant_count: 18,
    db_mrr_all_sum: 0,
    matrix_total_rows: 18,
  },
  mismatches: [],
  as_of: "2026-07-13T21:00:00Z",
  notes: ["mrr_by_core_sum is attributable and may exceed global MRR"],
};

describe("anchor reconciliation — F7 gate", () => {
  test("validateAnchorReconciliation passes when all unique sums align (margin 0)", () => {
    const result = validateAnchorReconciliation(ALIGNED_ANCHOR);
    expect(result.ok).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  test("validateAnchorReconciliation fails on mismatch — P0", () => {
    const broken: AnchorReconciliationResult = {
      ...ALIGNED_ANCHOR,
      ok: false,
      priority: "P0",
      sources: { ...ALIGNED_ANCHOR.sources, db_mrr_all_sum: 100 },
      mismatches: [
        {
          code: "ANCHOR_MISMATCH",
          severity: "error",
          source: "db",
          expected: 0,
          actual: 100,
          delta: 100,
        },
      ],
    };
    const result = validateAnchorReconciliation(broken);
    expect(result.ok).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
  });

  test("formatAnchorReport documents GREEN status", () => {
    const md = formatAnchorReport(ALIGNED_ANCHOR);
    expect(md).toContain("GREEN");
    expect(md).toContain("18");
  });

  test("formatAnchorReport documents RED P0 on mismatch", () => {
    const md = formatAnchorReport({
      ...ALIGNED_ANCHOR,
      ok: false,
      priority: "P0",
      mismatches: [
        {
          code: "ANCHOR_MISMATCH",
          severity: "error",
          source: "matrix",
          expected: 0,
          actual: 50,
          delta: 50,
        },
      ],
    });
    expect(md).toContain("RED — P0");
    expect(md).toContain("matrix");
  });

  test("fetchFinanceAnchor calls anchor endpoint", async () => {
    platformFetch.mockResolvedValueOnce(ALIGNED_ANCHOR);
    const result = await fetchFinanceAnchor();
    expect(result.status).toBe("ok");
    expect(platformFetch).toHaveBeenCalledWith("/api/v1/cockpit/finance/reconciliation/anchor");
  });

  test("5-source parallel fetch contract (mocked aligned)", async () => {
    platformFetch.mockResolvedValueOnce(ALIGNED_ANCHOR);
    const [result] = await Promise.all([fetchFinanceAnchor()]);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      const v = validateAnchorReconciliation(result.data);
      expect(v.ok).toBe(true);
      expect(result.data.sources.overview_tenant_count).toBe(18);
    }
  });
});
