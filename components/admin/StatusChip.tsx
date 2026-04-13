import { normalizeReadinessStatus, type NormalizedStatus } from "@/lib/adminContracts";

type StatusChipProps = {
  status: unknown;
  size?: "sm" | "md";
  className?: string;
};

function toneClasses(status: NormalizedStatus): string {
  if (status === "READY") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "PARTIAL") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-rose-500/30 bg-rose-500/10 text-rose-200";
}

export default function StatusChip({ status, size = "md", className = "" }: StatusChipProps) {
  const normalized = normalizeReadinessStatus(status);
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center rounded-md border font-semibold ${toneClasses(normalized)} ${sizeClasses} ${className}`}>
      {normalized}
    </span>
  );
}
