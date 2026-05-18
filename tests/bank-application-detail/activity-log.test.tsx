import { render, screen } from "@testing-library/react";
import { ActivityLog } from "@/app/(bank)/bank/applications/[id]/components/ActivityLog";

describe("ActivityLog", () => {
  test("shows empty state", () => {
    render(<ActivityLog events={[]} eventsCount={0} />);
    expect(screen.getByText(/sin eventos recientes/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  test("renders event rows and count", () => {
    render(
      <ActivityLog
        events={[{ at: "2025-01-02T12:00:00.000Z", type: "CLAIM", summary: "Tomada" }]}
        eventsCount={12}
      />,
    );
    expect(screen.getByText("CLAIM")).toBeInTheDocument();
    expect(screen.getByText("Tomada")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
