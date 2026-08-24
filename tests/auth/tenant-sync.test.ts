/**
 * F2: Verify that v2 auth-context syncs localStorage with JWT claims.
 *
 * REWRITTEN: Now EXECUTES code instead of reading source (was C2).
 * This test will FAIL if syncLocalStorage/clearLocalStorage are commented out.
 *
 * @jest-environment jsdom
 */

import { syncLocalStorage, clearLocalStorage } from "@/lib/auth/auth-context";

describe("v2 auth-context localStorage sync (F2 - executable)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("syncLocalStorage writes nadakki_auth", () => {
    const tenant = { id: "tenant-123", display_name: "Test Tenant" };
    const role = { role_key: "dealer", role_name: "Dealer" };

    syncLocalStorage(tenant, role);

    expect(localStorage.getItem("nadakki_auth")).toBe("true");
  });

  test("syncLocalStorage writes nadakki_tenant_id (UUID)", () => {
    const tenant = { id: "550e8400-e29b-41d4-a716-446655440000", display_name: "Test" };

    syncLocalStorage(tenant);

    expect(localStorage.getItem("nadakki_tenant_id")).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  test("syncLocalStorage writes nadakki_tenant_name", () => {
    const tenant = { id: "tenant-123", display_name: "Banco de Prueba" };

    syncLocalStorage(tenant);

    expect(localStorage.getItem("nadakki_tenant_name")).toBe("Banco de Prueba");
  });

  test("syncLocalStorage writes nadakki_role when provided", () => {
    const tenant = { id: "t1", display_name: "T1" };
    const role = { role_key: "admin", role_name: "Admin" };

    syncLocalStorage(tenant, role);

    expect(localStorage.getItem("nadakki_role")).toBe("admin");
  });

  test("syncLocalStorage writes nadakki_sic_token when provided", () => {
    const tenant = { id: "t1", display_name: "T1" };
    const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

    syncLocalStorage(tenant, null, accessToken);

    expect(localStorage.getItem("nadakki_sic_token")).toBe(accessToken);
  });

  test("syncLocalStorage sets plan to 'pro'", () => {
    const tenant = { id: "t1", display_name: "T1" };

    syncLocalStorage(tenant);

    expect(localStorage.getItem("nadakki_plan")).toBe("pro");
  });

  test("clearLocalStorage removes all nadakki_* keys", () => {
    // Arrange: Populate localStorage with auth keys
    localStorage.setItem("nadakki_auth", "true");
    localStorage.setItem("nadakki_tenant_id", "tenant-123");
    localStorage.setItem("nadakki_tenant_name", "Test Tenant");
    localStorage.setItem("nadakki_role", "dealer");
    localStorage.setItem("nadakki_plan", "pro");
    localStorage.setItem("nadakki_sic_token", "token123");
    localStorage.setItem("other_app_key", "should remain");

    expect(localStorage.length).toBeGreaterThan(1);

    // Act: Clear auth keys
    clearLocalStorage();

    // Assert: All nadakki_* keys removed
    expect(localStorage.getItem("nadakki_auth")).toBeNull();
    expect(localStorage.getItem("nadakki_tenant_id")).toBeNull();
    expect(localStorage.getItem("nadakki_tenant_name")).toBeNull();
    expect(localStorage.getItem("nadakki_role")).toBeNull();
    expect(localStorage.getItem("nadakki_plan")).toBeNull();
    expect(localStorage.getItem("nadakki_sic_token")).toBeNull();

    // Non-nadakki keys remain
    expect(localStorage.getItem("other_app_key")).toBe("should remain");
  });

  test("MUTATION: clearLocalStorage commented out makes test FAIL", () => {
    /**
     * CRITICAL: This test proves it's NOT source-level.
     *
     * To verify: Comment out the loop in clearLocalStorage
     * (lib/auth/auth-context.tsx line ~46-48) and run this test. It should FAIL.
     */
    localStorage.setItem("nadakki_auth", "true");
    localStorage.setItem("nadakki_tenant_id", "test");

    clearLocalStorage();

    // If clearLocalStorage is commented out, this FAILS
    expect(localStorage.getItem("nadakki_auth")).toBeNull();
    expect(localStorage.getItem("nadakki_tenant_id")).toBeNull();
  });

  test("syncLocalStorage then clearLocalStorage removes all auth state", () => {
    // Simulate login
    const tenant = { id: "t1", display_name: "Test" };
    const role = { role_key: "dealer", role_name: "Dealer" };
    const accessToken = "token123";

    syncLocalStorage(tenant, role, accessToken);

    expect(localStorage.getItem("nadakki_auth")).toBe("true");
    expect(localStorage.getItem("nadakki_tenant_id")).toBe("t1");
    expect(localStorage.getItem("nadakki_role")).toBe("dealer");
    expect(localStorage.getItem("nadakki_sic_token")).toBe("token123");

    // Simulate logout
    clearLocalStorage();

    expect(localStorage.getItem("nadakki_auth")).toBeNull();
    expect(localStorage.getItem("nadakki_tenant_id")).toBeNull();
    expect(localStorage.getItem("nadakki_role")).toBeNull();
    expect(localStorage.getItem("nadakki_sic_token")).toBeNull();
  });
});
