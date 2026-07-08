import { resolveDisplayStatusLabel } from "@/lib/credit-hub/honesty/display-status";

describe("display-status server-first", () => {
  test("uses server display_status when provided", () => {
    const r = resolveDisplayStatusLabel({
      displayStatus: "SENT_TO_BANKS",
      status: "submitted",
    });
    expect(r.source).toBe("server");
    expect(r.label).toBe("Enviada a bancos");
    expect(r.key).toBe("SENT_TO_BANKS");
  });

  test("unknown server status gets neutral label without crash", () => {
    const r = resolveDisplayStatusLabel({ displayStatus: "FUTURE_STATE_X", status: "unknown" });
    expect(r.source).toBe("server");
    expect(r.label).toBe("future state x");
  });

  test("falls back to legacy bucket when no display_status", () => {
    const r = resolveDisplayStatusLabel({ status: "approved" });
    expect(r.source).toBe("legacy");
    expect(r.key).toBe("APPROVED");
  });
});
