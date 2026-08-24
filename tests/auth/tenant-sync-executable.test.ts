/**
 * C2: V2 auth-context localStorage sync - EXECUTABLE tests.
 * 
 * CRITICAL: These tests EXECUTE code and verify BEHAVIOR, not source.
 * Previous tests read source files and checked for strings - they passed
 * even if the code was commented out.
 * 
 * @jest-environment jsdom
 */

import {LS_KEYS, clearLocalStorage, syncLocalStorage} from "@/lib/auth/auth-context";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { TenantInfo, RoleInfo } from "@/lib/api/auth-v2";

describe("v2 auth-context localStorage sync - EXECUTABLE", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("syncLocalStorage", () => {
    test("writes tenant.id (UUID) not slug", () => {
      const tenant: TenantInfo = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        display_name: "Test Tenant",
        slug: "test-tenant",
        plan: "pro",
        features_enabled: {},
        country_code: "DO",
        locale: "es-DO",
      };

      syncLocalStorage(tenant);

      expect(localStorage.getItem(LS_KEYS.tenantId)).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(localStorage.getItem(LS_KEYS.tenantName)).toBe("Test Tenant");
      expect(localStorage.getItem(LS_KEYS.auth)).toBe("true");
      expect(localStorage.getItem(LS_KEYS.plan)).toBe("pro");
    });

    test("writes role when provided", () => {
      const tenant: TenantInfo = {
        id: "tenant-123",
        display_name: "Test",
        slug: "test",
        plan: "pro",
        features_enabled: {},
        country_code: "DO",
        locale: "es-DO",
      };
      const role: RoleInfo = {
        role_key: "dealer",
        role_name: "Dealer",
        core_name: "credit",
      };

      syncLocalStorage(tenant, role);

      expect(localStorage.getItem(LS_KEYS.role)).toBe("dealer");
    });

    test("writes sicToken when provided", () => {
      const tenant: TenantInfo = {
        id: "tenant-123",
        display_name: "Test",
        slug: "test",
        plan: "pro",
        features_enabled: {},
        country_code: "DO",
        locale: "es-DO",
      };

      syncLocalStorage(tenant, null, "fake-jwt-token");

      expect(localStorage.getItem(LS_KEYS.sicToken)).toBe("fake-jwt-token");
    });
  });

  describe("clearLocalStorage", () => {
    test("removes ALL LS_KEYS from localStorage", () => {
      // Arrange: Populate all LS_KEYS
      localStorage.setItem(LS_KEYS.auth, "true");
      localStorage.setItem(LS_KEYS.tenantId, "tenant-123");
      localStorage.setItem(LS_KEYS.tenantName, "Test Tenant");
      localStorage.setItem(LS_KEYS.role, "dealer");
      localStorage.setItem(LS_KEYS.plan, "pro");
      localStorage.setItem(LS_KEYS.sicToken, "fake-token");

      // Add a non-nadakki key to verify it's NOT removed
      localStorage.setItem("some_other_app", "data");

      expect(localStorage.length).toBe(7);

      // Act: Execute clearLocalStorage
      clearLocalStorage();

      // Assert: ALL nadakki_* keys removed
      expect(localStorage.getItem(LS_KEYS.auth)).toBeNull();
      expect(localStorage.getItem(LS_KEYS.tenantId)).toBeNull();
      expect(localStorage.getItem(LS_KEYS.tenantName)).toBeNull();
      expect(localStorage.getItem(LS_KEYS.role)).toBeNull();
      expect(localStorage.getItem(LS_KEYS.plan)).toBeNull();
      expect(localStorage.getItem(LS_KEYS.sicToken)).toBeNull();

      // Non-nadakki key preserved
      expect(localStorage.getItem("some_other_app")).toBe("data");
    });

    test("SMOKE: commenting out clearLocalStorage logic makes this FAIL", () => {
      /**
       * CRITICAL: This test proves we're testing BEHAVIOR, not source.
       * 
       * To verify: Comment out the `for` loop in clearLocalStorage
       * (lib/auth/auth-context.tsx lines ~44-46) and run this test. It should FAIL.
       * 
       * If it still passes, we're checking source code, not behavior.
       */
      localStorage.setItem(LS_KEYS.auth, "true");
      localStorage.setItem(LS_KEYS.tenantId, "tenant-123");

      clearLocalStorage();

      // If clearLocalStorage's loop is commented out, these FAIL
      expect(localStorage.getItem(LS_KEYS.auth)).toBeNull();
      expect(localStorage.getItem(LS_KEYS.tenantId)).toBeNull();
    });
  });
});

describe("token-storage module - EXECUTABLE", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Reset tokenStorage memory
    tokenStorage.clearTokens();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    tokenStorage.clearTokens();
  });

  test("setTokens stores refresh token in localStorage, access in memory", () => {
    expect(localStorage.length).toBe(0); // Verify clean state

    tokenStorage.setTokens({
      accessToken: "access-123",
      refreshToken: "refresh-456",
    });

    // Access token is in MEMORY, not localStorage
    expect(tokenStorage.getAccessToken()).toBe("access-123");
    // Refresh token is in localStorage
    expect(localStorage.getItem("nadakki_refresh_token_v2")).toBe("refresh-456");
  });

  test("getAccessToken retrieves from memory", () => {
    tokenStorage.setTokens({
      accessToken: "access-789",
      refreshToken: "refresh-000",
    });

    expect(tokenStorage.getAccessToken()).toBe("access-789");
  });

  test("getRefreshToken retrieves from localStorage", () => {
    localStorage.setItem("nadakki_refresh_token_v2", "refresh-abc");

    expect(tokenStorage.getRefreshToken()).toBe("refresh-abc");
  });

  test("clearTokens clears BOTH memory and localStorage", () => {
    // Arrange
    tokenStorage.setTokens({
      accessToken: "access",
      refreshToken: "refresh",
    });
    localStorage.setItem("other_key", "data");

    expect(tokenStorage.getAccessToken()).toBe("access");
    expect(localStorage.getItem("nadakki_refresh_token_v2")).toBe("refresh");

    // Act
    tokenStorage.clearTokens();

    // Assert
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(localStorage.getItem("nadakki_refresh_token_v2")).toBeNull();
    expect(localStorage.getItem("other_key")).toBe("data");
  });

  test("isAuthenticated returns true when access token present", () => {
    tokenStorage.setTokens({
      accessToken: "access",
      refreshToken: "refresh",
    });

    expect(tokenStorage.isAuthenticated()).toBe(true);

    tokenStorage.clearTokens();

    expect(tokenStorage.isAuthenticated()).toBe(false);
  });

  test("SMOKE: commenting out clearTokens makes this FAIL", () => {
    tokenStorage.setTokens({
      accessToken: "access",
      refreshToken: "refresh",
    });

    tokenStorage.clearTokens();

    // If clearTokens is commented out, these FAIL
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(localStorage.getItem("nadakki_refresh_token_v2")).toBeNull();
    expect(tokenStorage.isAuthenticated()).toBe(false);
  });
});

/**
 * Integration tests requiring React environment
 * 
 * These tests verify that AuthContext CALLS the functions we tested above.
 * Since AuthContext uses React hooks, these require Playwright E2E:
 * 
 * - login() calls syncLocalStorage after setTokens
 * - logout() calls clearLocalStorage
 * - switchTenant() calls syncLocalStorage with new_tenant
 * - session init (refresh) calls syncLocalStorage
 * 
 * For now, these are documented here but not executable in Jest.
 * Use Playwright to verify the full flow.
 */
describe.skip("AuthContext integration (requires Playwright)", () => {
  test("login calls syncLocalStorage", async () => {
    // TODO: Playwright E2E
  });

  test("logout calls clearLocalStorage", async () => {
    // TODO: Playwright E2E
  });
});
