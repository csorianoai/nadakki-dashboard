"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function ProtectedRoute({ children, fallbackPath = "/login" }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, initError, retryInit, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !initError) {
      router.push(fallbackPath);
    }
  }, [isAuthenticated, isLoading, initError, router, fallbackPath]);

  if (initError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forgeSurface-page">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="text-2xl">&#9888;</div>
          <div className="text-forge-sm font-medium text-forgeGray-700">
            No se pudo verificar la sesion
          </div>
          <div className="text-forge-xs text-forgeGray-500">
            {initError}
          </div>
          <div className="flex gap-3">
            <button
              onClick={retryInit}
              className="rounded-md bg-forgeBrand-500 px-4 py-2 text-forge-sm font-medium text-white hover:bg-forgeBrand-600 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={async () => { await logout(); router.push(fallbackPath); }}
              className="rounded-md border border-forgeGray-300 px-4 py-2 text-forge-sm font-medium text-forgeGray-700 hover:bg-forgeGray-50 transition-colors"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forgeSurface-page">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forgeBrand-500 border-t-transparent" />
          <div className="text-forge-sm text-forgeGray-500">Verificando sesion...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
