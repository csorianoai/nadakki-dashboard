"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; bg: string; text: string; pulse?: boolean }> = {
  draft: { label: "Borrador", bg: "bg-slate-500/10", text: "text-slate-400" },
  submitted: { label: "Enviada", bg: "bg-forge-warning/10", text: "text-forge-warning", pulse: true },
  processing: { label: "Procesando", bg: "bg-forge-info/10", text: "text-forge-info", pulse: true },
  processed: { label: "Procesada", bg: "bg-forge-info/10", text: "text-forge-info" },
  routed: { label: "Enrutada", bg: "bg-forge-info/10", text: "text-forge-info" },
  offered: { label: "Ofertada", bg: "bg-forge-success/10", text: "text-forge-success" },
  accepted: { label: "Aceptada", bg: "bg-forge-success/10", text: "text-forge-success" },
  rejected: { label: "Rechazada", bg: "bg-forge-danger/10", text: "text-forge-danger" },
  funded: { label: "Desembolsada", bg: "bg-forge-success/10", text: "text-forge-success" },
  cancelled: { label: "Cancelada", bg: "bg-slate-500/10", text: "text-slate-400" },
  under_review: { label: "En revisión", bg: "bg-forge-info/10", text: "text-forge-info" },
  approved: { label: "Aprobada", bg: "bg-forge-success/10", text: "text-forge-success" },
  declined: { label: "Rechazada", bg: "bg-forge-danger/10", text: "text-forge-danger" },
  conditioned: { label: "Condicionada", bg: "bg-forge-warning/10", text: "text-forge-warning" },
};

interface ApplicationStatusBadgeProps {
  status: string;
  className?: string;
}

export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.bg, config.text, className)}>
      {config.pulse && (
        <motion.span
          data-testid="status-pulse"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-1.5 w-1.5 rounded-full bg-current"
        />
      )}
      {config.label}
    </span>
  );
}
