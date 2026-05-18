import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionPanel } from "@/app/(bank)/bank/applications/[id]/components/ActionPanel";
import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";

const baseDetail = (): BankApplicationDetailResponse => ({
  application_id: "a",
  queue_status: "pending",
  borrower_name_masked: "X",
  amount: 1,
  currency: "DOP",
  dealer: { id: "d", name: "D" },
  borrower: {},
  vehicle: {},
  scoring: {},
});

describe("ActionPanel", () => {
  test("disables Reclamar when user already owns", () => {
    const detail = baseDetail();
    detail.bank_claim = { current_user_owns: true };
    render(<ActionPanel detail={detail} claimLoading={false} onClaim={jest.fn()} onDecide={jest.fn()} />);
    expect(screen.getByRole("button", { name: /reclamar/i })).toBeDisabled();
    expect(screen.getByText(/Tienes la solicitud asignada/i)).toBeInTheDocument();
  });

  test("enables Reclamar when pending and not owned", () => {
    const detail = baseDetail();
    detail.queue_status = "pending";
    render(<ActionPanel detail={detail} claimLoading={false} onClaim={jest.fn()} onDecide={jest.fn()} />);
    expect(screen.getByRole("button", { name: /^reclamar$/i })).not.toBeDisabled();
  });

  test("calls onDecide when decisión clicked", async () => {
    const onDecide = jest.fn();
    render(<ActionPanel detail={baseDetail()} claimLoading={false} onClaim={jest.fn()} onDecide={onDecide} />);
    await userEvent.click(screen.getByRole("button", { name: /decisión/i }));
    expect(onDecide).toHaveBeenCalledTimes(1);
  });
});
