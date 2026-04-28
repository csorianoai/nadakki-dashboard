import { calculateScenario } from "@/lib/credit/simulation/scenario-engine";

const baseConfig = {
  dtiMax: 40,
  dtiWarningRatio: 0.85,
  ltvMax: 95,
  minRoiThreshold: 30,
  riskMultipliers: { BAJO: 1.0, MEDIO: 0.75, ALTO: 0.5 },
};

describe("calculateScenario", () => {
  it("calculates healthy scenario as APROBABLE with BAJO risk", () => {
    const result = calculateScenario({
      monthlyIncome: 100_000,
      monthlyDebts: 5000,
      age: 35,
      employmentYears: 5,
      vehiclePrice: 1_000_000,
      downPayment: 300_000,
      termMonths: 60,
      annualRate: 14,
      ...baseConfig,
    });
    expect(result.status).toBe("APROBABLE");
    expect(result.riskBand).toBe("BAJO");
    expect(result.approvalProbability).toBeGreaterThan(80);
  });

  it("flags high LTV scenario", () => {
    const result = calculateScenario({
      monthlyIncome: 100_000,
      monthlyDebts: 0,
      age: 35,
      employmentYears: 5,
      vehiclePrice: 1_000_000,
      downPayment: 20_000,
      termMonths: 60,
      annualRate: 16,
      ...baseConfig,
    });
    expect(result.ltv).toBeGreaterThan(95);
    expect(result.recommendations.some((r) => /cuota inicial/i.test(r))).toBe(true);
  });

  it("calculates risk-adjusted ROI", () => {
    const result = calculateScenario({
      monthlyIncome: 50_000,
      monthlyDebts: 5000,
      age: 30,
      employmentYears: 2,
      vehiclePrice: 800_000,
      downPayment: 100_000,
      termMonths: 72,
      annualRate: 18,
      ...baseConfig,
    });
    expect(result.grossROI).toBeGreaterThan(0);
    expect(result.riskAdjustedROI).toBeLessThanOrEqual(result.grossROI + 1e-6);
  });

  it("provides recommendations for adjustable scenarios", () => {
    const result = calculateScenario({
      monthlyIncome: 30_000,
      monthlyDebts: 8000,
      age: 25,
      employmentYears: 1,
      vehiclePrice: 800_000,
      downPayment: 50_000,
      termMonths: 72,
      annualRate: 20,
      ...baseConfig,
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("returns ALTO risk for high DTI", () => {
    const result = calculateScenario({
      monthlyIncome: 30_000,
      monthlyDebts: 15_000,
      age: 35,
      employmentYears: 5,
      vehiclePrice: 600_000,
      downPayment: 50_000,
      termMonths: 60,
      annualRate: 18,
      ...baseConfig,
    });
    expect(result.riskBand).toBe("ALTO");
  });
});
