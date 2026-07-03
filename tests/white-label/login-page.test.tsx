import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";
import { NEUTRAL_PLATFORM_TITLE } from "@/lib/white-label/brand-display";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: jest.fn(),
    isAuthenticated: false,
    isLoading: false,
    allRoles: [],
    activeRole: null,
  }),
}));

jest.mock("@/lib/hooks/usePublicTenantBrandingBySlug", () => ({
  usePublicTenantBrandingBySlug: () => ({
    data: null,
    isPending: false,
  }),
}));

beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as jest.Mock;
});

describe("LoginPage white-label", () => {
  it("uses neutral platform title when branding unavailable", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(NEUTRAL_PLATFORM_TITLE);
    expect(screen.getByRole("heading", { level: 1 }).textContent).not.toMatch(/nadakki/i);
  });
});
