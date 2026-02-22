"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type UserRole = "owner" | "admin" | "editor" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  tenantId: string | null;
  tenantName: string;
  permissions: string[];
  createdAt: string;
  lastLogin: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  refreshSession: () => Promise<void>;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ["*"],
  admin: [
    "campaigns.create", "campaigns.edit", "campaigns.delete", "campaigns.activate",
    "analytics.view", "analytics.export",
    "templates.create", "templates.edit", "templates.delete",
    "settings.view", "settings.edit",
    "users.view", "users.invite",
  ],
  editor: [
    "campaigns.create", "campaigns.edit",
    "analytics.view",
    "templates.create", "templates.edit",
    "settings.view",
  ],
  viewer: [
    "analytics.view",
    "campaigns.view",
    "templates.view",
    "settings.view",
  ],
};

const MOCK_USER: User = {
  id: "user_001",
  email: "admin@nadakki.com",
  name: "Admin User",
  avatar: undefined,
  role: "admin",
  tenantId: null,
  tenantName: "—",
  permissions: ROLE_PERMISSIONS.admin,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
};

const DEFAULT_STATE: AuthState = {
  user: MOCK_USER,
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

const DEFAULT_CONTEXT: AuthContextType = {
  ...DEFAULT_STATE,
  login: async () => true,
  logout: () => {},
  updateUser: () => {},
  hasPermission: () => true,
  hasRole: () => true,
  refreshSession: async () => {},
};

const AuthContext = createContext<AuthContextType>(DEFAULT_CONTEXT);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(DEFAULT_STATE);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    await new Promise(r => setTimeout(r, 500));
    
    if (email && password.length >= 4) {
      const user: User = { ...MOCK_USER, email, name: email.split("@")[0] };
      setState({ user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    }
    
    setState(s => ({ ...s, isLoading: false, error: "Invalid credentials" }));
    return false;
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(s => s.user ? { ...s, user: { ...s.user, ...updates } } : s);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.user) return false;
    if (state.user.role === "owner") return true;
    return state.user.permissions.includes(permission) || state.user.permissions.includes("*");
  }, [state.user]);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!state.user) return false;
    return roles.includes(state.user.role);
  }, [state.user]);

  const refreshSession = useCallback(async () => {}, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, hasPermission, hasRole, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export default AuthContext;