/** @jest-environment jsdom */

import { fetchBankApplicationsQueue } from "@/lib/bank-queue/fetch-queue";
import { BankQueueHttpError } from "@/lib/bank-queue/errors";
import { mockQueueResponse, mockApplication, seedBankQueueAuth, makeJwt } from "./test-utils";

describe("fetchBankApplicationsQueue", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    seedBankQueueAuth(makeJwt());
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("serializes query params and attaches tenant headers", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockQueueResponse([mockApplication()]),
    });

    await fetchBankApplicationsQueue({
      sortBy: "hours_until_sla",
      limit: 50,
      offset: 10,
      status: "pending",
    });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("sort_by=hours_until_sla");
    expect(url).toContain("limit=50");
    expect(url).toContain("offset=10");
    expect(url).toContain("status=pending");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-ID"]).toBeTruthy();
    expect(headers["X-Role"]).toBe("BANK_ANALYST");
    expect(headers["X-Correlation-ID"]).toBeTruthy();
    expect(headers.Authorization).toMatch(/^Bearer /);
  });

  it("throws BankQueueHttpError on upstream failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({ detail: "role_not_authorized" }),
    });

    await expect(
      fetchBankApplicationsQueue({
        sortBy: "sla_priority",
        limit: 50,
        offset: 0,
      }),
    ).rejects.toBeInstanceOf(BankQueueHttpError);
  });
});
