import { render, screen, fireEvent } from "@testing-library/react";
import { DemoAcceptanceModal } from "@/components/legal/DemoAcceptanceModal";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("DemoAcceptanceModal", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
  });

  it("shows modal when legal_demo_accepted is not set", async () => {
    render(<DemoAcceptanceModal />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Aviso importante antes de continuar/)).toBeInTheDocument();
  });

  it("accept stores flag and hides modal", async () => {
    render(<DemoAcceptanceModal />);
    const accept = await screen.findByRole("button", { name: /Acepto, continuar/i });
    fireEvent.click(accept);
    expect(localStorage.getItem("legal_demo_accepted")).toBe("true");
  });
});
