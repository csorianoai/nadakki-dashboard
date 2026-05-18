import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReasonCodesSelect } from "@/app/(bank)/bank/applications/[id]/components/ReasonCodesSelect";

describe("ReasonCodesSelect", () => {
  test("empty message when decision type unset", () => {
    render(<ReasonCodesSelect decisionType={null} value={[]} onChange={jest.fn()} />);
    expect(screen.getByText(/elige un tipo/i)).toBeInTheDocument();
  });

  test("toggles code when checkbox clicked", async () => {
    const onChange = jest.fn();
    render(<ReasonCodesSelect decisionType="APPROVE" value={[]} onChange={onChange} />);
    const box = screen.getAllByRole("checkbox")[0];
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalled();
  });
});
