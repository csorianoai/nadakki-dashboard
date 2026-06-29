import { render, screen } from "@testing-library/react";
import { DealerDashboardView } from "@/components/credit-hub/dealer/DealerDashboardView";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useDashboardSummary", () => ({
  useDashboardSummary: () => ({ data: null, isFetching: false, isError: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useBanksRanking", () => ({
  useBanksRanking: () => ({ data: null, isError: true, isLoading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useApplicationOffers", () => ({
  useApplicationOffers: () => ({ offers: [], isLoading: false, isError: false }),
  offersRefetchInterval: () => false,
}));

describe("DealerDashboardView", () => {
  test("renders greeting and institution", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <DealerDashboardView applications={[]} institutionName="Auto Plaza" locale="es-DO" currency="DOP" />
      </div>,
    );
    expect(screen.getByRole("heading", { name: /Cockpit del Dealer/i })).toBeInTheDocument();
    expect(screen.getByTestId("dealer-command-center")).toBeInTheDocument();
    expect(screen.getByTestId("dealer-kpi-strip")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva solicitud/i })).toBeInTheDocument();
  });

  test("does not render undefined currency prefix when amount or currency is missing", () => {
    const apps = [
      {
        application_id: "APP-NULL",
        applicant_name: "Sin Monto",
        status: "submitted",
        requested_amount: null,
        created_at: "2026-06-10T14:30:00.000Z",
        updated_at: "2026-06-14T09:15:00.000Z",
      },
    ] as unknown as CreditApplication[];

    const { container } = render(
      <div className="credit-hub-forge" data-persona="dealer">
        <DealerDashboardView
          applications={apps}
          institutionName="Auto Plaza"
          locale="es-DO"
          currency={undefined as unknown as string}
        />
      </div>,
    );

    expect(container.textContent).not.toMatch(/undefined/i);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
