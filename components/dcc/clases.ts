/** Clases compartidas del DCC. Todo color sale de una variable de lib/dcc/tokens.ts. */
export const DCC_CLASSES = {
  card:
    "h-auto min-w-0 rounded-[var(--dcc-radius)] border border-[var(--dcc-border)] bg-[var(--dcc-surface)] p-[var(--dcc-pad)] shadow-[var(--dcc-shadow)]",
  actionButton:
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--dcc-action)] px-4 text-sm font-semibold text-[var(--dcc-on-action)] transition hover:bg-[var(--dcc-action-hover)] focus-visible:outline-none focus-visible:shadow-[var(--dcc-focus)] disabled:opacity-50",
  quietButton:
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-3 text-sm font-medium text-[var(--dcc-fg)] transition hover:bg-[var(--dcc-surface-muted)] focus-visible:outline-none focus-visible:shadow-[var(--dcc-focus)]",
  muted: "text-[var(--dcc-fg-muted)]",
  subtle: "text-[var(--dcc-fg-subtle)]",
} as const;
