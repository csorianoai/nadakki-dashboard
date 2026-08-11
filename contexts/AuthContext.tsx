"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api/fetch-client";
import { clearWizardDraftStorage } from "@/lib/credit-hub/dealer/wizard-draft-storage";

export type UserRole = "owner" | "admin" | "editor" | "viewer";

const STORAGE_KEYS = {
  auth: "nadakki_auth",
  tenantId: "nadakki_tenant_id",
  tenantName: "nadakki_tenant_name",
  role: "nadakki_role",
  plan: "nadakki_plan",
  sicToken: "nadakki_sic_token",
} as const;

// Legacy demo credentials removed — use auth_v2 login flow instead.

function readFromStorage() {
  if (typeof window === "undefined") return null;
  const auth = localStorage.getItem(STORAGE_KEYS.auth);
  if (auth !== "true") return null;
  return {
    tenantId: localStorage.getItem(STORAGE_KEYS.tenantId) ?? null,
    tenantName: localStorage.getItem(STORAGE_KEYS.tenantName) ?? "—",
    role: (localStorage.getItem(STORAGE_KEYS.role) ?? "viewer") as UserRole,
    plan: localStorage.getItem(STORAGE_KEYS.plan) ?? "starter",
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  tenantId: string | null;
  tenantName: string;
  role: UserRole;
  plan: string;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const DEFAULT_STATE: AuthState = {
  isAuthenticated: false,
  tenantId: null,
  tenantName: "—",
  role: "viewer",
  plan: "starter",
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  ...DEFAULT_STATE,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>(DEFAULT_STATE);

  useEffect(() => {
    const stored = readFromStorage();
    const forgeDemoName = process.env.NEXT_PUBLIC_FORGE_TEST_TENANT === "mx" ? "TestBank Mexico" : null;
    setState((s) => ({
      ...s,
      isAuthenticated: stored !== null,
      tenantId: stored?.tenantId ?? null,
      tenantName: forgeDemoName ?? stored?.tenantName ?? "—",
      role: (stored?.role ?? "viewer") as UserRole,
      plan: stored?.plan ?? "starter",
      isLoading: false,
    }));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const key = email.trim().toLowerCase();

    // Authenticate via backend
    try {
      const res = await apiFetch("/api/v2/auth/login", {
        skipAuthHeaders: true,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: key, password }),
      });
      if (!res.ok) {
        setState((s) => ({ ...s, error: "Credenciales incorrectas" }));
        return false;
      }
      const data = await res.json();
      const token = data?.access_token;
      const tenantId = data?.tenant_info?.slug ?? data?.tenant_id ?? "";
      const tenantName = data?.tenant_info?.display_name ?? data?.tenant_name ?? "—";
      const role = data?.active_role?.role_key ?? "viewer";

      if (token && typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.sicToken, token);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.auth, "true");
        localStorage.setItem(STORAGE_KEYS.tenantId, tenantId);
        localStorage.setItem(STORAGE_KEYS.tenantName, tenantName);
        localStorage.setItem(STORAGE_KEYS.role, role);
        localStorage.setItem(STORAGE_KEYS.plan, "pro");
      }
      setState({
        isAuthenticated: true,
        tenantId,
        tenantName,
        role: role as UserRole,
        plan: "pro",
        isLoading: false,
        error: null,
      });
      return true;
    } catch {
      setState((s) => ({ ...s, error: "No se pudo conectar al servidor" }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearWizardDraftStorage();
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.auth);
      localStorage.removeItem(STORAGE_KEYS.tenantId);
      localStorage.removeItem(STORAGE_KEYS.tenantName);
      localStorage.removeItem(STORAGE_KEYS.role);
      localStorage.removeItem(STORAGE_KEYS.plan);
      localStorage.removeItem(STORAGE_KEYS.sicToken);
    }
    setState({
      isAuthenticated: false,
      tenantId: null,
      tenantName: "—",
      role: "viewer",
      plan: "starter",
      isLoading: false,
      error: null,
    });
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export default AuthContext;
