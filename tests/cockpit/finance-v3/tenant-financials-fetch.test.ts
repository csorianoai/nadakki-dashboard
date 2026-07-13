import { PlatformApiError } from "@/lib/platformApi";
import { fetchTenantFinancialsPanel } from "@/lib/cockpit/api/finance";
import { noneTenantFinancialsListRaw } from "@/lib/cockpit/demo-finance";

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

describe("fetchTenantFinancialsPanel — H-2-N 404 → none", () => {
  test("maps HTTP 404 to data_source none, not demo", async () => {
    platformFetch.mockRejectedValueOnce(new PlatformApiError(404, "Not Found"));
    const result = await fetchTenantFinancialsPanel();
    expect(result.isAbsent).toBe(true);
    expect(result.isDemo).toBe(false);
    expect(result.envelope.data_source).toBe("none");
    expect(result.envelope.data.items).toHaveLength(0);
  });

  test("noneTenantFinancialsListRaw uses none not demo", () => {
    const raw = noneTenantFinancialsListRaw();
    expect(raw.data_source).toBe("none");
    expect(raw.items).toHaveLength(0);
  });
});
