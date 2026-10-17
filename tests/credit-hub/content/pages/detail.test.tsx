import { fireEvent, screen } from "@testing-library/react";
import { renderWithQuery } from "../../renderWithQuery";
import DealerApplicationDetailPage from "@/app/(forge)/credit-hub/dealer/applications/[applicationId]/page";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useApplicationOffers } from "@/lib/credit-hub/hooks/useApplicationOffers";
import { makeApplication } from "../testData";

const push = jest.fn();

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplicationDetail", () => ({
  useCreditApplicationDetail: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useApplicationOffers", () => ({
  useApplicationOffers: jest.fn(),
}));

const mockUseApplication = useCreditApplicationDetail as jest.Mock;
const mockUseOffers = useApplicationOffers as jest.Mock;

function renderDetail(overrides = {}, events = []) {
  mockUseApplication.mockReturnValue({
    application: makeApplication(overrides),
    events,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });
  renderWithQuery(<DealerApplicationDetailPage params={{ applicationId: "app-1" } as never} />);
}

describe("DealerApplicationDetailPage", () => {
  beforeEach(() => {
    push.mockReset();
    mockUseApplication.mockReset();
    mockUseOffers.mockReturnValue({
      offers: [],
      pagination: null,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  test("shows the applicant header and the main sections", () => {
    renderDetail();
    expect(screen.getByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
    expect(screen.getByText("Estado de tu solicitud")).toBeInTheDocument();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Cronología")).toBeInTheDocument();
  });

  test("handles null vehicle data gracefully", () => {
    renderDetail({ vehicle_year: null, vehicle_make: null, vehicle_model: null, vehicle_vin: null });
    expect(screen.getByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
    expect(screen.getByText(/app-1 · —/)).toBeInTheDocument();
  });

  test("back button returns to the dealer applications list", () => {
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: /Mis solicitudes/ }));
    expect(push).toHaveBeenCalledWith("/autos/dealer/credito/solicitudes");
  });

  test("does not expose a dealer-side AI processing action (el análisis vive en el banco)", () => {
    renderDetail();
    expect(screen.queryByRole("button", { name: /Procesar con inteligencia artificial/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Procesar/ })).not.toBeInTheDocument();
  });

  test("renders backend events in timeline", () => {
    renderDetail({}, [{ id: "evt-1", title: "Procesada con IA", description: "Puntaje calculado", created_at: new Date().toISOString() }]);
    expect(screen.getByText("Procesada con IA")).toBeInTheDocument();
    expect(screen.getByText("Puntaje calculado")).toBeInTheDocument();
  });
});
