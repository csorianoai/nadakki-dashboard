"use client";

import "./screen-states.css";

type LoadingProps = {
  cards?: number;
  columns?: number;
};

export function MonetizacionScreenLoading({ cards = 4, columns = 2 }: LoadingProps) {
  const style = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } as const;
  return (
    <div className="fm-screen-state" aria-busy="true" aria-live="polite" aria-label="Cargando datos">
      <div className="fm-screen-skeleton-grid" style={style}>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="fm-ui-card fm-screen-skeleton-card">
            <div className="fm-screen-skeleton-line fm-screen-skeleton-line--sm" />
            <div className="fm-screen-skeleton-line fm-screen-skeleton-line--lg fm-mono" />
            <div className="fm-screen-skeleton-line fm-screen-skeleton-line--md" />
          </div>
        ))}
      </div>
    </div>
  );
}

type ErrorProps = {
  onRetry: () => void;
  message?: string;
};

export function MonetizacionScreenError({
  onRetry,
  message = "No se pudieron leer los eventos de origen.",
}: ErrorProps) {
  return (
    <div className="fm-screen-state fm-screen-state--centered" role="alert">
      <p className="fm-screen-state-copy">{message}</p>
      <button type="button" className="fm-screen-state-btn" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

type EmptyProps = {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function MonetizacionScreenEmpty({ message, ctaLabel, onCta }: EmptyProps) {
  return (
    <div className="fm-screen-state fm-screen-state--centered">
      <p className="fm-screen-state-copy">{message}</p>
      {ctaLabel && onCta ? (
        <button type="button" className="fm-screen-state-btn fm-screen-state-btn--ghost" onClick={onCta}>
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}
