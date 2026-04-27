import { fireEvent, render, screen } from "@testing-library/react";
import ApplicationsListPage from "@/app/(forge)/credit-hub/dealer/applications/page";
import { useApplications } from "@/lib/credit-hub/hooks/useApplications";
import { makeApplication } from "../testData";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useApplications", () => ({
  useApplications: jest.fn(),
}));

const mockUseApplications = useApplications as jest.Mock;

describe("ApplicationsListPage", () => {
  beforeEach(() => {
    mockUseApplications.mockReset();
    mockUseApplications.mockReturnValue({
      data: [
        makeApplication({ application_id: "app-1", applicant_name: "Ana Pérez", status: "submitted", vehicle_make: "Toyota" }),
        makeApplication({ application_id: "app-2", applicant_name: "Luis Gómez", status: "draft", vehicle_make: "Honda" }),
      ],
      isLoading: false,
      error: null,
    });
  });

  test("filters work correctly", () => {
    render(<ApplicationsListPage />);
    fireEvent.click(screen.getByRole("button", { name: /Borrador\s*\(1\)/ }));
    expect(screen.getAllByText("Luis Gómez")[0]).toBeInTheDocument();
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
  });

  test("search filters by name", () => {
    render(<ApplicationsListPage />);
    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre, marca, modelo..."), { target: { value: "ana" } });
    expect(screen.getAllByText("Ana Pérez")[0]).toBeInTheDocument();
    expect(screen.queryByText("Luis Gómez")).not.toBeInTheDocument();
  });
});
