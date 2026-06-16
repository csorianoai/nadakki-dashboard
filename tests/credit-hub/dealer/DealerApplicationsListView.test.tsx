import { render, screen } from "@testing-library/react";
import { DealerApplicationsListView } from "@/components/credit-hub/dealer/DealerApplicationsListView";

describe("DealerApplicationsListView", () => {
  test("renders list heading", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <DealerApplicationsListView applications={[]} currency="MXN" />
      </div>,
    );
    expect(screen.getByRole("heading", { name: /Solicitudes/i })).toBeInTheDocument();
  });
});
