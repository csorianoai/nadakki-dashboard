import { render, screen } from "@testing-library/react";
import { ForgeGlobalTopbar } from "@/components/forge/layout/ForgeGlobalTopbar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer",
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    tenant: { id: "t1", display_name: "Credicefi", slug: "credicefi" },
  }),
}));

jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({
    data: { display_name: "Credicefi", logo_url: null },
    isPending: false,
  }),
}));

jest.mock("@/components/forge/layout/ForgeCommandPaletteContext", () => ({
  useForgeCommandPaletteOptional: () => null,
}));

jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ TenantSwitcher: () => null }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ UserMenu: () => null }));

describe("ForgeGlobalTopbar white-label", () => {
  it("shows tenant display_name instead of Nadakki", () => {
    render(<ForgeGlobalTopbar onMenuClick={() => {}} />);
    expect(screen.getByRole("link", { name: "Credicefi" })).toBeInTheDocument();
    expect(screen.queryByText(/^Nadakki$/i)).not.toBeInTheDocument();
  });
});
