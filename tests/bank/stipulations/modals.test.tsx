import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StipulationVerifyModal } from "@/components/bank/stipulations/StipulationVerifyModal";
import { StipulationRejectModal } from "@/components/bank/stipulations/StipulationRejectModal";

describe("StipulationVerifyModal", () => {
  test("calls onConfirm and onClose on success", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<StipulationVerifyModal open title="T" onClose={onClose} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: /confirmar verificación/i }));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe("StipulationRejectModal", () => {
  test("disables submit until reason length ok", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<StipulationRejectModal open title="T" onClose={jest.fn()} onConfirm={onConfirm} />);
    const submit = screen.getByRole("button", { name: /^rechazar$/i });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/motivo/i), "no");
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/motivo/i), "pe");
    expect(submit).not.toBeDisabled();
  });
});
