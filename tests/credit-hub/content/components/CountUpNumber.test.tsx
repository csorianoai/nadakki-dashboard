import { render, screen, waitFor } from "@testing-library/react";
import { CountUpNumber } from "@/components/credit-hub/dealer/CountUpNumber";

describe("CountUpNumber", () => {
  test("animates from 0 to target", async () => {
    render(<CountUpNumber value={12} duration={0.01} prefix="RD$ " />);
    expect(screen.getByText("RD$ 0")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("RD$ 12")).toBeInTheDocument(), { timeout: 1500 });
  });
});
