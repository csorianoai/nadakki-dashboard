import {
  bankQueueCanGoNext,
  bankQueueTotalPages,
  resolveBankQueueTotal,
} from "@/lib/credit-hub/bank/queuePagination";

describe("queuePagination", () => {
  test("resolveBankQueueTotal prefers total_count", () => {
    expect(resolveBankQueueTotal({ total_count: 400, total: 2 })).toBe(400);
    expect(resolveBankQueueTotal({ total: 50 })).toBe(50);
    expect(resolveBankQueueTotal({})).toBeNull();
  });

  test("bankQueueTotalPages computes pages", () => {
    expect(bankQueueTotalPages(400, 20)).toBe(20);
    expect(bankQueueTotalPages(null, 20)).toBeNull();
  });

  test("bankQueueCanGoNext without total uses row count", () => {
    expect(bankQueueCanGoNext({ page: 1, pageSize: 20, rowCount: 20, total: null })).toBe(true);
    expect(bankQueueCanGoNext({ page: 1, pageSize: 20, rowCount: 5, total: null })).toBe(false);
    expect(bankQueueCanGoNext({ page: 2, pageSize: 20, rowCount: 20, total: 400 })).toBe(true);
    expect(bankQueueCanGoNext({ page: 20, pageSize: 20, rowCount: 20, total: 400 })).toBe(false);
  });
});
