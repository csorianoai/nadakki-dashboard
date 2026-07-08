import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { CreditHubLayoutClient } from "@/app/(forge)/credit-hub/CreditHubLayoutClient";

let pathname = "/credit-hub/bank";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

jest.mock("@/app/(forge)/credit-hub/forge-globals.css", () => ({}));
jest.mock("@/app/credit-hub/credit-hub.css", () => ({}));

jest.mock("@/components/credit-hub/system/CreditHubI18nBootstrap", () => ({
  CreditHubI18nBootstrap: () => null,
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: { is_demo: false, institution_name: "Test Bank" },
    loading: false,
  }),
}));

jest.mock("@/components/forge/ui/DemoModeBanner", () => ({
  DemoModeBanner: () => null,
}));

jest.mock("@/components/forge", () => ({
  ForgeCreditHubAppShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="forge-credit-hub-shell">{children}</div>
  ),
}));

describe("CreditHubLayoutClient bank portal isolation", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-bank-portal-full");
    document.documentElement.removeAttribute("data-ch-portal-full");
  });

  test("bank routes set data-bank-portal-full and skip ForgeCreditHubAppShell", () => {
    pathname = "/credit-hub/bank/applications";
    render(
      <CreditHubLayoutClient>
        <div>Bank content</div>
      </CreditHubLayoutClient>,
    );

    expect(document.documentElement.getAttribute("data-bank-portal-full")).toBe("true");
    expect(screen.getByText("Bank content")).toBeInTheDocument();
    expect(screen.queryByTestId("forge-credit-hub-shell")).not.toBeInTheDocument();
  });

  test("dealer routes keep bank flag isolated and also skip ForgeCreditHubAppShell (unified no-nested-shell)", () => {
    pathname = "/credit-hub/dealer";
    render(
      <CreditHubLayoutClient>
        <div>Dealer content</div>
      </CreditHubLayoutClient>,
    );

    // Bank-specific flag stays bank-only.
    expect(document.documentElement.hasAttribute("data-bank-portal-full")).toBe(false);
    // Dealer portal owns its own chrome (DealerChShell, PR #140), so the global
    // ForgeCreditHubAppShell is skipped on dealer routes too — same no-nested-shell
    // behavior as bank, now driven by the unified data-ch-portal-full flag.
    expect(document.documentElement.getAttribute("data-ch-portal-full")).toBe("true");
    expect(screen.queryByTestId("forge-credit-hub-shell")).not.toBeInTheDocument();
  });
});
