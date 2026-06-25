"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";

export default function LoginPage() {
  // Warmup: ping backend as soon as login page loads to prevent cold start delay
  useEffect(() => {
    fetch("https://nadakki-ai-suite.onrender.com/health", { method: "GET" }).catch(() => {});
  }, []);
  const router = useRouter();
  const { login, isAuthenticated, isLoading, allRoles, activeRole } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--forge-bg-app)]">
        <div className="text-[var(--forge-text-muted)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--forge-bg-app)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--forge-bg-surface)] rounded-lg shadow-lg p-8 border border-[var(--forge-border-default)]">
          <h1 className="text-2xl font-bold text-[var(--forge-text-default)] mb-2">
            Nadakki AI Suite
          </h1>
          <p className="text-sm text-[var(--forge-text-muted)] mb-6">
            Inicia sesión para continuar
          </p>

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
                placeholder="admin@credicefi.com"
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
                placeholder="credicefi"
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
            Nadakki AI Suite - Multi-tenant Platform
          </p>
        </div>
      </div>
    </div>
  );
}
