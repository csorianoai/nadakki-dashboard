import { render, screen } from "@testing-library/react";
import DealerDashboardPage from "@/app/(forge)/credit-hub/dealer/page";
import { useApplications } from "@/lib/credit-hub/hooks/useApplications";
import { makeApplication } from "../testData";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useApplications", () => ({
  useApplications: jest.fn(),
}));

const mockUseApplications = useApplications as jest.Mock;

describe("DealerDashboardPage", () => {
  beforeEach(() => {
    mockUseApplications.mockReset();
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
});
