import { render, screen } from "@testing-library/react";
import { VehicleSection } from "@/app/(bank)/bank/applications/[id]/components/VehicleSection";

describe("VehicleSection", () => {
  test("joins year make model and shows VIN", () => {
    render(
      <VehicleSection
        vehicle={{ year: 2022, make: "Toyota", model: "Corolla", vin: "VIN123", dealer_location: "DN" }}
      />,
    );
    expect(screen.getByText(/2022 · Toyota · Corolla/)).toBeInTheDocument();
    expect(screen.getByText("VIN123")).toBeInTheDocument();
    expect(screen.getByText("DN")).toBeInTheDocument();
  });

  test("shows em dash when empty", () => {
    render(<VehicleSection vehicle={{}} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
