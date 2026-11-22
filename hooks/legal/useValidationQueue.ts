"use client";

import { useQuery } from "@tanstack/react-query";
import { LegalApiHttpError } from "@/lib/legal/parse-api-error";
import {
  fetchValidationQueue,
  openReviewItems,
  type ValidationQueueItem,
} from "@/lib/legal/validation-queue-api";

export interface ValidationQueueState {
  /** Ítems que esperan revisión, ordenados por urgencia. */
  open: ValidationQueueItem[];
  /** null = no se sabe (cargando, sin permiso o error): nunca se muestra como 0. */
  openCount: number | null;
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
    retry: (count, err) =>
      !(err instanceof LegalApiHttpError && (err.status === 401 || err.status === 403)) && count < 1,
    staleTime: 30_000,
  });
  const forbidden =
    q.error instanceof LegalApiHttpError && (q.error.status === 401 || q.error.status === 403);
  const open = q.data ? openReviewItems(q.data.items) : [];
  return {
    open,
    openCount: q.data ? open.length : null,
    loading: q.isLoading,
    forbidden,
    error: Boolean(q.error) && !forbidden,
  };
}
