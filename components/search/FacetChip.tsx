import { cn } from "@/lib/utils";

export function FacetChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
        active
          ? "border-brand bg-brand-soft text-brand"
          : "border-nk-border bg-nk-surface text-nk-fg-muted hover:border-brand/40",
      )}
    >
      {label}
    </button>
  );
}
