import { simulatePreApproval } from "@/lib/credit/simulation/preapproval-base";

describe("simulatePreApproval", () => {
  const baseInput = {
    monthlyIncome: 60000,
    monthlyDebts: 5000,
    loanAmount: 500000,
    annualRate: 16,
    termMonths: 60,
    dtiMax: 40,
  };

  it("returns APROBABLE for healthy DTI", () => {
    const result = simulatePreApproval(baseInput);
    expect(result.status).toBe("APROBABLE");
    expect(result.badge.icon).toBe("✔");
  });

  it("returns RIESGO for zero income", () => {
    const result = simulatePreApproval({ ...baseInput, monthlyIncome: 0 });
    expect(result.status).toBe("RIESGO");
  });

  it("returns RIESGO when DTI exceeds max", () => {
    const result = simulatePreApproval({ ...baseInput, monthlyDebts: 30000 });
    expect(result.status).toBe("RIESGO");
    expect(result.dti).toBeGreaterThan(40);
  });

  it("returns AJUSTAR when DTI close to max", () => {
    const result = simulatePreApproval({ ...baseInput, monthlyDebts: 10000 });
    expect(result.status).toBe("AJUSTAR");
  });

  it("includes reasons in result", () => {
    const result = simulatePreApproval({ ...baseInput, monthlyDebts: 30000 });
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("respects dtiWarningRatio for AJUSTAR threshold", () => {
    const tighter = simulatePreApproval({ ...baseInput, monthlyDebts: 10_600, dtiWarningRatio: 0.9 });
    const looser = simulatePreApproval({ ...baseInput, monthlyDebts: 10_600, dtiWarningRatio: 0.99 });
    expect(tighter.status).toBe("AJUSTAR");
    expect(looser.status).toBe("APROBABLE");
  });
});
