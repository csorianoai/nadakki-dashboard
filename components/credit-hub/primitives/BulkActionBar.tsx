"use client";

import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BulkActionBarProps } from "@/lib/credit-hub/ch-types";

export function BulkActionBar({
  selectedCount,
  onClear,
  onApply,
  applyLabel = "Aplicar regla",
  disabled = false,
  loading = false,
  className,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-[var(--ch-r-lg)] border px-4 py-3",
        className
      )}
      style={{ background: "var(--ch-persona-primary-soft)", borderColor: "var(--ch-line-2)" }}
      role="region"
      aria-label="Acciones masivas"
    >
      <p className="text-sm font-medium" style={{ color: "var(--ch-ink)" }}>
        {selectedCount} solicitud{selectedCount === 1 ? "" : "es"} seleccionada{selectedCount === 1 ? "" : "s"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="ch-btn ch-btn-secondary" onClick={onClear} disabled={loading}>
          <X className="h-4 w-4" aria-hidden />
          Limpiar
        </button>
        <button
          type="button"
          className="ch-btn ch-btn-primary"
          onClick={onApply}
          disabled={disabled || loading}
          aria-busy={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
