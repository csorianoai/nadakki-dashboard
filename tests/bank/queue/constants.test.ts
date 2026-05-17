import {
  BANK_QUEUE_DEFAULT_LIMIT,
  BANK_QUEUE_VIRTUALIZATION_ROW_CAP,
  OPTIMISTIC_CLAIM_TIMEOUT_MS,
  QUEUE_POLLING_INTERVAL_SEC,
  PTI_GREEN_MAX,
  PTI_AMBER_MAX,
} from "@/lib/bank-queue/constants";

describe("bank-queue module constants", () => {
  it("exports sensible tuning defaults", () => {
    expect(QUEUE_POLLING_INTERVAL_SEC).toBeGreaterThanOrEqual(15);
    expect(OPTIMISTIC_CLAIM_TIMEOUT_MS).toBeGreaterThanOrEqual(1000);
    expect(BANK_QUEUE_DEFAULT_LIMIT).toBeLessThanOrEqual(100);
    expect(BANK_QUEUE_VIRTUALIZATION_ROW_CAP).toBeGreaterThanOrEqual(50);
    expect(PTI_GREEN_MAX).toBeLessThan(PTI_AMBER_MAX);
  });
});
