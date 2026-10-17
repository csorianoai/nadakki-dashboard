import { executeMultiLender } from "@/lib/credit-hub/api/creditCoreClient";
import { clearSubmitIdempotencyKey, getSubmitIdempotencyKey } from "@/lib/credit-hub/api/submitIdempotency";

const tenantId = "tenant-1";

function mockFetch() {
  const fn = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    clone: () => ({ json: async () => ({ status: "completed" }) }),
    json: async () => ({ status: "completed" }),
    text: async () => "{}",
  });
  Object.defineProperty(global, "fetch", { value: fn, writable: true, configurable: true });
  return fn;
}

describe("submit idempotency key", () => {
  beforeEach(() => sessionStorage.clear());

  test("is stable for the same draft and differs between drafts", () => {
    const first = getSubmitIdempotencyKey(tenantId, "app-1");
    expect(getSubmitIdempotencyKey(tenantId, "app-1")).toBe(first);
    expect(getSubmitIdempotencyKey(tenantId, "app-2")).not.toBe(first);
  });

  test("is rebuilt from the nonce kept in sessionStorage", () => {
    const first = getSubmitIdempotencyKey(tenantId, "app-1");
    expect(sessionStorage.length).toBe(1);
    expect(getSubmitIdempotencyKey(tenantId, "app-1")).toBe(first);
  });

  test("is discarded after success so the next attempt gets a new key", () => {
    const first = getSubmitIdempotencyKey(tenantId, "app-1");
    clearSubmitIdempotencyKey(tenantId, "app-1");
    expect(sessionStorage.length).toBe(0);
    expect(getSubmitIdempotencyKey(tenantId, "app-1")).not.toBe(first);
  });

  test("executeMultiLender sends the Idempotency-Key header only when given", async () => {
    const fetchMock = mockFetch();
    await executeMultiLender({ tenantId, applicationId: "app-1", application: {}, idempotencyKey: "k-1" });
    await executeMultiLender({ tenantId, applicationId: "app-1", application: {} });
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe("k-1");
    expect(fetchMock.mock.calls[0][1].headers["X-Tenant-ID"]).toBe(tenantId);
    expect(fetchMock.mock.calls[1][1].headers["Idempotency-Key"]).toBeUndefined();
  });
});
