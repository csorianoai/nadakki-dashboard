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

  test("DISBURSED server label", () => {
    expect(resolveDisplayStatusLabel({ displayStatus: "DISBURSED", status: "processed" }).label).toBe("Desembolsada");
  });

  test("EXPIRED and CANCELLED server labels", () => {
    expect(resolveDisplayStatusLabel({ displayStatus: "EXPIRED" }).label).toBe("Expirada");
    expect(resolveDisplayStatusLabel({ displayStatus: "CANCELLED" }).label).toBe("Cancelada");
  });

  test("labels pending offers instead of claiming bank completion", () => {
    const r = resolveDisplayStatusLabel({
      displayStatus: "BANK_COMPLETE",
      hasOffers: true,
      hasHumanDecision: false,
    });
    expect(r.key).toBe("OFFERS_RECEIVED");
    expect(r.label).toContain("pendiente");
  });

  test("keeps bank completion after a human decision", () => {
    const r = resolveDisplayStatusLabel({
      displayStatus: "BANK_COMPLETE",
      hasOffers: true,
      hasHumanDecision: true,
    });
    expect(r.key).toBe("BANK_COMPLETE");
    expect(r.label).toBe("Banco completado");
  });
});
