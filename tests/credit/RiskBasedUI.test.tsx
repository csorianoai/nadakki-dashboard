/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { RiskBasedUI } from "@/components/credit/RiskBasedUI";
import { classifyDealerRiskTier } from "@/lib/credit/risk-based-ux";

const ids = {
  applicationId: "aid",
  tenantId: "tid",
};

describe("RiskBasedUI / useRiskBased", () => {
  test("threshold LOW_RISK for score ≥ 80", () => {
    expect(classifyDealerRiskTier(80)).toBe("LOW_RISK");
    expect(classifyDealerRiskTier(100)).toBe("LOW_RISK");
    render(<RiskBasedUI {...ids} score={88} />);
    expect(screen.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "LOW_RISK");
  });

  test("threshold MEDIUM_RISK for scores 60–79", () => {
    expect(classifyDealerRiskTier(79)).toBe("MEDIUM_RISK");
    expect(classifyDealerRiskTier(60)).toBe("MEDIUM_RISK");
    render(<RiskBasedUI {...ids} score={71} />);
    expect(screen.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "MEDIUM_RISK");
  });

  test("threshold HIGH_RISK for scores 40–59", () => {
    expect(classifyDealerRiskTier(59)).toBe("HIGH_RISK");
    expect(classifyDealerRiskTier(40)).toBe("HIGH_RISK");
    render(<RiskBasedUI {...ids} score={48} />);
    expect(screen.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "HIGH_RISK");
  });

  test("threshold DECLINED for scores <40", () => {
    expect(classifyDealerRiskTier(39)).toBe("DECLINED");
    render(<RiskBasedUI {...ids} score={28} />);
    expect(screen.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "DECLINED");
  });

  test("shows primary CTA when not declined lane", () => {
    render(<RiskBasedUI {...ids} score={83} />);
    expect(screen.getByTestId("risk-action-primary")).toBeInTheDocument();
    expect(screen.queryByTestId("risk-action-secondary")).toBeTruthy();
  });

  test("hides primary CTA for declined tier", () => {
    render(<RiskBasedUI {...ids} score={30} />);
    expect(screen.queryByTestId("risk-action-primary")).toBeNull();
    expect(screen.getByTestId("risk-action-secondary")).toBeTruthy();
  });

  test("secondary export stub always present", () => {
    render(<RiskBasedUI {...ids} score={71} />);
    expect(screen.getByTestId("risk-action-secondary")).toHaveTextContent(/Exportar síntesis/);
  });

  test("sets aria-labelledby linkage for heading badge stack", () => {
    render(<RiskBasedUI {...ids} score={93} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveAccessibleName(/Ruta/i);
    expect(screen.getByTestId("risk-based-ui-root").getAttribute("aria-labelledby")).toBe(
      "risk-tier-title"
    );
  });

  test("shows explanation line with numeric score snippet", () => {
    render(<RiskBasedUI {...ids} score={66} />);
    expect(screen.getByText(/Puntaje de salud orientativo 66/i)).toBeTruthy();
    expect(screen.getAllByText(/estipulaciones/i).length).toBeGreaterThan(0);
  });

  test("HIGH_RISK copy cites structural mitigations", () => {
    render(<RiskBasedUI {...ids} score={55} />);
    expect(screen.getByText(/co-firmante/i)).toBeTruthy();
    expect(screen.getByText(/LTV/i)).toBeTruthy();
  });

  test("DECLINED playbook references appeals", () => {
    render(<RiskBasedUI {...ids} score={12} />);
    expect(screen.getByText(/Declinaci/i)).toBeTruthy();
    expect(screen.getByText(/apelaci/i)).toBeTruthy();
  });

  test("risk badge exposes human-readable tier label", () => {
    render(<RiskBasedUI {...ids} score={63} />);
    expect(screen.getByTestId("risk-based-ui-root")).toHaveAttribute("data-tier", "MEDIUM_RISK");
    const badge = document.querySelector("[data-role='risk-badge']");
    expect(badge?.textContent).toMatch(/MEDIUM RISK/);
  });
});
