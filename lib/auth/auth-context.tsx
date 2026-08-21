"use client";

import { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  loginV2,
  logoutV2,
  getMeV2,
  switchTenantV2,
  switchRoleV2,
  refreshTokenV2,
  type UserInfo,
  type TenantInfo,
  type RoleInfo,
} from "@/lib/api/auth-v2";
import { tokenStorage } from "./token-storage";
import { scheduleProactiveRefresh, cancelProactiveRefresh } from "./token-refresh";
import { clearWizardDraftStorage } from "@/lib/credit-hub/dealer/wizard-draft-storage";

// ── localStorage keys that must stay in sync with JWT claims ──────────────
const LS_KEYS = {
  auth: "nadakki_auth",
  tenantId: "nadakki_tenant_id",
  tenantName: "nadakki_tenant_name",
  role: "nadakki_role",
  plan: "nadakki_plan",
  sicToken: "nadakki_sic_token",
} as const;

/** Write tenant/role state to localStorage so legacy contexts, WebSocket
 *  client, and fetch-client all see the current JWT-derived values. */
function syncLocalStorage(tenant: TenantInfo, role?: RoleInfo | null, accessToken?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEYS.auth, "true");
  localStorage.setItem(LS_KEYS.tenantId, tenant.id);
  localStorage.setItem(LS_KEYS.tenantName, tenant.display_name);
  if (role) localStorage.setItem(LS_KEYS.role, role.role_key);
  localStorage.setItem(LS_KEYS.plan, "pro");
  if (accessToken) localStorage.setItem(LS_KEYS.sicToken, accessToken);
}

/** Clear all nadakki_* keys on logout. */
function clearLocalStorage() {
  if (typeof window === "undefined") return;
  for (const key of Object.values(LS_KEYS)) {
    localStorage.removeItem(key);
  }
}

const POST_LOGIN_REDIRECT_BY_ROLE: Record<string, string> = {
  platform_superadmin: "/",
  tenant_admin: "/",
  admin: "/credit-hub/bank",
  sic_admin: "/sic",
  legal_admin: "/legal-hub",
  marketing_admin: "/marketing",
  credit_admin: "/credit-hub/bank",
  dealer: "/credit-hub/dealer",
  bank_analyst: "/credit-hub/bank",
  banker: "/credit-hub/bank",
};

/** First matching role wins; credit-hub is intentionally not used (feature-flag off). */
const POST_LOGIN_ROLE_PRIORITY = [
  "platform_superadmin",
  "tenant_admin",
  "admin",
  "sic_admin",
  "legal_admin",
  "marketing_admin",
  "credit_admin",
  "dealer",
  "bank_analyst",
  "banker",
] as const;

export function getPostLoginRedirectPath(roles: RoleInfo[]): string {
  const keys = new Set(roles.map((r) => r.role_key));
  for (const roleKey of POST_LOGIN_ROLE_PRIORITY) {
    if (keys.has(roleKey)) {
      return POST_LOGIN_REDIRECT_BY_ROLE[roleKey] ?? "/";
    }
  }
  return "/";
}

/** Max time to wait for refresh + /me during session init (Render cold start ~4.6s). */
const SESSION_INIT_TIMEOUT_MS = 8_000;

export interface AuthContextValue {
  user: UserInfo | null;
  tenant: TenantInfo | null;
  activeRole: RoleInfo | null;
  allRoles: RoleInfo[];
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Non-null when the session init failed (timeout, network error, etc.). */
  initError: string | null;
  /** Retry the session init after a failure. */
  retryInit: () => void;
  login: (
    email: string,
    password: string,
    tenantSlug?: string,
  ) => Promise<{ ok: boolean; error?: string; redirectTo?: string }>;
  logout: () => Promise<void>;
  switchTenant: (tenantId?: string, tenantSlug?: string) => Promise<{ ok: boolean; error?: string }>;
  switchRole: (coreName: string, roleKey: string) => Promise<{ ok: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [activeRole, setActiveRole] = useState<RoleInfo | null>(null);
  const [allRoles, setAllRoles] = useState<RoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);

  const retryInit = useCallback(() => {
    setInitError(null);
    setIsLoading(true);
    setInitAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        setInitError("El servidor no respondió a tiempo. Verifica tu conexión.");
        setIsLoading(false);
      }
    }, SESSION_INIT_TIMEOUT_MS);

    const init = async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        if (!cancelled) setIsLoading(false);
        clearTimeout(timeout);
        return;
      }
      try {
        const result = await refreshTokenV2(refreshToken);
        if (cancelled) return;
        if (result.ok && result.data) {
          tokenStorage.setTokens({
            accessToken: result.data.access_token,
            refreshToken: result.data.refresh_token,
          });
          const me = await getMeV2(result.data.access_token);
          if (cancelled) return;
          if (me.ok && me.data) {
            setUser(me.data.user);
            setTenant(me.data.current_tenant);
            setAllRoles(me.data.active_roles);
            const firstRole = me.data.active_roles.length > 0 ? me.data.active_roles[0] : null;
            if (firstRole) setActiveRole(firstRole);
            // Keep localStorage in sync on session restore
            syncLocalStorage(me.data.current_tenant, firstRole, result.data.access_token);
            scheduleProactiveRefresh();
          } else if (!cancelled) {
            const msg = me.error?.includes("Tiempo de espera")
              ? "El servidor no respondió a tiempo. Verifica tu conexión."
              : "No se pudo verificar la sesión. Intenta de nuevo.";
            console.error("[auth-init] /me failed:", me.error);
            setInitError(msg);
          }
        } else {
          tokenStorage.clearTokens();
          if (!cancelled && result.error) {
            const msg = result.error.includes("Tiempo de espera")
              ? "El servidor no respondió a tiempo. Verifica tu conexión."
              : "No se pudo verificar la sesión. Intenta de nuevo.";
            console.error("[auth-init] refresh failed:", result.error);
            setInitError(msg);
          }
        }
        if (!cancelled) setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        setInitError(err instanceof Error ? err.message : "Error verificando sesion");
        setIsLoading(false);
      }
      clearTimeout(timeout);
    };
    init();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [initAttempt]);

  const login = async (email: string, password: string, tenantSlug?: string) => {
    const result = await loginV2(email, password, tenantSlug);
    if (!result.ok || !result.data) {
      return { ok: false, error: result.error || "Login failed" };
    }
    tokenStorage.setTokens({
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
    });
    setUser(result.data.user_info);
    setTenant(result.data.tenant_info);
    setActiveRole(result.data.active_role);

    // P0 #1 fix: sync localStorage so legacy contexts, WebSocket client,
    // and fetch-client all use the JWT-derived tenant_id (not stale value).
    syncLocalStorage(result.data.tenant_info, result.data.active_role, result.data.access_token);
    scheduleProactiveRefresh();

    // loginV2 ya devuelve active_role — no necesitamos un segundo /me call
    const roles = result.data.active_role ? [result.data.active_role] : [];
    setAllRoles(roles);
    return { ok: true, redirectTo: getPostLoginRedirectPath(roles) };
  };

  const logout = async () => {
    // CRITICAL: Purge ALL wizard drafts on logout (Ley 172-13).
    // Draft contains PII: cédula, nombre, fecha_nacimiento, teléfono, correo,
    // dirección, ingreso_mensual. Must not survive logout in shared device.
    const { purgeAllWizardDrafts } = await import("@/lib/credit-hub/dealer/wizard-draft-storage");
    purgeAllWizardDrafts();
    
    const token = tokenStorage.getAccessToken();
    if (token) await logoutV2(token);
    tokenStorage.clearTokens();
    clearLocalStorage();
    cancelProactiveRefresh();
    setUser(null);
    setTenant(null);
    setActiveRole(null);
    setAllRoles([]);
  };

  const switchTenant = async (tenantId?: string, tenantSlug?: string) => {
    clearWizardDraftStorage(tenant?.id, user?.id);
    const token = tokenStorage.getAccessToken();
    if (!token) return { ok: false, error: "Not authenticated" };
    const result = await switchTenantV2(token, tenantId, tenantSlug);
    if (!result.ok || !result.data) return { ok: false, error: result.error };
    tokenStorage.setTokens({
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
    });
    setTenant(result.data.new_tenant);
    setAllRoles(result.data.active_roles);
    const newRole = result.data.active_roles.length > 0 ? result.data.active_roles[0] : null;
    if (newRole) setActiveRole(newRole);
    syncLocalStorage(result.data.new_tenant, newRole, result.data.access_token);
    scheduleProactiveRefresh();
    return { ok: true };
  };

  const switchRole = async (coreName: string, roleKey: string) => {
    const token = tokenStorage.getAccessToken();
    if (!token) return { ok: false, error: "Not authenticated" };
    const result = await switchRoleV2(token, coreName, roleKey);
    if (!result.ok || !result.data) return { ok: false, error: result.error };
    tokenStorage.setTokens({
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
    });
    setActiveRole(result.data.active_role);
    return { ok: true };
  };

  const refreshSession = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return;
    const result = await refreshTokenV2(refreshToken);
    if (result.ok && result.data) {
      tokenStorage.setTokens({
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
      });
    }
  };

  const value: AuthContextValue = {
    user,
    tenant,
    activeRole,
    allRoles,
    isAuthenticated: user !== null,
    isLoading,
    initError,
    retryInit,
    login,
    logout,
    switchTenant,
    switchRole,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
