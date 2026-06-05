/**
 * Audit #4 P1: sic_token refresh + retry-on-401 tests.
 *
 * Validates:
 * - token-refresh.ts: proactive refresh scheduling, JWT exp decoding
 * - fetch-client.ts: retry-on-401 logic, proactive refresh before request
 * - auth-context.tsx: scheduleProactiveRefresh on login/init/switch, cancel on logout
 */

import * as fs from "fs";
import * as path from "path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

describe("token-refresh module (Layer 1: proactive refresh)", () => {
  const src = readSrc("lib/auth/token-refresh.ts");

  test("exports refreshAccessToken function", () => {
    expect(src).toMatch(/export function refreshAccessToken/);
  });

  test("exports scheduleProactiveRefresh function", () => {
    expect(src).toMatch(/export function scheduleProactiveRefresh/);
  });

  test("exports cancelProactiveRefresh function", () => {
    expect(src).toMatch(/export function cancelProactiveRefresh/);
  });

  test("exports isTokenExpiringSoon function", () => {
    expect(src).toMatch(/export function isTokenExpiringSoon/);
  });

  test("decodes JWT exp claim for scheduling", () => {
    expect(src).toContain("decodeJwtExp");
    expect(src).toContain("payload.exp");
  });

  test("uses REFRESH_MARGIN_SEC of 120 seconds (2 min before expiry)", () => {
    expect(src).toMatch(/REFRESH_MARGIN_SEC\s*=\s*120/);
  });

  test("deduplicates concurrent refresh calls (single-flight)", () => {
    expect(src).toContain("refreshInFlight");
  });

  test("syncs refreshed token to localStorage nadakki_sic_token", () => {
    expect(src).toContain('"nadakki_sic_token"');
    expect(src).toContain("localStorage.setItem");
  });

  test("calls refreshTokenV2 with stored refresh token", () => {
    expect(src).toContain("refreshTokenV2");
    expect(src).toContain("tokenStorage.getRefreshToken");
  });

  test("re-schedules after successful refresh", () => {
    // After refresh, should schedule next proactive refresh
    const refreshFnMatch = src.match(/refreshAccessToken[\s\S]*?finally/);
    expect(refreshFnMatch).not.toBeNull();
    expect(refreshFnMatch![0]).toContain("scheduleProactiveRefresh");
  });

  test("clears timer on cancelProactiveRefresh", () => {
    expect(src).toContain("clearTimeout");
  });
});

describe("fetch-client retry-on-401 (Layer 2: reactive refresh)", () => {
  const src = readSrc("lib/api/fetch-client.ts");

  test("imports refreshAccessToken from token-refresh", () => {
    expect(src).toContain("refreshAccessToken");
    expect(src).toContain("token-refresh");
  });

  test("imports isTokenExpiringSoon from token-refresh", () => {
    expect(src).toContain("isTokenExpiringSoon");
  });

  test("has _isRetry flag to prevent infinite loops", () => {
    expect(src).toContain("_isRetry");
  });

  test("proactively refreshes before request if token expiring soon", () => {
    // The apiFetch function should check isTokenExpiringSoon and call refreshAccessToken
    const apiFetchMatch = src.match(/export async function apiFetch[\s\S]*?return response/);
    expect(apiFetchMatch).not.toBeNull();
    expect(apiFetchMatch![0]).toContain("isTokenExpiringSoon");
    expect(apiFetchMatch![0]).toContain("refreshAccessToken");
  });

  test("retries on 401 response with refreshed token", () => {
    expect(src).toContain("response.status === 401");
    expect(src).toContain("refreshAccessToken");
    // Should call apiFetch recursively with _isRetry: true
    expect(src).toContain("_isRetry: true");
  });

  test("does NOT retry if _isRetry is already true (no infinite loop)", () => {
    // The 401 check should include !_isRetry
    expect(src).toMatch(/401.*!_isRetry|!_isRetry.*401/s);
  });

  test("does NOT retry if skipAuthHeaders is true", () => {
    expect(src).toMatch(/401.*!skipAuthHeaders|!skipAuthHeaders.*401/s);
  });
});

describe("auth-context proactive refresh integration", () => {
  const src = readSrc("lib/auth/auth-context.tsx");

  test("imports scheduleProactiveRefresh", () => {
    expect(src).toContain("scheduleProactiveRefresh");
    expect(src).toContain("token-refresh");
  });

  test("imports cancelProactiveRefresh", () => {
    expect(src).toContain("cancelProactiveRefresh");
  });

  test("calls scheduleProactiveRefresh after login", () => {
    const loginMatch = src.match(/const login = async[\s\S]*?return \{ ok: true/);
    expect(loginMatch).not.toBeNull();
    expect(loginMatch![0]).toContain("scheduleProactiveRefresh");
  });

  test("calls cancelProactiveRefresh on logout", () => {
    const logoutMatch = src.match(/const logout = async[\s\S]*?setAllRoles\(\[\]\)/);
    expect(logoutMatch).not.toBeNull();
    expect(logoutMatch![0]).toContain("cancelProactiveRefresh");
  });

  test("calls scheduleProactiveRefresh after session init (refresh)", () => {
    const initMatch = src.match(/const init = async[\s\S]*?init\(\)/);
    expect(initMatch).not.toBeNull();
    expect(initMatch![0]).toContain("scheduleProactiveRefresh");
  });

  test("calls scheduleProactiveRefresh after switchTenant", () => {
    const switchMatch = src.match(/const switchTenant = async[\s\S]*?return \{ ok: true \}/);
    expect(switchMatch).not.toBeNull();
    expect(switchMatch![0]).toContain("scheduleProactiveRefresh");
  });
});
