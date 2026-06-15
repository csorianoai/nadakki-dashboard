import { renderHook, act } from "@testing-library/react";
import { useMarketIntelTenant } from "@/app/market-intel/hooks/useMarketIntelTenant";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/contexts/TenantContext", () => ({
  useTenant: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTenant = useTenant as jest.MockedFunction<typeof useTenant>;

const authDefaults = {
  user: null,
  tenant: null,
  activeRole: null,
  allRoles: [],
  isAuthenticated: false,
  initError: null,
  retryInit: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  switchTenant: jest.fn(),
  switchRole: jest.fn(),
  refreshSession: jest.fn(),
};

const tenantContextDefaults = {
  tenantId: null,
  settings: {} as never,
  setTenantId: jest.fn(),
  updateSettings: jest.fn(),
  isFeatureEnabled: jest.fn(),
  checkLimit: jest.fn(),
};

describe("useMarketIntelTenant", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseAuth.mockReturnValue({ ...authDefaults, isLoading: true });
    mockUseTenant.mockReturnValue(tenantContextDefaults);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("resolves tenant from v2 auth when legacy TenantContext is empty", () => {
    mockUseAuth.mockReturnValue({
      ...authDefaults,
      isLoading: false,
      tenant: {
        id: "d3b00111-0000-0000-0000-000000d3b001",
        slug: "nadakki-demo",
        display_name: "Nadakki Demo (internal)",
        subscribed_cores: ["credit"],
      },
    });

    const { result } = renderHook(() => useMarketIntelTenant());

    expect(result.current.tenantHydrated).toBe(true);
    expect(result.current.effectiveTenantId).toBe("d3b00111-0000-0000-0000-000000d3b001");
    expect(result.current.tenantError).toBeNull();
  });

  test("shows tenant error only after auth hydration and 5s without any tenant", () => {
    mockUseAuth.mockReturnValue({ ...authDefaults, isLoading: false, tenant: null });

    const { result } = renderHook(() => useMarketIntelTenant());

    expect(result.current.tenantHydrated).toBe(true);
    expect(result.current.effectiveTenantId).toBeUndefined();
    expect(result.current.tenantError).toBeNull();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.tenantError).toBe("No se pudo determinar el tenant activo");
  });

  test("falls back to legacy TenantContext tenantId when auth tenant is not ready", () => {
    mockUseAuth.mockReturnValue({ ...authDefaults, isLoading: false, tenant: null });
    mockUseTenant.mockReturnValue({
      ...tenantContextDefaults,
      tenantId: "legacy-tenant-uuid",
    });

    const { result } = renderHook(() => useMarketIntelTenant());

    expect(result.current.effectiveTenantId).toBe("legacy-tenant-uuid");
    expect(result.current.tenantError).toBeNull();
  });

  test("stays loading until v2 auth finishes initializing", () => {
    mockUseAuth.mockReturnValue({ ...authDefaults, isLoading: true, tenant: null });

    const { result } = renderHook(() => useMarketIntelTenant());

    expect(result.current.tenantHydrated).toBe(false);
    expect(result.current.tenantError).toBeNull();
  });
});
