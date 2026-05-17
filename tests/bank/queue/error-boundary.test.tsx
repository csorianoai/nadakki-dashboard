/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { BankQueueErrorBoundary } from "@/components/bank-queue/BankQueueErrorBoundary";

describe("BankQueueErrorBoundary", () => {
  it("renders children when healthy", () => {
    render(
      <BankQueueErrorBoundary>
        <span>Healthy queue</span>
      </BankQueueErrorBoundary>,
    );
    expect(screen.getByText(/Healthy queue/)).toBeInTheDocument();
  });
});
