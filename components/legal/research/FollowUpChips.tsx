"use client";

type Props = {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function FollowUpChips({ prompts, onSelect, disabled }: Props) {
  if (prompts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Preguntas de seguimiento sugeridas">
      {prompts.map((p, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          className="rounded-full border border-[var(--legal-accent-strong)]/35 bg-[var(--legal-accent-strong)]/10 px-3 py-1.5 text-left text-xs text-[var(--legal-accent)] transition hover:border-[var(--legal-accent-strong)] hover:bg-[var(--legal-accent-strong)]/20 disabled:opacity-50"
          onClick={() => onSelect(p)}
        >
          {p.length > 72 ? `${p.slice(0, 72)}…` : p}
        </button>
      ))}
    </div>
  );
}
