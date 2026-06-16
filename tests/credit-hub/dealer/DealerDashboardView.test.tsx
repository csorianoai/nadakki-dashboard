import { render, screen } from "@testing-library/react";
import { DealerDashboardView } from "@/components/credit-hub/dealer/DealerDashboardView";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("DealerDashboardView", () => {
  test("renders greeting and institution", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <DealerDashboardView applications={[]} institutionName="Auto Plaza" locale="es-DO" currency="DOP" />
      </div>,
    );
    expect(screen.getByRole("heading", { name: /Auto Plaza/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva solicitud de crédito/i })).toBeInTheDocument();
  });
});
