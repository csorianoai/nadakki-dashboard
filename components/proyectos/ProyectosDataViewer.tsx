"use client";

/**
 * Minimal JSON / empty/error shell for provisional Projects endpoints (lista genérica antes de tipar DTOs).
 */

interface ProyectosDataViewerProps {
  title: string;
  subtitle?: string;
  loading: boolean;
  error: Error | null;
  data: unknown | null | undefined;
  emptyMessage?: string;
  onRetry?: () => void;
}

function jsonPreview(payload: unknown): string {
  if (payload === null || payload === undefined) return "";
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function hasRenderablePayload(payload: unknown): boolean {
  if (payload === null || payload === undefined) return false;
  if (Array.isArray(payload)) return payload.length > 0;
  if (typeof payload === "object") return Object.keys(payload as Record<string, unknown>).length > 0;
  if (typeof payload === "string") return payload.trim().length > 0;
  return true;
}

export function ProyectosDataViewer({
  title,
  subtitle,
  loading,
  error,
  data,
  emptyMessage = "Sin registros disponibles desde el servidor (semilla / permisos / filtro tenant).",
  onRetry,
}: ProyectosDataViewerProps) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p> : null}
      </header>

      {loading ? (
        <div className="animate-pulse space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900/60">
          <div className="h-4 w-2/5 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-50">
          <p className="font-medium">No se pudieron obtener los datos</p>
          <p className="mt-1 text-red-800 dark:text-red-200">{error.message}</p>
          {onRetry ? (
            <button
              type="button"
              className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600"
              onClick={onRetry}
            >
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && !error && !hasRenderablePayload(data) ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : null}

      {!loading && !error && hasRenderablePayload(data) ? (
        <pre className="max-h-[min(560px,70vh)] overflow-auto rounded-lg border border-gray-200 bg-slate-50 p-4 text-xs text-slate-800 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-100">
          {jsonPreview(data)}
        </pre>
      ) : null}
    </div>
  );
}
