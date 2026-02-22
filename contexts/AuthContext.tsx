"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "owner" | "admin" | "editor" | "viewer";

const STORAGE_KEYS = {
  auth: "nadakki_auth",
  tenantId: "nadakki_tenant_id",
  tenantName: "nadakki_tenant_name",
  role: "nadakki_role",
  plan: "nadakki_plan",
} as const;

const DEMO_USERS: Record<string, { password: string; tenantId: string; tenantName: string; role: string; plan: string }> = {
  "admin@sfrentals.com": {
    password: "admin123",
    tenantId: "sf-rentals-nadaki-excursions",
    tenantName: "SF Rentals Nadaki Excursions",
    role: "admin",
    plan: "enterprise",
  },
  "admin@nadakki.com": {
    password: "admin123",
    tenantId: "credicefi",
    tenantName: "CrediCefi",
    role: "admin",
    plan: "pro",
  },
};

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
    setState((s) => ({
      ...s,
      isAuthenticated: stored !== null,
      tenantId: stored?.tenantId ?? null,
      tenantName: stored?.tenantName ?? "—",
      role: stored?.role ?? "viewer",
      plan: stored?.plan ?? "starter",
      isLoading: false,
    }));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const key = email.trim().toLowerCase();
    const demo = DEMO_USERS[key];
    if (!demo || demo.password !== password) {
      setState((s) => ({ ...s, error: "Credenciales incorrectas" }));
      return false;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.auth, "true");
      localStorage.setItem(STORAGE_KEYS.tenantId, demo.tenantId);
      localStorage.setItem(STORAGE_KEYS.tenantName, demo.tenantName);
      localStorage.setItem(STORAGE_KEYS.role, demo.role);
      localStorage.setItem(STORAGE_KEYS.plan, demo.plan);
    }

    setState({
      isAuthenticated: true,
      tenantId: demo.tenantId,
      tenantName: demo.tenantName,
      role: demo.role as UserRole,
      plan: demo.plan,
      isLoading: false,
      error: null,
    });
    return true;
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.auth);
      localStorage.removeItem(STORAGE_KEYS.tenantId);
      localStorage.removeItem(STORAGE_KEYS.tenantName);
      localStorage.removeItem(STORAGE_KEYS.role);
      localStorage.removeItem(STORAGE_KEYS.plan);
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
