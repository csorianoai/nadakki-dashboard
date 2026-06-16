import { render, screen } from "@testing-library/react";
import { DealerDashboardView } from "@/components/credit-hub/dealer/DealerDashboardView";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

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
