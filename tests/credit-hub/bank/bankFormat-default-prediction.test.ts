import { formatDefaultPredictionDisplay } from "@/lib/credit-hub/bank/bankFormat";

describe("formatDefaultPredictionDisplay", () => {
  it("formatea tasa decimal 0-1 como porcentaje", () => {
    const result = formatDefaultPredictionDisplay(0.042, 18, 500);
    expect(result.percentLabel).toBe("4.2");
    expect(result.isExtreme).toBe(false);
  });

  it("normaliza valor ya en escala 0-100 sin doble multiplicar", () => {
    const result = formatDefaultPredictionDisplay(100, 500, 500);
    expect(result.percentLabel).toBe("100.0");
  });

  it("marca extremo cuando todos los casos predicen default", () => {
    const result = formatDefaultPredictionDisplay(1, 500, 500);
    expect(result.percentLabel).toBe("100.0");
    expect(result.isExtreme).toBe(true);
    expect(result.extremeTooltip).toMatch(/Predicción extrema/i);
  });
});
