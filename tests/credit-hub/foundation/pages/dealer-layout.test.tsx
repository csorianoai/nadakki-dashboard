import { render, screen } from "@testing-library/react";
import DealerLayout from "@/app/(forge)/credit-hub/dealer/layout";
import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => CREDIT_HUB_ES_DO,
}));

// DealerChShell (PR #140) reads the full tenant config (branding, institution_name)
// and a matchMedia-based mobile flag. Use the real default config shape.
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => {
  const actual = jest.requireActual<typeof import("@/lib/credit-hub/hooks/useTenantConfig")>(
    "@/lib/credit-hub/hooks/useTenantConfig"
  );
  return {
    ...actual,
    useTenantConfig: jest.fn(() => ({
      tenantConfig: actual.getDefaultTenantBankingConfig("dealer-layout-test-tenant"),
      loading: false,
    })),
  };
});

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
});

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ tenantId: "tenant-1", tenantSlug: "tenant-1", loading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => ({ enabled: true, loading: false }),
}));

describe("DealerLayout", () => {
  test("renders dealer shell with navigation and children", () => {
    render(
      <DealerLayout>
        <div>Dealer child</div>
      </DealerLayout>
    );

    expect(screen.getByText("Dealer child")).toBeInTheDocument();
    expect(screen.getAllByText("Solicitudes")[0]).toBeInTheDocument();
    expect(screen.getByText("Nueva")).toBeInTheDocument();
  });
});
