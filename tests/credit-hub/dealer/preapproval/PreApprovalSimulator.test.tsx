import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreApprovalSimulator } from "@/components/credit-hub/dealer/preapproval/PreApprovalSimulator";
import { getDefaultTenantBankingConfig, useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => {
  const actual = jest.requireActual<typeof import("@/lib/credit-hub/hooks/useTenantConfig")>("@/lib/credit-hub/hooks/useTenantConfig");
  return {
    ...actual,
    useTenantConfig: jest.fn(() => ({
      tenantConfig: { ...actual.getDefaultTenantBankingConfig("sim-test-tenant") },
      loading: false,
    })),
  };
});

const mockUseTenantConfig = useTenantConfig as unknown as jest.Mock;

describe("PreApprovalSimulator", () => {
  beforeEach(() => {
    sessionStorage.removeItem("nadakki-credit-hub-scenarios");
    mockUseTenantConfig.mockReturnValue({
      tenantConfig: { ...getDefaultTenantBankingConfig("sim-test-tenant"), features_enabled: { ...getDefaultTenantBankingConfig("sim-test-tenant").features_enabled, preapproval_simulator: true } },
      loading: false,
    });
  });

  it("renders simulator with default inputs", () => {
    render(<PreApprovalSimulator />);
    expect(screen.getByTestId("preapproval-simulator")).toBeInTheDocument();
  });

  it("displays simulator results", () => {
    render(<PreApprovalSimulator />);
    expect(screen.getByText(/Aprobable|Ajustar|Riesgoso/i)).toBeInTheDocument();
  });

  it("recalculates when inputs change", async () => {
    const user = userEvent.setup();
    render(<PreApprovalSimulator />);
    const priceInput = screen.getByLabelText(/Precio del vehículo/i);
    await user.clear(priceInput);
    await user.type(priceInput, "2000000");
    expect(await screen.findByText(/Cuota mensual estimada/i)).toBeInTheDocument();
  });

  it("saves scenario to sessionStorage", async () => {
    const user = userEvent.setup();
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("Mi escenario");
    render(<PreApprovalSimulator />);
    const saveButton = screen.getByRole("button", { name: /guardar escenario/i });
    await user.click(saveButton);
    expect(sessionStorage.getItem("nadakki-credit-hub-scenarios")).toBeTruthy();
    promptSpy.mockRestore();
  });

  it("calls onConvertToApplication when button clicked", async () => {
    const user = userEvent.setup();
    const onConvert = jest.fn();
    render(<PreApprovalSimulator onConvertToApplication={onConvert} />);
    const convertButton = screen.getByRole("button", { name: /convertir en solicitud/i });
    await user.click(convertButton);
    expect(onConvert).toHaveBeenCalled();
  });
});
