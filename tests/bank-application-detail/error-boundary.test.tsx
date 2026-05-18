import { render, screen } from "@testing-library/react";
import { BankApplicationDetailErrorBoundary } from "@/components/bank-application-detail/BankApplicationDetailErrorBoundary";

function ThrowingChild() {
  throw new Error("unit-test-throw");
}

describe("BankApplicationDetailErrorBoundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders fallback after child throws", () => {
    render(
      <BankApplicationDetailErrorBoundary>
        <ThrowingChild />
      </BankApplicationDetailErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/error al mostrar el detalle/i)).toBeInTheDocument();
  });
});
