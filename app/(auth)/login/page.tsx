"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { clearLocalStorage, getPostLoginRedirectPath } from "@/lib/auth/auth-context";
import { tokenStorage } from "@/lib/auth/token-storage";
import { AUTH_TENANT_CONTEXT_MISMATCH } from "@/lib/api/auth-v2";
import { resolveDealerManagementRedirect } from "@/lib/dealer-management/redirect";
import {
  resolveDealerAdminHost,
  type DealerAdminHostResolution,
} from "@/lib/dealer-management/admin-host";
import { usePublicTenantBrandingBySlug } from "@/lib/hooks/usePublicTenantBrandingBySlug";
import {
  NEUTRAL_LOGIN_FOOTER,
  resolveVisiblePlatformTitle,
} from "@/lib/white-label/brand-display";
import { Skeleton } from "@/components/forge/ui/Skeleton";
import { resolveBackendUrl } from "@/lib/config/backend-url";

export default function LoginPage() {
  useEffect(() => {
    fetch(`${resolveBackendUrl()}/health`, { method: "GET" }).catch(() => {});
  }, []);
  const router = useRouter();
  const {
    login,
    logout,
    tenant,
    isAuthenticated,
    isLoading,
    allRoles,
    activeRole,
    initError,
    retryInit,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [adminHost, setAdminHost] = useState<DealerAdminHostResolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mismatchHandled = useRef(false);

  useEffect(() => {
    const resolved = resolveDealerAdminHost(window.location.hostname);
    setAdminHost(resolved);
    if (resolved.mode !== "dealer_subdomain") {
      const fromQuery = new URLSearchParams(window.location.search).get("tenant")?.trim().toLowerCase();
      if (fromQuery && /^[a-z0-9][a-z0-9-]*$/.test(fromQuery)) setTenantSlug(fromQuery);
    }
  }, []);

  const hostTenantSlug = adminHost?.mode === "dealer_subdomain" ? adminHost.tenantSlug : undefined;
  const effectiveTenantSlug = hostTenantSlug ?? tenantSlug;
  const brandingQuery = usePublicTenantBrandingBySlug(effectiveTenantSlug || undefined);
  const platformTitle = resolveVisiblePlatformTitle(brandingQuery.data, null);
  const showBrandingSkeleton = Boolean(
    effectiveTenantSlug.trim().length >= 2 && brandingQuery.isPending,
  );

  useEffect(() => {
    if (adminHost === null || isLoading || !isAuthenticated) return;

    if (hostTenantSlug) {
      const actualTenantSlug = tenant?.slug?.trim().toLowerCase();
      if (!actualTenantSlug) return;
      if (actualTenantSlug !== hostTenantSlug) {
        if (!mismatchHandled.current) {
          mismatchHandled.current = true;
          tokenStorage.clearTokens();
          clearLocalStorage();
          setError(AUTH_TENANT_CONTEXT_MISMATCH);
          void logout();
        }
        return;
      }
    }

    const roles = allRoles.length > 0 ? allRoles : activeRole ? [activeRole] : [];
    router.push(resolveDealerManagementRedirect(getPostLoginRedirectPath(roles)));
  }, [
    adminHost,
    isAuthenticated,
    isLoading,
    allRoles,
    activeRole,
    hostTenantSlug,
    tenant?.slug,
    logout,
    router,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(email, password, effectiveTenantSlug || undefined);

    if (!result.ok) {
      if (result.error === AUTH_TENANT_CONTEXT_MISMATCH) {
        tokenStorage.clearTokens();
        clearLocalStorage();
      }
      setError(result.error || "Login failed");
      setSubmitting(false);
      return;
    }

    router.push(resolveDealerManagementRedirect(result.redirectTo ?? "/"));
  };

  if (isLoading && !initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--forge-bg-app)]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--forge-accent)] border-t-transparent" />
          <div className="text-[var(--forge-text-muted)]">Verificando sesión…</div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--forge-bg-app)]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="text-2xl">&#9888;</div>
          <div className="text-sm font-medium text-[var(--forge-text-default)]">
            No pudimos verificar tu sesión
          </div>
          <div className="text-xs text-[var(--forge-text-muted)]">
            {initError}
          </div>
          <button
            onClick={retryInit}
            className="rounded-md bg-[var(--forge-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--forge-bg-app)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--forge-bg-surface)] rounded-lg shadow-lg p-8 border border-[var(--forge-border-default)]">
          <header className="mb-6 text-center">
            {showBrandingSkeleton ? (
              <div className="mx-auto mb-4 flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-lg" label="Logo" />
                <Skeleton className="h-6 w-40" label="Nombre" />
              </div>
            ) : (
              <>
                {brandingQuery.data?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- tenant-hosted logo
                  <img
                    src={brandingQuery.data.logo_url}
                    alt=""
                    className="mx-auto mb-4 h-12 w-auto max-w-[200px] object-contain"
                  />
                ) : null}
                <h1 className="text-2xl font-bold text-[var(--forge-text-default)] mb-2">
                  {platformTitle}
                </h1>
              </>
            )}
            <p className="text-sm text-[var(--forge-text-muted)]">Inicia sesión para continuar</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--forge-text-default)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 border border-[var(--forge-border-default)] rounded-md bg-[var(--forge-bg-surface)] text-[var(--forge-text-default)] focus:outline-none focus:ring-2 focus:ring-[var(--forge-accent)] focus:border-transparent"
                placeholder="admin@tu-institucion.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--forge-text-default)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-[var(--forge-border-default)] rounded-md bg-[var(--forge-bg-surface)] text-[var(--forge-text-default)] focus:outline-none focus:ring-2 focus:ring-[var(--forge-accent)] focus:border-transparent"
              />
            </div>

            {hostTenantSlug ? (
              <div data-testid="dealer-admin-host-context">
                <div className="block text-sm font-medium text-[var(--forge-text-default)] mb-1">
                  Portal
                </div>
                <div className="w-full px-3 py-2 border border-[var(--forge-border-default)] rounded-md bg-[var(--forge-bg-app)] text-[var(--forge-text-muted)]">
                  {hostTenantSlug}.nadakki.com
                </div>
                <p className="text-xs text-[var(--forge-text-muted)] mt-1" data-testid="dealer-admin-host-notice">
                  Estás entrando a {brandingQuery.data?.display_name?.trim() || hostTenantSlug}. Solo
                  pueden ingresar usuarios de este concesionario.
                </p>
                <a
                  href="https://dashboard.nadakki.com/login"
                  data-testid="dealer-admin-other-dealer-link"
                  className="text-xs text-[var(--forge-accent)] underline mt-1 inline-block"
                >
                  Soy de otro concesionario
                </a>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[var(--forge-text-default)] mb-1">
                  Tenant (opcional)
                </label>
                <input
                  type="text"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--forge-border-default)] rounded-md bg-[var(--forge-bg-surface)] text-[var(--forge-text-default)] focus:outline-none focus:ring-2 focus:ring-[var(--forge-accent)] focus:border-transparent"
                  placeholder="tu-institucion"
                />
                <p className="text-xs text-[var(--forge-text-muted)] mt-1">
                  Dejar vacío para tenant por defecto
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--forge-accent)] text-white py-2 px-4 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
            >
              {submitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          <p className="text-xs text-[var(--forge-text-muted)] mt-6 text-center">
            {effectiveTenantSlug.trim().length >= 2 && !showBrandingSkeleton
              ? `${platformTitle} · ${NEUTRAL_LOGIN_FOOTER}`
              : NEUTRAL_LOGIN_FOOTER}
          </p>
        </div>
      </div>
    </div>
  );
}
