import { render, screen } from "@testing-library/react";
import { DealerNotificationsView } from "@/components/credit-hub/dealer/DealerNotificationsView";

describe("DealerNotificationsView", () => {
  test("renders tabs", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <DealerNotificationsView items={[]} />
      </div>,
    );
    expect(screen.getByRole("heading", { name: /Notificaciones/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Todas/i })).toBeInTheDocument();
  });
});
