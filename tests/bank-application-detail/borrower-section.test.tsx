import { render, screen } from "@testing-library/react";
import { BorrowerSection } from "@/app/(bank)/bank/applications/[id]/components/BorrowerSection";

describe("BorrowerSection", () => {
  test("renders masked cédula and employment line", () => {
    render(
      <BorrowerSection
        borrower={{
          cedula_masked: "XXX-XXXXXXX-X",
          dob_year: 1985,
          income_monthly: 75000,
          employment: { employer: "ACME", position: "Dev", tenure_months: 12 },
        }}
      />,
    );
    expect(screen.getByText("XXX-XXXXXXX-X")).toBeInTheDocument();
    expect(screen.getByText("1985")).toBeInTheDocument();
    expect(screen.getByText(/ACME · Dev/)).toBeInTheDocument();
    expect(screen.getByText(/Antigüedad: 12 meses/)).toBeInTheDocument();
  });

  test("shows placeholders when borrower empty", () => {
    render(<BorrowerSection borrower={{} as never} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
