"use client";

import { useQuery } from "@tanstack/react-query";
import { LegalApiHttpError } from "@/lib/legal/parse-api-error";
import {
  fetchValidationQueue,
  fetchValidationQueueSummary,
  openReviewItems,
  type ValidationQueueItem,
  type ValidationQueueSummary,
} from "@/lib/legal/validation-queue-api";

const noReintentarPermisos = (count: number, err: unknown) =>
  !(err instanceof LegalApiHttpError && (err.status === 401 || err.status === 403)) && count < 1;

export interface ValidationQueueState {
  /** Ítems que esperan revisión, ordenados por urgencia. */
  open: ValidationQueueItem[];
  /** null = no se sabe (cargando, sin permiso o error): nunca se muestra como 0. */
  openCount: number | null;
  /** La página no trae todos los ítems abiertos (la lista visible está recortada). */
  partial: boolean;
  loading: boolean;
  /** true si el usuario no tiene un rol de abogado para ver la cola (401/403). */
  forbidden: boolean;
  error: boolean;
}

export function useValidationQueue(tenantId: string | undefined): ValidationQueueState {
  const q = useQuery({
    queryKey: ["legal_validation_queue", tenantId ?? ""],
    enabled: Boolean(tenantId?.trim()),
    queryFn: () => fetchValidationQueue(tenantId!),
    retry: noReintentarPermisos,
    staleTime: 30_000,
  });
  const forbidden =
    q.error instanceof LegalApiHttpError && (q.error.status === 401 || q.error.status === 403);
  const open = q.data ? openReviewItems(q.data.items) : [];
  const partial = Boolean(q.data && q.data.hasMore);
  // Total del servidor si lo da; si no, solo se cuenta la página cuando está completa.
  const openCount = q.data ? (q.data.total ?? (partial ? null : open.length)) : null;
  return {
    open,
    openCount,
    partial,
    loading: q.isLoading,
    forbidden,
    error: Boolean(q.error) && !forbidden,
  };
}


export interface ValidationQueueSummaryState {
  /** null = no disponible (cargando, sin permiso, error o backend sin el endpoint). */
  summary: ValidationQueueSummary | null;
  loading: boolean;
  forbidden: boolean;
  error: boolean;
}

/** Agregado de la cola calculado en el servidor (GET /validation-queue/summary). */
export function useValidationQueueSummary(tenantId: string | undefined): ValidationQueueSummaryState {
  const q = useQuery({
    queryKey: ["legal_validation_queue_summary", tenantId ?? ""],
    enabled: Boolean(tenantId?.trim()),
    queryFn: () => fetchValidationQueueSummary(tenantId!),
    retry: noReintentarPermisos,
    staleTime: 30_000,
  });
  const forbidden =
    q.error instanceof LegalApiHttpError && (q.error.status === 401 || q.error.status === 403);
  return { summary: q.data ?? null, loading: q.isLoading, forbidden, error: Boolean(q.error) && !forbidden };
}
