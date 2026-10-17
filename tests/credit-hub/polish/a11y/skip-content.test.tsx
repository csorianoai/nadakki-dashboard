import { render, screen } from "@testing-library/react";
import DealerLayout from "@/app/(forge)/credit-hub/dealer/layout";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ tenantId: "tenant-1", tenantSlug: "tenant-1", loading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => ({ enabled: true, loading: false }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ logout: jest.fn() }),
}));

jest.mock("@/components/credit-hub/system/CHTenantGuard", () => ({
  CHTenantGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/credit-hub/system/CHPortalAccessGuard", () => ({
  CHPortalAccessGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({
  useChromeIdentity: () => ({ name: "Dealer User", initials: "DU", email: "dealer@example.test", role: "Dealer" }),
}));

jest.mock("@/lib/credit-hub/hooks/useNotifications", () => ({
  useNotifications: () => ({ items: [] }),
}));

jest.mock("@/lib/credit-hub/hooks/useDealerTotalUnreadMessages", () => ({
  useDealerTotalUnreadMessages: () => ({ applicationCounts: [], totalUnread: 0 }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplications", () => ({
  useCreditApplications: () => ({ data: [] }),
}));

beforeAll(() => {
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
});

describe("skip to content", () => {
  test("renders skip link and main content target", () => {
    render(
      <DealerLayout>
        <div>Dashboard</div>
      </DealerLayout>
    );

    expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveAttribute("href", "#ch-main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "ch-main");
  });
});
