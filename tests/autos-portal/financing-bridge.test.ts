import {
  buildCreditHubPreset,
  creditHubApplicationUrl,
  creditHubWizardUrl,
  encodeCreditHubPreset,
} from "@/lib/autos-portal/financing-preset";

describe("financing-preset", () => {
  describe("buildCreditHubPreset", () => {
    it("computes loanAmount from price minus down payment", () => {
      const preset = buildCreditHubPreset({
        vehiclePrice: 1_500_000,
        downPayment: 300_000,
        termMonths: 60,
        vehicleMake: "Toyota",
        vehicleModel: "Corolla",
        vehicleYear: 2022,
        autosVehicleId: "veh-abc",
      });
      expect(preset.loanAmount).toBe(1_200_000);
      expect(preset.source).toBe("autos_vdp");
    });

    it("never returns negative loan amount", () => {
      const preset = buildCreditHubPreset({
        vehiclePrice: 100_000,
        downPayment: 150_000,
        termMonths: 48,
      });
      expect(preset.loanAmount).toBe(0);
    });
  });

  describe("encodeCreditHubPreset", () => {
    it("round-trips JSON via base64", () => {
      const preset = buildCreditHubPreset({
        vehiclePrice: 800_000,
        downPayment: 160_000,
        termMonths: 72,
      });
      const encoded = encodeCreditHubPreset(preset);
      const decoded = JSON.parse(
        Buffer.from(decodeURIComponent(encoded), "base64").toString("utf8"),
      );
      expect(decoded.vehiclePrice).toBe(800_000);
      expect(decoded.termMonths).toBe(72);
      expect(decoded.source).toBe("autos_vdp");
    });
  });

  describe("creditHubWizardUrl", () => {
    it("builds applicant wizard URL with preset query", () => {
      const preset = buildCreditHubPreset({
        vehiclePrice: 500_000,
        downPayment: 100_000,
        termMonths: 60,
      });
      const url = creditHubWizardUrl(preset);
      expect(url).toMatch(/^\/credit-hub\/dealer\/applications\/new\/applicant\?preset=/);
    });
  });

  describe("creditHubApplicationUrl", () => {
    it("encodes application id in path", () => {
      expect(creditHubApplicationUrl("app/123")).toBe(
        "/credit-hub/dealer/applications/app%2F123",
      );
    });
  });
});
