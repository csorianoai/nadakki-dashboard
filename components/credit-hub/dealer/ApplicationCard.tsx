"use client";

import { motion } from "@/lib/motion-stub";
import { useRouter } from "next/navigation";
import { ArrowRight, Car, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { forgeDealerApplicationDetailHref } from "@/lib/credit-hub/dealerRoutes";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { formatTimeAgo } from "@/lib/utils/formatTimestamp";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

function getAvatarColors(name: string): { bg: string; text: string } {
  const colors = [
    { bg: "from-orange-500 to-amber-500", text: "text-white" },
    { bg: "from-blue-500 to-cyan-500", text: "text-white" },
    { bg: "from-purple-500 to-pink-500", text: "text-white" },
    { bg: "from-green-500 to-emerald-500", text: "text-white" },
    { bg: "from-rose-500 to-red-500", text: "text-white" },
    { bg: "from-indigo-500 to-violet-500", text: "text-white" },
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function statusBarClass(status: string): string {
  return (
    {
      draft: "bg-slate-400",
      submitted: "bg-forge-warning",
      routed: "bg-forge-info",
      offered: "bg-forge-success",
      accepted: "bg-forge-success",
      rejected: "bg-forge-danger",
      funded: "bg-forge-success",
      cancelled: "bg-slate-400",
      under_review: "bg-forge-info",
      approved: "bg-forge-success",
      declined: "bg-forge-danger",
      conditioned: "bg-forge-warning",
    }[status] || "bg-slate-400"
  );
}

interface ApplicationCardProps {
  application: CreditApplication;
  variant?: "card" | "compact";
  className?: string;
}

export function ApplicationCard({ application, variant = "card", className }: ApplicationCardProps) {
  const router = useRouter();
  const avatarColors = getAvatarColors(application.applicant_name);
  const initials = getInitials(application.applicant_name);
  const statusColor = statusBarClass(application.status);
  const vehicleInfo =
    [application.vehicle_year, application.vehicle_make, application.vehicle_model].filter(Boolean).join(" ") || "Sin vehículo";
  // FE-MONTO M1: Pass null to formatter when absent, don't invent 0
  const requestedAmount = application.requested_amount ? Number(application.requested_amount) : null;

  const handleClick = () => {
    router.push(forgeDealerApplicationDetailHref(application.application_id));
  };

  if (variant === "compact") {
    return (
      <motion.div
        role="button"
        tabIndex={0}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") handleClick();
        }}
        className={cn(
          "group flex items-center gap-4 rounded-xl bg-forge-surface p-4",
          "border border-forge-border hover:border-forge-border-hover",
          "cursor-pointer transition-all",
          className
        )}
      >
        <div data-testid="application-status-bar" className={cn("h-12 w-1 rounded-full", statusColor)} />
        <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold", avatarColors.bg, avatarColors.text)}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-forge-text">{application.applicant_name}</p>
          <p className="truncate text-sm text-forge-text-muted">{vehicleInfo}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-mono font-medium text-forge-text">
            {requestedAmount !== null ? `RD$ ${requestedAmount.toLocaleString("es-DO")}` : "No informado"}
          </p>
          <p className="text-xs text-forge-text-muted">{formatTimeAgo(application.created_at)}</p>
        </div>
        <ApplicationStatusBadge status={application.status} />
        <ArrowRight className="h-5 w-5 text-forge-text-muted transition-colors group-hover:text-forge-primary" />
      </motion.div>
    );
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") handleClick();
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl bg-forge-surface",
        "border border-forge-border hover:border-forge-border-hover hover:shadow-xl hover:shadow-forge-primary/5",
        "transition-all duration-200",
        className
      )}
    >
      <div data-testid="application-status-bar" className={cn("absolute bottom-0 left-0 top-0 w-1.5", statusColor)} />

      <div className="p-5 pl-7">
        <div className="mb-4 flex items-start gap-4">
          <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-semibold", avatarColors.bg, avatarColors.text)}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-semibold text-forge-text">{application.applicant_name}</h3>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-forge-text-muted">
              <Car className="h-3.5 w-3.5" />
              {vehicleInfo}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="mb-0.5 text-xs text-forge-text-muted">Monto solicitado</p>
            <p className="font-mono text-2xl font-bold text-forge-text">
              {requestedAmount !== null ? `RD$ ${requestedAmount.toLocaleString("es-DO")}` : "No informado"}
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-xs text-forge-text-muted">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(application.created_at)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
