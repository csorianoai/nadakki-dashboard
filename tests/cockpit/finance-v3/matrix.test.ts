import { financeMatrixResponseSchema } from "@/lib/cockpit/finance-v3/contracts/matrix";
import { normalizeFinanceMatrix } from "@/lib/cockpit/finance-v3/normalize/matrix";
import {
  matrixToCsv,
  reconcileMatrixMrrWithRevenue,
} from "@/lib/cockpit/api/matrix";
import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";

const SYNTH_TENANT = "11111111-1111-4111-8111-111111111111";

const SAMPLE_MATRIX = {
  metric: "mrr" as const,
  period: "current" as const,
  as_of: "2026-07-13T12:00:00Z",
  data_source: "live" as const,
  mrr_attribution_rule: "attributable" as const,
  requires_metering: false,
  aggregation_type: "SUM" as const,
  rows: [
    {
      tenant_id: SYNTH_TENANT,
      tenant_slug: "test-tenant",
      tenant_name: "Test Tenant",
      plan_code: "enterprise",
      country: "DO",
      cells: [
        { core_code: "credit", value: 100, display_value: "100", data_source: "live" as const },
        { core_code: "legal", value: null, display_value: "—", data_source: "none" as const },
      ],
      row_total: { value: 100, display_value: "100" },
    },
  ],
  totals_per_column: [
    { core_code: "credit", value: 100, display_value: "100" },
    { core_code: "legal", value: 0, display_value: "0" },
  ],
  grand_total: { value: 100, display_value: "100" },
  next_cursor: null,
  has_more: false,
  total_rows: 18,
  warnings: [],
};

describe("finance matrix", () => {
  test("normalizeFinanceMatrix parses backend shape", () => {
    const raw = { ...SAMPLE_MATRIX, success: true };
    const data = normalizeFinanceMatrix(raw);
    expect(data.rows).toHaveLength(1);
    expect(data.metric).toBe("mrr");
    financeMatrixResponseSchema.parse(data);
  });

  test("NON_ADDITIVE core_status has no grand_total requirement", () => {
    const data = normalizeFinanceMatrix({
      ...SAMPLE_MATRIX,
      metric: "core_status",
      aggregation_type: "NON_ADDITIVE",
      grand_total: null,
    });
    expect(data.aggregation_type).toBe("NON_ADDITIVE");
    expect(data.grand_total).toBeNull();
  });

  test("matrixToCsv includes BOM and totals row", () => {
    const data = normalizeFinanceMatrix(SAMPLE_MATRIX);
    const csv = matrixToCsv(data);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("test-tenant");
    expect(csv).toContain("TOTAL");
  });

  test("reconcileMatrixMrrWithRevenue detects mismatch", () => {
    const data = normalizeFinanceMatrix(SAMPLE_MATRIX);
    const result = reconcileMatrixMrrWithRevenue(data, [{ core_name: "credit", mrr: 50 }]);
    expect(result.ok).toBe(false);
    expect(result.warnings[0]?.code).toBe("RECONCILIATION_MISMATCH");
  });

  test("reconcileMatrixMrrWithRevenue passes when aligned", () => {
    const data = normalizeFinanceMatrix(SAMPLE_MATRIX);
    const result = reconcileMatrixMrrWithRevenue(data, [{ core_name: "credit", mrr: 100 }]);
    expect(result.ok).toBe(true);
  });

  test("COCKPIT_FINANCE_MATRIX_ENABLED defaults true", () => {
    expect(COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_MATRIX_ENABLED).toBe(true);
  });
});
