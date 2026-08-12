import { getStipulations, verifyStipulation, rejectStipulation, getStipulationAudit } from "@/lib/api/stipulations";
import { BANK_APPLICATION_AUTH_TOKEN_KEY } from "@/lib/bank-application-detail/constants";
import { makeBankTestJwt } from "@/tests/bank-application-detail/test-token";

describe("lib/api/stipulations", () => {
  const origFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as typeof fetch;
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, makeBankTestJwt("tenant-t"));
    localStorage.setItem("nadakki_role", "admin");
  });

  afterEach(() => {
    global.fetch = origFetch;
    localStorage.clear();
  });

  test("getStipulations parses wrapped data array", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          stipulations: [
            { id: "1", description: "Doc A", status: "pending" },
            { id: "2", title: "Doc B", status: "verified" },
          ],
        },
      }),
    });
    const rows = await getStipulations("app-1", "TENANT_ADMIN");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/credit/applications/app-1/stipulations"),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Role": "TENANT_ADMIN" }),
      }),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].status).toBe("pending");
    expect(rows[1].status).toBe("verified");
  });

  test("getStipulations parses top-level array", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [{ id: "z", description: "X", status: "uploaded" }],
    });
    const rows = await getStipulations("app-1");
    expect(rows[0].status).toBe("uploaded");
  });

  test("verifyStipulation POSTs notes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "1", description: "Doc", status: "verified" } }),
    });
    const row = await verifyStipulation("app-1", "1", "ok", "TENANT_ADMIN");
    expect(row?.status).toBe("verified");
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/stipulations/1/clear");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ reason: "ok", manual_override: true });
  });

  test("rejectStipulation requires reason", async () => {
    await expect(rejectStipulation("app-1", "1", "  ", "TENANT_ADMIN")).rejects.toMatchObject({
      name: "BankApplicationHttpError",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("rejectStipulation POSTs reason", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stipulation: { id: "1", description: "Doc", status: "rejected" } }),
    });
    const row = await rejectStipulation("app-1", "1", "incomplete", "TENANT_ADMIN");
    expect(row?.status).toBe("rejected");
    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(init.body as string)).toEqual({ reason: "incomplete" });
  });

  test("getStipulationAudit maps events", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [{ id: "e1", at: "2026-01-01T00:00:00Z", action: "upload", actor: "u" }],
      }),
    });
    const ev = await getStipulationAudit("app-1", "1");
    expect(ev).toHaveLength(1);
    expect(ev[0].action).toBe("upload");
  });

  test("getStipulations throws on HTTP error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "boom" }),
    });
    await expect(getStipulations("app-1")).rejects.toMatchObject({ status: 500 });
  });
});
