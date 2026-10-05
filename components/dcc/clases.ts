/**
 * Clases compartidas del DCC. Todo color sale de una variable de lib/dcc/tokens.ts.
 * Roles: boton principal marino; enlaces y acciones secundarias turquesa
 * (variante -ink, AA sobre claro); cifras principales en dorado legible.
 */
export const DCC_CLASSES = {
  card:
    "h-auto min-w-0 rounded-[var(--dcc-radius)] border border-[var(--dcc-border)] bg-[var(--dcc-surface)] p-[var(--dcc-pad)] shadow-[var(--dcc-shadow)]",
  /** Filo superior dorado: solo tarjetas clave (Brief, Cola de atencion). */
  filoClave: "border-t-[3px] border-t-[var(--dcc-gold)]",
  actionButton:
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--dcc-action)] px-4 text-sm font-semibold text-[var(--dcc-on-action)] transition hover:bg-[var(--dcc-action-hover)] focus-visible:outline-none focus-visible:shadow-[var(--dcc-focus)] disabled:opacity-50",
  quietButton:
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-3 text-sm font-medium text-[var(--dcc-fg)] transition hover:bg-[var(--dcc-surface-muted)] focus-visible:outline-none focus-visible:shadow-[var(--dcc-focus)]",
  link: "inline-flex items-center gap-1 text-sm font-semibold text-[var(--dcc-teal-ink)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--dcc-focus)]",
  cifra: "font-dealer-numeric font-semibold text-[var(--dcc-gold-ink)]",
  muted: "text-[var(--dcc-fg-muted)]",
  subtle: "text-[var(--dcc-fg-subtle)]",
} as const;
