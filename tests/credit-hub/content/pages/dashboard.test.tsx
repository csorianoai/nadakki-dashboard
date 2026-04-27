import { render, screen } from "@testing-library/react";
import DealerDashboardPage from "@/app/(forge)/credit-hub/dealer/page";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useCreditStats } from "@/lib/credit-hub/hooks/useCreditStats";
import { makeApplication } from "../testData";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplications", () => ({
  useCreditApplications: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditStats", () => ({
  useCreditStats: jest.fn(),
}));

const mockUseApplications = useCreditApplications as jest.Mock;
const mockUseStats = useCreditStats as jest.Mock;

describe("DealerDashboardPage", () => {
  beforeEach(() => {
    mockUseApplications.mockReset();
    mockUseStats.mockReset();
    mockUseStats.mockReturnValue({ data: null, isLoading: false, error: null, refetch: jest.fn() });
  });

  test("loads applications from API", () => {
    mockUseApplications.mockReturnValue({ data: [makeApplication()], isLoading: false, error: null });
    render(<DealerDashboardPage />);
    expect(mockUseApplications).toHaveBeenCalled();
    expect(screen.getByText("Solicitudes Recientes")).toBeInTheDocument();
    expect(screen.getAllByText("Ana Pérez")[0]).toBeInTheDocument();
  });

  test("shows empty state when no applications", () => {
    mockUseApplications.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<DealerDashboardPage />);
    expect(screen.getByText("No hay solicitudes aún")).toBeInTheDocument();
  });

  test("renders stats from Credit Core when available", () => {
    mockUseApplications.mockReturnValue({ data: [], isLoading: false, error: null, refetch: jest.fn() });
    mockUseStats.mockReturnValue({
      data: {
        total_applications: 7,
        draft_applications: 2,
        submitted_applications: 3,
        processing_applications: 1,
        approved_applications: 1,
        rejected_applications: 0,
        applications_this_week: 4,
        average_score: null,
        approval_rate: null,
        raw: {},
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<DealerDashboardPage />);
    expect(screen.getByText("Total Solicitudes")).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });
});
