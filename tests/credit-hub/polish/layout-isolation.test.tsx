import { render, screen } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";

let pathname = "/credit-hub/dealer";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

// AppGate wraps protected content in the global Forge shell (ProtectedRoute +
// GlobalForgeAppShell). Mock the real collaborators it uses today — the legacy
// components/layout/DashboardLayout shell is no longer referenced by AppGate, so
// this test no longer depends on it.
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({
  __esModule: true,
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({
  __esModule: true,
  GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="forge-shell">{children}</div>
  ),
}));

jest.mock("@/components/ai/OnboardingAgent", () => ({
  __esModule: true,
  default: () => <div data-testid="bot-widget" />,
}));

describe("AppGate shell isolation", () => {
  test("wraps modern credit-hub routes in the global Forge shell", () => {
    pathname = "/credit-hub/dealer";
    render(<AppGate>Forge Portal</AppGate>);

    expect(screen.getByText("Forge Portal")).toBeInTheDocument();
    expect(screen.getByTestId("forge-shell")).toBeInTheDocument();
    expect(screen.getByTestId("bot-widget")).toBeInTheDocument();
  });

  test("wraps other app routes in the same global Forge shell", () => {
    pathname = "/sic";
    render(<AppGate>SIC Portal</AppGate>);

    expect(screen.getByText("SIC Portal")).toBeInTheDocument();
    expect(screen.getByTestId("forge-shell")).toBeInTheDocument();
    expect(screen.getByTestId("bot-widget")).toBeInTheDocument();
  });

  test("does not render the shell on the login route", () => {
    pathname = "/login";
    render(<AppGate>Login Screen</AppGate>);

    expect(screen.getByText("Login Screen")).toBeInTheDocument();
    expect(screen.queryByTestId("forge-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bot-widget")).not.toBeInTheDocument();
  });
});
