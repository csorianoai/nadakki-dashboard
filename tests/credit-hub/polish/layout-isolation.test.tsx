import { render, screen } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";

let pathname = "/credit-hub/dealer";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// AppGate wraps protected content in the global Forge shell (ProtectedRoute +
// ModuleShell). Mock the real collaborators it uses today — the legacy
// components/layout/DashboardLayout shell is no longer referenced by AppGate, so
// this test no longer depends on it.
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({
  __esModule: true,
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));


jest.mock("@/components/dealer/DealerSuiteGate", () => ({
  __esModule: true,
  DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  isDealerReachableSuitePath: (p: string) => p.startsWith("/contable"),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isLoading: false, isAuthenticated: true, user: { id: "u" }, allRoles: [{ role_key: "platform_superadmin", core_name: "platform", display_name: "Administrador" }] }),
}));

jest.mock("@/components/ai/OnboardingAgent", () => ({
  __esModule: true,
  default: () => <div data-testid="bot-widget" />,
}));

describe("AppGate shell isolation", () => {
  test("credit-hub dealer portal keeps its own chrome: only the Suite bar, no module shell", () => {
    pathname = "/credit-hub/dealer";
    render(<AppGate>Forge Portal</AppGate>);

    expect(screen.getByText("Forge Portal")).toBeInTheDocument();
    expect(screen.queryByTestId("module-shell")).not.toBeInTheDocument();
    expect(screen.getByTestId("bot-widget")).toBeInTheDocument();
  });

  test("wraps other app routes in the common ModuleShell", () => {
    pathname = "/sic";
    render(<AppGate>SIC Portal</AppGate>);

    expect(screen.getByText("SIC Portal")).toBeInTheDocument();
    expect(screen.getByTestId("module-shell")).toBeInTheDocument();
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
