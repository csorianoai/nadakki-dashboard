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

  it("shows modal when post-sello acceptance is not set", async () => {
    render(<DemoAcceptanceModal />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Piloto controlado — Legal Core RD \(Fase 2\)/)).toBeInTheDocument();
  });

  it("accept stores post-sello and legacy flags and hides modal", async () => {
    render(<DemoAcceptanceModal />);
    const accept = await screen.findByRole("button", { name: /Acepto, continuar/i });
    fireEvent.click(accept);
    expect(localStorage.getItem("legal_post_sello_accepted")).toBe("true");
    expect(localStorage.getItem("legal_demo_accepted")).toBe("true");
  });
});
