import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CounterOfferCalculator } from "@/app/(bank)/bank/applications/[id]/components/CounterOfferCalculator";
import type { CounterTermsState } from "@/app/(bank)/bank/applications/[id]/components/CounterOfferCalculator";

describe("CounterOfferCalculator", () => {
  test("shows placeholder PTI until debounce", async () => {
    jest.useFakeTimers();
    const v: CounterTermsState = {
      amount: 200000,
      interest_rate: 12,
      term_months: 48,
      down_payment_pct: 5,
      no_match: false,
    };
    const onChange = jest.fn();
    render(
      <CounterOfferCalculator currency="DOP" grossMonthlyIncome={80000} value={v} onChange={onChange} />,
    );
    await act(async () => {
      jest.advanceTimersByTime(55);
    });
    await waitFor(() => {
      const el = screen.getByText(/PTI proyectado/i).closest("div");
      expect(el?.textContent).not.toMatch(/—\s*$/);
    });
    jest.useRealTimers();
  });

  test("no_match forwards through onChange", async () => {
    const v: CounterTermsState = {
      amount: 100000,
      interest_rate: 10,
      term_months: 36,
      down_payment_pct: 0,
      no_match: false,
    };
    const onChange = jest.fn();
    render(
      <CounterOfferCalculator currency="DOP" grossMonthlyIncome={50000} value={v} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ no_match: true }));
  });
});
