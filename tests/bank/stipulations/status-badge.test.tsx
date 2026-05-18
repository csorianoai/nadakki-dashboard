import { render, screen } from "@testing-library/react";
import { StipulationStatusBadge } from "@/components/bank/stipulations/StatusBadge";

describe("StipulationStatusBadge", () => {
  test("pending label", () => {
    render(<StipulationStatusBadge status="pending" />);
    expect(screen.getByTestId("stipulation-status-pending")).toHaveTextContent(/pendiente/i);
  });

  test("verified label", () => {
    render(<StipulationStatusBadge status="verified" />);
    expect(screen.getByTestId("stipulation-status-verified")).toHaveTextContent(/verificado/i);
  });
});
