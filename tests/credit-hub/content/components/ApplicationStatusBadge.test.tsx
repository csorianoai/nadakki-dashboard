import { render, screen } from "@testing-library/react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";

describe("ApplicationStatusBadge", () => {
  test('pulses for "submitted"', () => {
    render(<ApplicationStatusBadge status="submitted" />);
    expect(screen.getByText("Enviada")).toBeInTheDocument();
    expect(screen.getByTestId("status-pulse")).toBeInTheDocument();
  });

  test("renders draft label without pulse", () => {
    render(<ApplicationStatusBadge status="draft" />);
    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(screen.queryByTestId("status-pulse")).not.toBeInTheDocument();
  });
});
