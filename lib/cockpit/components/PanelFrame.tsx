"use client";

import type { ReactNode } from "react";

export function PanelFrame({
  title,
  badge,
  children,
  testId,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="ch-card" style={{ padding: 16 }} data-testid={testId}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--ch-text)]">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2" role="status" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-[var(--ch-surface-3)]" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export function PanelError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-[var(--ch-danger)] bg-[var(--ch-danger-soft)] p-4 text-sm" data-testid="cockpit-panel-error">
      <p className="text-[var(--ch-danger-text)]">{message}</p>
      {onRetry ? (
        <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm mt-3" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
