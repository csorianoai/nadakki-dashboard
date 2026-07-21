"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAuthHeaders } from "@/lib/api/fetch-client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { isTenantSlug, TENANTS } from "@/lib/tenants";

export interface AuthContextType {
  tenantId: string;
  userId: string;
  authToken: string;
  role: string;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeJwtSub(token: string): string {
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      sub?: string;
      user_id?: string;
    };
    return json.sub ?? json.user_id ?? "";
  } catch {
    return "";
  }
}

function resolveTenantId(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? TENANTS.nadakki.tenantId;
  }

  const storedTenant = window.localStorage.getItem("nadakki_tenant_id");
  if (storedTenant) return storedTenant;

  const slug =
    document.documentElement.getAttribute("data-tenant") ??
    window.localStorage.getItem("nadakki-autos-tenant");
  if (slug && isTenantSlug(slug)) return TENANTS[slug].tenantId;

  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? TENANTS.nadakki.tenantId;
}

function resolveAuthToken(): string {
  const v2 = tokenStorage.getAccessToken();
  if (v2) return v2;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("nadakki_sic_token") ?? "";
  }
  return "";
}

function readAuthState(): AuthContextType {
  const tenantId = resolveTenantId();
  const authToken = resolveAuthToken();
  const userId =
    (typeof window !== "undefined" ? window.localStorage.getItem("user_id") : null) ??
    (authToken ? decodeJwtSub(authToken) : "");
  const role =
    (typeof window !== "undefined" ? window.localStorage.getItem("nadakki_role") : null) ??
    "dealer";

  return {
    tenantId,
    userId,
    authToken,
    role,
    isAuthenticated: Boolean(authToken && tenantId && userId),
    loading: false,
  };
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthContextType>(() => ({
    tenantId: "",
    userId: "",
    authToken: "",
    role: "dealer",
    isAuthenticated: false,
    loading: true,
  }));

  useEffect(() => {
    const syncAuth = () => {
      try {
        setAuth(readAuthState());
      } catch (error) {
        setAuth({
          tenantId: "",
          userId: "",
          authToken: "",
          role: "dealer",
          isAuthenticated: false,
          loading: false,
          error: error instanceof Error ? error.message : "Auth initialization failed",
        });
      }
    };

    syncAuth();

    const handleStorageChange = () => syncAuth();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Keep Bearer header path in sync for apiFetch consumers in same tab.
  useEffect(() => {
    if (auth.authToken) {
      getAuthHeaders();
    }
  }, [auth.authToken]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
