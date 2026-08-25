"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";
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
  const { login, isAuthenticated, isLoading, allRoles, activeRole, initError, retryInit } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const brandingQuery = usePublicTenantBrandingBySlug(tenantSlug || undefined);
  const platformTitle = resolveVisiblePlatformTitle(brandingQuery.data, null);
  const showBrandingSkeleton = Boolean(tenantSlug.trim().length >= 2 && brandingQuery.isPending);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const roles = allRoles.length > 0 ? allRoles : activeRole ? [activeRole] : [];
      router.push(getPostLoginRedirectPath(roles));
    }
  }, [isAuthenticated, isLoading, allRoles, activeRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(email, password, tenantSlug || undefined);

    if (!result.ok) {
      setError(result.error || "Login failed");
      setSubmitting(false);
      return;
    }

    router.push(result.redirectTo ?? "/");
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
            {tenantSlug.trim().length >= 2 && !showBrandingSkeleton
              ? `${platformTitle} · ${NEUTRAL_LOGIN_FOOTER}`
              : NEUTRAL_LOGIN_FOOTER}
          </p>
        </div>
      </div>
    </div>
  );
}
