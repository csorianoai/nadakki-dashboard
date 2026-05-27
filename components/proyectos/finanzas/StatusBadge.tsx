import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusTone = "amber" | "green" | "red" | "orange" | "gray" | "blue";

const TONE_CLASS: Record<StatusTone, string> = {
  amber: "border-amber-500/40 bg-amber-500/15 text-amber-200",
  green: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  red: "border-rose-500/40 bg-rose-500/15 text-rose-200",
  orange: "border-orange-500/40 bg-orange-500/15 text-orange-200",
  gray: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300 line-through",
  blue: "border-sky-500/40 bg-sky-500/15 text-sky-200",
};

const STATUS_TONE: Record<string, StatusTone> = {
  draft: "amber",
  received: "amber",
  pending: "amber",
  open: "amber",
  needs_pm_review: "orange",
  approved: "green",
  paid: "green",
  issued: "green",
  accepted: "green",
  converted_to_po: "blue",
  rejected: "red",
  cancelled: "red",
  reversed: "gray",
  closed: "gray",
  partial: "orange",
  unpaid: "amber",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  received: "Recibida",
  pending: "Pendiente",
  open: "Abierto",
  needs_pm_review: "Revisión PM",
  approved: "Aprobada",
  paid: "Pagado",
  issued: "Emitida",
  accepted: "Aceptada",
  converted_to_po: "Convertida a OC",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  reversed: "Revertido",
  closed: "Cerrada",
  partial: "Parcial",
  unpaid: "Sin pagar",
};

function resolveTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? "amber";
}

export function FinanzasStatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = resolveTone(status);
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TONE_CLASS[tone],
        className,
      )}
    >
      {tone === "orange" ? <AlertTriangle className="h-3 w-3" aria-hidden /> : null}
      {label}
    </span>
  );
}
