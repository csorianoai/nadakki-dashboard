import { fireEvent, render, screen } from "@testing-library/react";
import DealerApplicationDetailPage from "@/app/(forge)/credit-hub/dealer/applications/[applicationId]/page";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useProcessCreditApplication } from "@/lib/credit-hub/hooks/useProcessCreditApplication";
import { makeApplication } from "../testData";

const back = jest.fn();
const processMutateAsync = jest.fn();

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplicationDetail", () => ({
  useCreditApplicationDetail: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useProcessCreditApplication", () => ({
  useProcessCreditApplication: jest.fn(),
}));

const mockUseApplication = useCreditApplicationDetail as jest.Mock;
const mockUseProcess = useProcessCreditApplication as jest.Mock;

function renderDetail(overrides = {}, events = []) {
  mockUseApplication.mockReturnValue({
    application: makeApplication(overrides),
    events,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });
  render(<DealerApplicationDetailPage params={{ applicationId: "app-1" } as never} />);
}

describe("DealerApplicationDetailPage", () => {
  beforeEach(() => {
    back.mockReset();
    mockUseApplication.mockReset();
    processMutateAsync.mockReset();
    mockUseProcess.mockReturnValue({ mutateAsync: processMutateAsync, isPending: false });
  });

  test("shows tabs correctly", () => {
    renderDetail();
    expect(screen.getByRole("button", { name: /Resumen/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vehículo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Timeline/ })).toBeInTheDocument();
  });

  test("handles null vehicle data gracefully", () => {
    renderDetail({ vehicle_year: null, vehicle_make: null, vehicle_model: null, vehicle_vin: null });
    fireEvent.click(screen.getByRole("button", { name: /Vehículo/ }));
    expect(screen.getByText("Sin información de vehículo")).toBeInTheDocument();
  });

  test("back button works", () => {
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: /Volver/ }));
    expect(back).toHaveBeenCalled();
  });

  test("process button calls backend mutation", () => {
    processMutateAsync.mockResolvedValue(makeApplication());
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: /Procesar con IA/ }));
    expect(processMutateAsync).toHaveBeenCalledWith("ai");
  });

  test("renders backend events in timeline", () => {
    renderDetail({}, [{ id: "evt-1", title: "Procesada por IA", description: "Score calculado", created_at: new Date().toISOString() }]);
    fireEvent.click(screen.getByRole("button", { name: /Timeline/ }));
    expect(screen.getByText("Procesada por IA")).toBeInTheDocument();
    expect(screen.getByText("Score calculado")).toBeInTheDocument();
  });
});
