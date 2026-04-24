import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fetchAgentRegistrySummary } from "@/lib/api/agent-registry";

describe("fetchAgentRegistrySummary", () => {
  const mockFetch = jest.fn();
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it("returns ok with parsed summary on 200", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ executable_agents: 42, live: 40 }),
    });
    const r = await fetchAgentRegistrySummary();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary.displayCount).toBe(42);
      expect(r.summary.live).toBe(40);
    }
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/system/agents/summary",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("returns ok false on non-OK HTTP", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    const r = await fetchAgentRegistrySummary();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("503");
  });

  it("returns ok false when JSON has no counts", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ foo: 1 }),
    });
    const r = await fetchAgentRegistrySummary();
    expect(r.ok).toBe(false);
  });
});
