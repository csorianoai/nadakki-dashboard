import { render, screen } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";

let pathname = "/credit-hub/dealer";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

jest.mock("@/components/auth/RequireAuth", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="require-auth">{children}</div>,
}));

jest.mock("@/components/layout/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="nadakki-shell">{children}</div>,
}));

jest.mock("@/components/ai/OnboardingAgent", () => ({
  __esModule: true,
  default: () => <div data-testid="bot-widget" />,
}));

jest.mock("@/components/pwa/PWAPrompt", () => ({
  __esModule: true,
  default: () => <div data-testid="pwa-prompt" />,
}));

describe("Forge layout isolation", () => {
  test("does not render Nadakki shell for credit-hub routes", () => {
    pathname = "/credit-hub/dealer";
    render(<AppGate>Forge Portal</AppGate>);

    expect(screen.getByText("Forge Portal")).toBeInTheDocument();
    expect(screen.queryByTestId("nadakki-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bot-widget")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pwa-prompt")).not.toBeInTheDocument();
  });

  test("keeps Nadakki shell for legacy routes", () => {
    pathname = "/sic";
    render(<AppGate>Legacy SIC</AppGate>);

    expect(screen.getByTestId("nadakki-shell")).toBeInTheDocument();
    expect(screen.getByTestId("bot-widget")).toBeInTheDocument();
  });
});
