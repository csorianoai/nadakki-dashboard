import { render, screen } from "@testing-library/react";
import { StipulationsPanel } from "@/app/(bank)/bank/applications/[id]/components/StipulationsPanel";
import * as bankWfEnv from "@/lib/env/bank-stipulation-workflow";

describe("StipulationsPanel", () => {
  test("empty stipulations message", () => {
    render(<StipulationsPanel applicationId="app-x" stipulations={[]} />);
    expect(screen.getByText(/sin estipulaciones activas/i)).toBeInTheDocument();
  });

  test("lists stipulation description and status", () => {
    render(
      <StipulationsPanel
        applicationId="app-x"
        stipulations={[{ id: "s1", description: "Comprobante de ingresos", status: "open" }]}
      />,
    );
    expect(screen.getByText("Comprobante de ingresos")).toBeInTheDocument();
    expect(screen.getByText(/\(open\)/i)).toBeInTheDocument();
  });

  test("links to stipulations admin route", () => {
    render(<StipulationsPanel applicationId="uuid-123" stipulations={[]} />);
    const link = screen.getByRole("link", { name: /gestionar/i });
    expect(link.getAttribute("href")).toContain("/bank/applications/uuid-123/stipulations");
  });
});

describe("StipulationsPanel workflow launcher (META gate)", () => {
  let spy: jest.SpiedFunction<typeof bankWfEnv.isBankStipulationWorkflowUiEnabled>;

  beforeAll(() => {
    spy = jest.spyOn(bankWfEnv, "isBankStipulationWorkflowUiEnabled");
  });

  afterEach(() => {
    spy.mockReset();
    spy.mockReturnValue(false);
  });

  afterAll(() => {
    spy.mockRestore();
  });

  test("shows META orchestrator CTA only when explicitly enabled", () => {
    spy.mockReturnValue(true);
    render(<StipulationsPanel applicationId="app-x" stipulations={[]} tenantId="tenant-y" />);
    expect(screen.getByTestId("open-stip-workflow-panel")).toBeInTheDocument();
  });

  test("hide META orchestrator CTA when gated off", () => {
    spy.mockReturnValue(false);
    render(<StipulationsPanel applicationId="app-x" stipulations={[]} tenantId="tenant-y" />);
    expect(screen.queryByTestId("open-stip-workflow-panel")).toBeNull();
  });
});
