import { cn } from "@/lib/utils";

interface ForgeProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function ForgeProgress({ value, max = 100, label, className }: ForgeProgressProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      {label && <div className="text-sm text-forge-text-muted">{label}</div>}
      <div className="h-2 overflow-hidden rounded-full bg-forge-surface-elevated">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forge-primary to-forge-accent"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
