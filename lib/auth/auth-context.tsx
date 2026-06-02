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

const POST_LOGIN_REDIRECT_BY_ROLE: Record<string, string> = {
  platform_superadmin: "/",
  tenant_admin: "/",
  sic_admin: "/sic",
  legal_admin: "/legal-hub",
  marketing_admin: "/marketing",
  credit_admin: "/",
};

/** First matching role wins; credit-hub is intentionally not used (feature-flag off). */
const POST_LOGIN_ROLE_PRIORITY = [
  "platform_superadmin",
  "tenant_admin",
  "sic_admin",
  "legal_admin",
  "marketing_admin",
  "credit_admin",
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

/** Max time to wait for refresh + /me during session init. */
const SESSION_INIT_TIMEOUT_MS = 10_000;

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
        setInitError("El servidor no respondio a tiempo. Verifica tu conexion.");
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
            if (me.data.active_roles.length > 0) {
              setActiveRole(me.data.active_roles[0]);
            }
          }
        } else {
          tokenStorage.clearTokens();
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
    const me = await getMeV2(result.data.access_token);
    const roles = me.ok && me.data ? me.data.active_roles : [result.data.active_role];
    setAllRoles(roles);
    return { ok: true, redirectTo: getPostLoginRedirectPath(roles) };
  };

  const logout = async () => {
    const token = tokenStorage.getAccessToken();
    if (token) await logoutV2(token);
    tokenStorage.clearTokens();
    setUser(null);
    setTenant(null);
    setActiveRole(null);
    setAllRoles([]);
  };

  const switchTenant = async (tenantId?: string, tenantSlug?: string) => {
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
    if (result.data.active_roles.length > 0) {
      setActiveRole(result.data.active_roles[0]);
    }
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
