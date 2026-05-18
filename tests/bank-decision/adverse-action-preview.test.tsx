import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdverseActionPreview } from "@/app/(bank)/bank/applications/[id]/components/AdverseActionPreview";

describe("AdverseActionPreview", () => {
  test("renders nothing when not visible", () => {
    const { container } = render(
      <AdverseActionPreview visible={false} acknowledged={false} onAckChange={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("checkbox acknowledges", async () => {
    const onAck = jest.fn();
    render(<AdverseActionPreview visible acknowledged={false} onAckChange={onAck} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onAck).toHaveBeenCalledWith(true);
  });
});
