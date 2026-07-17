"use client";

export function QuickActions({ onAction }: { onAction: (label: string) => void }) {
  const actions = ["Agendar visita", "Calcular cuota", "Aplicar financiamiento"];

  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onAction(label)}
          className="shrink-0 rounded-full border border-nk-border bg-nk-surface-2 px-3 py-1.5 text-xs font-semibold text-nk-fg transition hover:border-brand hover:text-brand"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
