"use client";

type Props = {
  label: string;
  active: boolean;
  onToggle: () => void;
};

export function CoreChip({ label, active, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`fm-ui-core-chip${active ? " fm-ui-core-chip--on" : ""}`}
      onClick={onToggle}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
