/**
 * Standalone token refresh utility — usable outside React context.
 *
 * Provides:
 * - `refreshAccessToken()`: refresh v2 access token using stored refresh token
 * - `scheduleProactiveRefresh()`: set timer to refresh before expiry
 * - `isTokenExpiringSoon()`: check if current token expires within threshold
 *
 * Audit #4 P1: nadakki_sic_token (which IS the v2 access_token synced to
 * localStorage) expired after ~16 min with no auto-refresh, causing 401
 * on POST /api/v2/credit/applications.
 */

import { tokenStorage } from "./token-storage";
import { refreshTokenV2 } from "@/lib/api/auth-v2";

/** Refresh 2 minutes before expiry. */
const REFRESH_MARGIN_SEC = 120;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshInFlight: Promise<boolean> | null = null;

/** Decode JWT payload without signature verification (same as middleware). */
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const payload = JSON.parse(decoded);
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Check if current access token expires within the threshold. */
export function isTokenExpiringSoon(thresholdSec: number = REFRESH_MARGIN_SEC): boolean {
  const token = tokenStorage.getAccessToken();
  if (!token) return true;
  const exp = decodeJwtExp(token);
  if (!exp) return true;
  return exp - Math.floor(Date.now() / 1000) <= thresholdSec;
}

/**
 * Refresh the v2 access token using the stored refresh token.
 * Updates tokenStorage and localStorage (nadakki_sic_token).
 * Returns true on success, false on failure.
 *
 * Deduplicates concurrent refresh calls (single-flight).
 */
export function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) return false;

      const result = await refreshTokenV2(refreshToken);
      if (!result.ok || !result.data) return false;

      tokenStorage.setTokens({
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
      });

      // Sync to localStorage for legacy clients (same as auth-context syncLocalStorage)
      if (typeof window !== "undefined") {
        localStorage.setItem("nadakki_sic_token", result.data.access_token);
      }

      // Re-schedule next refresh based on new token's expiry
      scheduleProactiveRefresh();

      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Schedule a timer to proactively refresh the access token before it expires.
 * Call after login, session restore, or any token update.
 */
export function scheduleProactiveRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const token = tokenStorage.getAccessToken();
  if (!token) return;

  const exp = decodeJwtExp(token);
  if (!exp) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const secsUntilRefresh = exp - nowSec - REFRESH_MARGIN_SEC;

  if (secsUntilRefresh <= 0) {
    // Token already near expiry — refresh immediately
    refreshAccessToken();
    return;
  }

  refreshTimer = setTimeout(() => {
    refreshAccessToken();
  }, secsUntilRefresh * 1000);
}

/** Cancel any pending proactive refresh timer (e.g. on logout). */
export function cancelProactiveRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}
