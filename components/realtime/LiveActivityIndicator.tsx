"use client";

import { cn } from "@/lib/utils";

export type LiveActivityMode = "websocket" | "polling" | "offline" | "disabled";

export interface LiveActivityIndicatorProps {
  mode: LiveActivityMode;
  className?: string;
}

export function LiveActivityIndicator({ mode, className }: LiveActivityIndicatorProps) {
  const label =
    mode === "websocket"
      ? "Tiempo real (WebSocket)"
      : mode === "polling"
        ? "Actualización periódica"
        : mode === "disabled"
          ? "Tiempo real desactivado"
          : "Sin conexión en vivo";

  return (
    <div
      className={cn("inline-flex items-center gap-2 text-xs text-gray-400", className)}
      data-testid="live-activity-indicator"
      title={label}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          mode === "websocket" && "animate-pulse bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]",
          mode === "polling" && "bg-amber-400",
          mode === "offline" && "bg-red-400/80",
          mode === "disabled" && "bg-gray-600",
        )}
        aria-hidden
      />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
