import { render, screen } from "@testing-library/react";
import { DealerBottomNav } from "@/components/credit-hub/navigation/DealerBottomNav";
import ApplicationsListPage from "@/app/(forge)/credit-hub/dealer/applications/page";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer/applications",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplications", () => ({
  useCreditApplications: jest.fn(),
}));

describe("aria labels", () => {
  test("bottom nav primary action has accessible label", () => {
    render(<DealerBottomNav />);
    expect(screen.getByRole("link", { name: "Nueva solicitud" })).toBeInTheDocument();
  });

  test("mobile FAB has accessible label", () => {
    (useCreditApplications as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null, refetch: jest.fn() });
    render(<ApplicationsListPage />);
    expect(screen.getByRole("link", { name: "Nueva solicitud" })).toBeInTheDocument();
  });
});
