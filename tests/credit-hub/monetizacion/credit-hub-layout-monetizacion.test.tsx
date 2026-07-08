import { render, screen } from "@testing-library/react";
import { CreditHubLayoutClient } from "@/app/(forge)/credit-hub/CreditHubLayoutClient";

let pathname = "/credit-hub";

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
    tenantConfig: { is_demo: false, institution_name: "Test" },
    loading: false,
  }),
}));

jest.mock("@/components/forge/ui/DemoModeBanner", () => ({
  DemoModeBanner: () => null,
}));

jest.mock("@/components/forge", () => ({
  ForgeCreditHubAppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ch-forge-shell">{children}</div>
  ),
}));

jest.mock("@/lib/env/feature-forge-monetizacion", () => ({
  isForgeMonetizacionEnabled: jest.fn(() => false),
}));

import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";

const mockFlag = isForgeMonetizacionEnabled as jest.MockedFunction<typeof isForgeMonetizacionEnabled>;

describe("CreditHubLayoutClient — monetización portal bypass", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-ch-portal-full");
    document.documentElement.removeAttribute("data-bank-portal-full");
    mockFlag.mockReturnValue(false);
  });

  test("flag OFF on monetización path keeps Credit Hub shell (H1/H4)", () => {
    pathname = "/credit-hub/monetizacion/dashboard";
    mockFlag.mockReturnValue(false);

    render(<CreditHubLayoutClient>Content</CreditHubLayoutClient>);

    expect(screen.getByTestId("ch-forge-shell")).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-ch-portal-full")).toBeNull();
  });

  test("flag ON on monetización path bypasses Credit Hub shell (H2)", () => {
    pathname = "/credit-hub/monetizacion/dashboard";
    mockFlag.mockReturnValue(true);

    render(<CreditHubLayoutClient>Content</CreditHubLayoutClient>);

    expect(screen.queryByTestId("ch-forge-shell")).not.toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-ch-portal-full")).toBe("true");
  });

  test("bank portal still bypasses with flag OFF (regression)", () => {
    pathname = "/credit-hub/bank";
    mockFlag.mockReturnValue(false);

    render(<CreditHubLayoutClient>Bank</CreditHubLayoutClient>);

    expect(screen.queryByTestId("ch-forge-shell")).not.toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-ch-portal-full")).toBe("true");
  });
});
