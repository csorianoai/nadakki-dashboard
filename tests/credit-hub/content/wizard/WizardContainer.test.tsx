import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WizardContainer, buildCreateApplicationPayload } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { useCreateApplication } from "@/lib/credit-hub/hooks/useCreateApplication";

const push = jest.fn();
const back = jest.fn();
const mutateAsync = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreateApplication", () => ({
  useCreateApplication: jest.fn(),
}));

const mockUseCreateApplication = useCreateApplication as jest.Mock;

describe("WizardContainer", () => {
  beforeEach(() => {
    jest.useRealTimers();
    push.mockReset();
    back.mockReset();
    mutateAsync.mockReset();
    mockUseCreateApplication.mockReturnValue({ mutateAsync });
  });

  test("navigates between steps", async () => {
    render(<WizardContainer />);
    fireEvent.change(screen.getByLabelText("Nombre completo *"), { target: { value: "Ana Pérez" } });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Información del Vehículo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    expect(await screen.findByText("Información del Cliente")).toBeInTheDocument();
  });

  test("disables Next when applicant_name is invalid", () => {
    render(<WizardContainer />);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  test("step 2 allows skip", async () => {
    render(<WizardContainer />);
    fireEvent.change(screen.getByLabelText("Nombre completo *"), { target: { value: "Ana Pérez" } });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Información del Vehículo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Financiamiento y Resumen")).toBeInTheDocument();
  });

  test("payload does not include extra fields", () => {
    const payload = buildCreateApplicationPayload(
      {
        applicant_name: " Ana Pérez ",
        applicant_email: "ana@example.com",
        applicant_phone: "",
        vehicle_year: "2024",
        vehicle_make: "Toyota",
        vehicle_model: "",
        vehicle_vin: "ABC123",
        requested_amount: "500000",
        down_payment: "",
      },
      "submitted"
    );

    expect(Object.keys(payload).sort()).toEqual(["applicant_email", "applicant_name", "requested_amount", "status", "vehicle_make", "vehicle_vin", "vehicle_year"].sort());
  });

  test("submit calls API with only allowed fields and redirects to detail", async () => {
    jest.useFakeTimers();
    mutateAsync.mockResolvedValue({ application_id: "app-created" });
    render(<WizardContainer />);

    fireEvent.change(screen.getByLabelText("Nombre completo *"), { target: { value: "Ana Pérez" } });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Información del Vehículo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Financiamiento y Resumen")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Monto solicitado"), { target: { value: "500000" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear Solicitud" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        applicant_name: "Ana Pérez",
        requested_amount: "500000",
        status: "submitted",
      })
    );

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    expect(push).toHaveBeenCalledWith("/credit-hub/dealer/applications/app-created");
    jest.useRealTimers();
  });
});
