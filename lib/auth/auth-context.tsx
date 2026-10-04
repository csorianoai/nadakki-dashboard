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
import { clearDealerAccessContextFully } from "@/lib/dealer/access-context";

// ── localStorage keys that must stay in sync with JWT claims ──────────────
/** JWT claim → localStorage keys. TEST HOOK: exported for executable tests (C2). */
export const LS_KEYS = {
  auth: "nadakki_auth",
  tenantId: "nadakki_tenant_id",
  tenantName: "nadakki_tenant_name",
  role: "nadakki_role",
  plan: "nadakki_plan",
  sicToken: "nadakki_sic_token",
} as const;

/** Write tenant/role state to localStorage so legacy contexts, WebSocket
 *  client, and fetch-client all see the current JWT-derived values.
 *  TEST HOOK: exported for executable tests (C2) to verify localStorage writes. */
export function syncLocalStorage(tenant: TenantInfo, role?: RoleInfo | null, accessToken?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEYS.auth, "true");
  localStorage.setItem(LS_KEYS.tenantId, tenant.id);
  localStorage.setItem(LS_KEYS.tenantName, tenant.display_name);
  if (role) localStorage.setItem(LS_KEYS.role, role.role_key);
  localStorage.setItem(LS_KEYS.plan, "pro");
  if (accessToken) localStorage.setItem(LS_KEYS.sicToken, accessToken);
}

/** Clear all nadakki_* keys on logout. TEST HOOK: exported for executable tests (C2) to verify cleanup. */
export function clearLocalStorage() {
  if (typeof window === "undefined") return;
  for (const key of Object.values(LS_KEYS)) {
    localStorage.removeItem(key);
  }
  clearDealerAccessContextFully();
}

/**
 * Destino post-login por rol.
 *
 * `dealer` aterriza en `/autos/dealer`, que es su producto. Antes decia
 * `/credit-hub/dealer` y el destino correcto se conseguia con un mapeo aparte
 * --`lib/dealer-management/redirect.ts`-- aplicado SOLO en los dos router.push
 * de `app/(auth)/login/page.tsx`. Medido: `lib/cockpit/tenant-home.ts:6` llama a
 * `getPostLoginRedirectPath` SIN ese mapeo, y de ahi cuelgan `CockpitSidebar` y
 * `CockpitUserMenu`, asi que el "inicio" de un dealer en el Cockpit apuntaba a
 * `/credit-hub/dealer`. Arreglarlo en el mapa lo arregla en los dos caminos.
 *
 * El redirect se decide por ROL y no mira los cores, y eso se queda como esta:
 * `platform_cores` no tiene fila `autos` --medido: accounting, credit, design,
 * engineering, legal, marketing, platform, salud, sic-- asi que un gate por core
 * dejaria al dealer sin destino. El hostname sigue sin conceder permisos.
 */
const POST_LOGIN_REDIRECT_BY_ROLE: Record<string, string> = {
  platform_superadmin: "/",
  tenant_admin: "/",
  admin: "/credit-hub/bank",
  sic_admin: "/sic",
  legal_admin: "/legal-hub",
  marketing_admin: "/marketing",
  credit_admin: "/credit-hub/bank",
  dealer: "/autos/dealer",
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

/**
 * Techo total del init de sesion, reintentos incluidos. Cada fetch ya corta a
 * los AUTH_FETCH_TIMEOUT_MS (5s); esto solo evita un "Verificando sesion"
 * eterno. Exportado para los tests (W0-2).
 */
export const SESSION_INIT_TIMEOUT_MS = 20_000;

/**
 * Esperas entre intentos del init ante un fallo transitorio (timeout, red,
 * 5xx). Backend en frio en Render: ~4.6s, asi que el primer intento puede
 * expirar y el segundo ya llega caliente. Antes no habia reintento: un solo
 * fallo pintaba el error y habia que pulsar "Reintentar" (W0-2).
 */
export const SESSION_INIT_RETRY_DELAYS_MS: readonly number[] = [1_000, 2_000];

const MSG_TIMEOUT = "El servidor no respondió a tiempo. Verifica tu conexión.";
const MSG_NO_VERIFICADA = "No se pudo verificar la sesión. Intenta de nuevo.";
const MSG_EXPIRADA = "Tu sesión expiró. Inicia sesión nuevamente.";

/** Texto bajo el spinner mientras el init reintenta: "(2 de 3)", "(3 de 3)". */
export function mensajeReintento(intento: number): string {
  return `Reintentando conexión (${intento} de ${1 + SESSION_INIT_RETRY_DELAYS_MS.length})…`;
}

/**
 * LA REGLA: solo un 401 cierra la sesion.
 *
 * Un timeout o un error del servidor NO borran los tokens. Medido en
 * produccion (D8, suite#1501): Libro mayor y Balance se quedaban en
 * "Verificando sesion...", pintaban "El servidor no respondio a tiempo" y
 * acababan en /login. La cadena era esta:
 *
 *   1. Backend en frio --el comentario de arriba mide ~4.6s-- contra un
 *      AUTH_FETCH_TIMEOUT_MS de 5s: el refresh expira.
 *   2. El `else` del refresh llamaba a `clearTokens()` de forma incondicional,
 *      y la comprobacion de `status === 401` venia DESPUES, cuando ya no
 *      quedaban tokens. Un 504 se trataba igual que una sesion revocada.
 *   3. Se pintaba el error con su boton "Reintentar".
 *   4. Pulsar "Reintentar" reejecutaba el init, que ya no encontraba refresh
 *      token, salia por la rama de "no hay sesion" --sin `initError`-- y
 *      ProtectedRoute redirigia a /login.
 *
 * O sea: el boton "Reintentar" ERA el logout. Y cualquier remount hacia lo
 * mismo. Por eso `clearTokens()` vive ahora en una sola rama, la del 401.
 */
function esTimeout(error?: string): boolean {
  return Boolean(error && error.includes("Tiempo de espera"));
}

/** Sin status (red, timeout), 408, 429 o 5xx: vale la pena reintentar. */
function esTransitorio(status?: number): boolean {
  return !status || status === 408 || status === 429 || status >= 500;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resultado de un intento del init. */
type IntentoInit =
  | { tipo: "ok" }
  | { tipo: "sin-sesion" }
  | { tipo: "expirada" }
  | { tipo: "fallo"; mensaje: string; reintentable: boolean };

export interface AuthContextValue {
  user: UserInfo | null;
  tenant: TenantInfo | null;
  activeRole: RoleInfo | null;
  allRoles: RoleInfo[];
  /**
   * Todos los tenants del usuario, de `GET /auth/me` (`all_tenants`). Antes se
   * descartaba, y por eso "Cambiar tenant" se pintaba sin saber si habia a que
   * cambiar. Vacio mientras no se sabe: quien lo lea, fail-closed.
   */
  allTenants: TenantInfo[];
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Non-null when the session init failed (timeout, network error, etc.). */
  initError: string | null;
  /**
   * Progreso del init mientras reintenta ("Reintentando conexión (2 de 3)…").
   * Null en el primer intento y al terminar: el spinner no se queda mudo (W0-2).
   */
  initProgress: string | null;
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
  const [allTenants, setAllTenants] = useState<TenantInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);

  const retryInit = useCallback(() => {
    setInitError(null);
    setInitProgress(null);
    setIsLoading(true);
    setInitAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        // `cancelled` corta el init en vuelo, pero NO toca los tokens: un
        // servidor lento no es una sesion invalida.
        cancelled = true;
        setInitError(MSG_TIMEOUT);
        setInitProgress(null);
        setIsLoading(false);
      }
    }, SESSION_INIT_TIMEOUT_MS);

    const init = async () => {
      for (let intento = 0; ; intento++) {
        const r = await intentar();
        if (cancelled) return;
        if (r.tipo === "expirada") {
          // El unico caso en que la sesion esta muerta de verdad.
          tokenStorage.clearTokens();
          clearLocalStorage();
          setInitError(MSG_EXPIRADA);
          break;
        }
        if (r.tipo !== "fallo") break;
        const espera = SESSION_INIT_RETRY_DELAYS_MS[intento];
        if (!r.reintentable || espera === undefined) {
          // Timeout, 5xx, red caida, ya reintentados: la sesion sigue viva y
          // los tokens se quedan donde estan, para que "Reintentar" tenga
          // algo con lo que reintentar.
          setInitError(r.mensaje);
          break;
        }
        setInitProgress(mensajeReintento(intento + 2));
        await esperar(espera);
        if (cancelled) return;
      }
      setInitProgress(null);
      setIsLoading(false);
      clearTimeout(timeout);
    };

    /** Un intento de refresh + /me. Solo un 401 borra los tokens. */
    const intentar = async (): Promise<IntentoInit> => {
      // Se relee en cada intento: si un intento anterior roto los tokens y
      // luego fallo /me, el siguiente usa el refresh token nuevo.
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) return { tipo: "sin-sesion" };
      try {
        const result = await refreshTokenV2(refreshToken);
        if (cancelled) return { tipo: "ok" };
        if (!result.ok || !result.data) {
          if (result.status === 401) return { tipo: "expirada" };
          console.error("[auth-init] refresh failed (sesion intacta):", result.status, result.error);
          return {
            tipo: "fallo",
            mensaje: esTimeout(result.error) ? MSG_TIMEOUT : MSG_NO_VERIFICADA,
            reintentable: esTransitorio(result.status),
          };
        }
        tokenStorage.setTokens({
          accessToken: result.data.access_token,
          refreshToken: result.data.refresh_token,
        });
        const me = await getMeV2(result.data.access_token);
        if (cancelled) return { tipo: "ok" };
        if (!me.ok || !me.data) {
          if (me.status === 401) return { tipo: "expirada" };
          // Ni timeout ni 5xx de /me cierran la sesion: los tokens que acaba
          // de devolver el refresh son validos y sirven para reintentar.
          console.error("[auth-init] /me failed (sesion intacta):", me.status, me.error);
          return {
            tipo: "fallo",
            mensaje: esTimeout(me.error) ? MSG_TIMEOUT : MSG_NO_VERIFICADA,
            reintentable: esTransitorio(me.status),
          };
        }
        setUser(me.data.user);
        setTenant(me.data.current_tenant);
        setAllRoles(me.data.active_roles);
        setAllTenants(me.data.all_tenants ?? []);
        const firstRole = me.data.active_roles.length > 0 ? me.data.active_roles[0] : null;
        if (firstRole) setActiveRole(firstRole);
        // Keep localStorage in sync on session restore
        syncLocalStorage(me.data.current_tenant, firstRole, result.data.access_token);
        scheduleProactiveRefresh();
        return { tipo: "ok" };
      } catch (err) {
        // Excepcion de red. Los tokens se quedan: no hubo ningun 401.
        console.error("[auth-init] excepcion (sesion intacta):", err);
        return {
          tipo: "fallo",
          mensaje: err instanceof Error && err.message ? err.message : MSG_NO_VERIFICADA,
          reintentable: true,
        };
      }
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
    // El login no trae `all_tenants`. Se pide aparte y sin bloquear: si falla,
    // la lista se queda vacia y "Cambiar tenant" no se pinta.
    setAllTenants([]);
    void getMeV2(result.data.access_token)
      .then((me) => {
        if (me?.ok && me.data) setAllTenants(me.data.all_tenants ?? []);
      })
      .catch(() => {});
    return { ok: true, redirectTo: getPostLoginRedirectPath(roles) };
  };

  const logout = async () => {
    // CRITICAL: Purge ALL wizard drafts on logout (Ley 172-13).
    // Draft contains PII: cédula, nombre, fecha_nacimiento, teléfono, correo,
    // dirección, ingreso_mensual. Must not survive logout in shared device.
    const { purgeAllWizardDrafts } = await import("@/lib/credit-hub/dealer/wizard-draft-storage");
    const { clearSessionStorage } = await import("@/lib/auth/auth-session-cleanup");
    purgeAllWizardDrafts();
    
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const logoutToken = accessToken ?? refreshToken;
    if (logoutToken) await logoutV2(logoutToken, refreshToken ?? undefined);
    tokenStorage.clearTokens();
    clearLocalStorage();
    clearSessionStorage(); // ← NEW: Clear PII from sessionStorage (Ley 172-13)
    cancelProactiveRefresh();
    setUser(null);
    setTenant(null);
    setActiveRole(null);
    setAllRoles([]);
    setAllTenants([]);
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
    allTenants,
    isAuthenticated: user !== null,
    isLoading,
    initError,
    initProgress,
    retryInit,
    login,
    logout,
    switchTenant,
    switchRole,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
