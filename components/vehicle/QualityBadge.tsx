import { cn } from "@/lib/utils";

const LABELS = {
  excelente: "Excelente",
  justo: "Precio justo",
  sobre: "Sobre mercado",
} as const;

const STYLES = {
  excelente: "bg-nk-success-soft text-nk-success border-nk-success/20",
  justo: "bg-nk-warning-soft text-nk-warning border-nk-warning/25",
  sobre: "bg-nk-danger-soft text-nk-danger border-nk-danger/20",
} as const;

export function QualityBadge({
  status,
  className,
}: {
  status: keyof typeof LABELS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
