import { fireEvent, render, screen } from "@testing-library/react";
import DealerApplicationDetailPage from "@/app/credit-hub/dealer/applications/[applicationId]/page";
import { useApplication } from "@/lib/credit-hub/hooks/useApplication";
import { makeApplication } from "../testData";

const back = jest.fn();

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

jest.mock("@/lib/credit-hub/hooks/useApplication", () => ({
  useApplication: jest.fn(),
}));

const mockUseApplication = useApplication as jest.Mock;

function renderDetail(overrides = {}) {
  mockUseApplication.mockReturnValue({
    data: makeApplication(overrides),
    isLoading: false,
    error: null,
  });
  render(<DealerApplicationDetailPage params={{ applicationId: "app-1" } as never} />);
}

describe("DealerApplicationDetailPage", () => {
  beforeEach(() => {
    back.mockReset();
    mockUseApplication.mockReset();
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
});
