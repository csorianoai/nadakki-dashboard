import { render, screen } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";

let pathname = "/realtor/demand-radar";

jest.mock("next/navigation", () => ({ usePathname: () => pathname }));

jest.mock("@/components/forge/auth/ProtectedRoute", () => ({
  __esModule: true,
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));


jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => <div data-testid="bot-widget" /> }));

describe("AppGate: Realtor OS con su propio armazón", () => {
  test.each(["/realtor", "/realtor/demand-radar", "/realtor/alta"])("%s: protegido y sin el armazón genérico", (p) => {
    pathname = p;
    render(<AppGate>contenido de Realtor OS</AppGate>);
    expect(screen.getByText("contenido de Realtor OS")).toBeInTheDocument();
    expect(screen.getByTestId("protected")).toBeInTheDocument();
    expect(screen.queryByTestId("forge-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bot-widget")).not.toBeInTheDocument();
  });

  test("una ruta que solo empieza por la palabra (/realtors) sigue en el armazón genérico", () => {
    pathname = "/realtors";
    render(<AppGate>Otra</AppGate>);
    expect(screen.getByTestId("module-shell")).toBeInTheDocument();
  });

  test("el resto de la Suite sigue en el armazón genérico", () => {
    pathname = "/sic";
    render(<AppGate>SIC</AppGate>);
    expect(screen.getByTestId("module-shell")).toBeInTheDocument();
    expect(screen.getByTestId("protected")).toBeInTheDocument();
  });
});
