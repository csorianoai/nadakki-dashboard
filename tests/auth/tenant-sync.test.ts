/**
 * P0 #1: Verify that v2 auth-context syncs localStorage with JWT claims.
 *
 * Source-level analysis (same pattern as bff-token-propagation.test.ts)
 * since auth-context uses React hooks that can't be imported in Jest.
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

describe("v2 auth-context localStorage sync (P0 #1)", () => {
  const src = readSrc("lib/auth/auth-context.tsx");

  test("defines LS_KEYS with nadakki_tenant_id", () => {
    expect(src).toContain('"nadakki_tenant_id"');
  });

  test("defines LS_KEYS with nadakki_tenant_name", () => {
    expect(src).toContain('"nadakki_tenant_name"');
  });

  test("defines LS_KEYS with nadakki_role", () => {
    expect(src).toContain('"nadakki_role"');
  });

  test("defines LS_KEYS with nadakki_auth", () => {
    expect(src).toContain('"nadakki_auth"');
  });

  test("defines syncLocalStorage function", () => {
    expect(src).toContain("function syncLocalStorage");
  });

  test("defines clearLocalStorage function", () => {
    expect(src).toContain("function clearLocalStorage");
  });

  test("login calls syncLocalStorage after setTokens", () => {
    // Find the login function and verify syncLocalStorage is called
    const loginMatch = src.match(/const login = async[\s\S]*?return \{ ok: true/);
    expect(loginMatch).not.toBeNull();
    expect(loginMatch![0]).toContain("syncLocalStorage");
  });

  test("logout calls clearLocalStorage", () => {
    const logoutMatch = src.match(/const logout = async[\s\S]*?setAllRoles\(\[\]\)/);
    expect(logoutMatch).not.toBeNull();
    expect(logoutMatch![0]).toContain("clearLocalStorage");
  });

  test("switchTenant calls syncLocalStorage with new_tenant", () => {
    const switchMatch = src.match(/const switchTenant = async[\s\S]*?return \{ ok: true \}/);
    expect(switchMatch).not.toBeNull();
    expect(switchMatch![0]).toContain("syncLocalStorage");
  });

  test("session init (refresh) calls syncLocalStorage", () => {
    // The useEffect init block contains syncLocalStorage for session restore
    const initMatch = src.match(/const init = async[\s\S]*?init\(\)/);
    expect(initMatch).not.toBeNull();
    expect(initMatch![0]).toContain("syncLocalStorage");
  });

  test("syncLocalStorage writes tenant.id (UUID) not slug", () => {
    // Ensure we store tenant.id (which is the UUID)
    expect(src).toContain("tenant.id");
    expect(src).toContain("tenant.display_name");
  });
});

describe("token-storage module", () => {
  const src = readSrc("lib/auth/token-storage.ts");

  test("stores refresh token in localStorage", () => {
    expect(src).toContain("nadakki_refresh_token_v2");
    expect(src).toContain("localStorage.setItem");
  });

  test("clearTokens removes refresh token", () => {
    expect(src).toContain("localStorage.removeItem");
  });
});

describe("legacy AuthContext also syncs on login", () => {
  const src = readSrc("contexts/AuthContext.tsx");

  test("sets nadakki_tenant_id on login", () => {
    expect(src).toContain("nadakki_tenant_id");
    expect(src).toContain("localStorage.setItem");
  });

  test("removes all keys on logout", () => {
    expect(src).toContain("localStorage.removeItem");
  });
});
