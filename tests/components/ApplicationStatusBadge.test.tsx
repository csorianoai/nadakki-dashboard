import { render, screen } from "@testing-library/react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";

describe("ApplicationStatusBadge — Sub-N status polish", () => {
  test("renders manual_review label with pulse", () => {
    render(<ApplicationStatusBadge status="manual_review" />);
    expect(screen.getByText("Revisión manual")).toBeInTheDocument();
    expect(screen.getByTestId("status-pulse")).toBeInTheDocument();
  });

  test("renders approved_with_stipulations label", () => {
    render(<ApplicationStatusBadge status="approved_with_stipulations" />);
    expect(screen.getByText("Aprobada con condiciones")).toBeInTheDocument();
    expect(screen.queryByTestId("status-pulse")).not.toBeInTheDocument();
  });

  test("renders offered label (post-accept)", () => {
    render(<ApplicationStatusBadge status="offered" />);
    expect(screen.getByText("Ofertada")).toBeInTheDocument();
    expect(screen.queryByTestId("status-pulse")).not.toBeInTheDocument();
  });
});
