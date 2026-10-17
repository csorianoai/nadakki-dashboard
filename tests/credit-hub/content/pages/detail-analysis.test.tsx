import { screen } from "@testing-library/react";
import { renderWithQuery } from "../../renderWithQuery";
import DealerApplicationDetailPage from "@/app/(forge)/credit-hub/dealer/applications/[applicationId]/page";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useApplicationOffers } from "@/lib/credit-hub/hooks/useApplicationOffers";
import { makeApplication } from "../testData";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplicationDetail", () => ({
  useCreditApplicationDetail: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useApplicationOffers", () => ({
  useApplicationOffers: jest.fn(),
}));

const mockUseApplication = useCreditApplicationDetail as jest.Mock;
const mockUseOffers = useApplicationOffers as jest.Mock;

// El panel de análisis detallado vive hoy en las vistas del banco; el dealer ve el resultado como score.
describe("DealerApplicationDetailPage analysis result", () => {
  beforeEach(() => {
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

  test("shows the engine score when the backend returns one", () => {
    mockUseApplication.mockReturnValue({
      application: makeApplication({ application_id: "app-1", score: 812 }),
      events: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithQuery(<DealerApplicationDetailPage params={{ applicationId: "app-1" } as never} />);
    expect(screen.getByText("Resultado del análisis")).toBeInTheDocument();
    expect(screen.getByText("Score 812")).toBeInTheDocument();
  });

  test("hides the analysis card when there is no score", () => {
    mockUseApplication.mockReturnValue({
      application: makeApplication({ application_id: "app-1", score: null }),
      events: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithQuery(<DealerApplicationDetailPage params={{ applicationId: "app-1" } as never} />);
    expect(screen.queryByText("Resultado del análisis")).not.toBeInTheDocument();
  });
});
