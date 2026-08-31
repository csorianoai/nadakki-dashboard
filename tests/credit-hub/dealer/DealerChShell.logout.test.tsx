/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DealerChShell } from "@/components/credit-hub/dealer/DealerChShell";

const push = jest.fn();
const logout = jest.fn(async () => undefined);

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer",
  useRouter: () => ({ push }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ logout }),
}));

jest.mock("@/components/credit-hub/system/CHTenantGuard", () => ({
  CHTenantGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/credit-hub/system/CHPortalAccessGuard", () => ({
  CHPortalAccessGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: {
      institution_name: "Auto Plaza",
      branding: { logo_url: null },
    },
  }),
}));

jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({
  useChromeIdentity: () => ({
    name: "Dealer User",
    initials: "DU",
    email: "dealer@example.test",
    role: "Dealer",
  }),
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

describe("DealerChShell logout", () => {
  beforeEach(() => {
    push.mockClear();
    logout.mockClear();
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  test("the visible sidebar logout button logs out and redirects to login", async () => {
    render(
      <DealerChShell>
        <div>Dealer content</div>
      </DealerChShell>
    );

    fireEvent.click(screen.getByTitle("Cerrar sesión"));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith("/login");
    });
  });
});
