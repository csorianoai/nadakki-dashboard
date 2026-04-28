import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BankBulkActionsBar } from "@/components/credit-hub/bank/BankBulkActionsBar";
import { useBulkActions } from "@/lib/credit-hub/hooks/useBulkActions";

jest.mock("@/lib/credit-hub/hooks/useBulkActions", () => ({
  useBulkActions: jest.fn(),
}));

const mutateAsync = jest.fn();

describe("BankBulkActionsBar", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    (useBulkActions as jest.Mock).mockReturnValue({ mutateAsync, isPending: false, data: null });
  });

  test("does not render when no applications selected", () => {
    render(<BankBulkActionsBar selectedIds={[]} />);
    expect(screen.queryByText(/Acción en lote/)).not.toBeInTheDocument();
  });

  test("confirms before executing bulk action", async () => {
    mutateAsync.mockResolvedValue({ processed: 2, skipped: 0, errors: 0 });
    render(<BankBulkActionsBar selectedIds={["a", "b"]} />);
    fireEvent.change(screen.getByPlaceholderText(/Describe la regla/), { target: { value: "Regla score alto para lote." } });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar lote/ }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ applicationIds: ["a", "b"] })));
  });
});
