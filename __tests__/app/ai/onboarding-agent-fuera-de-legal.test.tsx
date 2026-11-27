import { render, screen } from "@testing-library/react";
import OnboardingAgent from "@/components/ai/OnboardingAgent";

let ruta = "/legal/cases";
jest.mock("next/navigation", () => ({ usePathname: () => ruta }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "t1" }) }));

describe("Copiloto general", () => {
  it("no aparece en Legal, que tiene su propio asistente", () => {
    ruta = "/legal/cases";
    const { container } = render(<OnboardingAgent />);
    expect(container.innerHTML).toBe("");
  });

  it("sigue apareciendo en los demás módulos", () => {
    ruta = "/marketing";
    render(<OnboardingAgent />);
    expect(screen.getByRole("button", { name: "Abrir asistente de Nadakki" })).toBeTruthy();
  });
});
