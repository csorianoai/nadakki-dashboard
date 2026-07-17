"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveButton({
  saved,
  onToggle,
  className,
}: {
  saved: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full border border-nk-border bg-nk-surface/95 shadow-nk-sm backdrop-blur-sm transition hover:scale-105",
        saved && "animate-nkPop",
        className,
      )}
      aria-label={saved ? "Quitar de guardados" : "Guardar vehículo"}
      aria-pressed={saved}
    >
      <Heart
        className="h-4 w-4"
        fill={saved ? "#EF4444" : "none"}
        stroke={saved ? "#EF4444" : "currentColor"}
      />
    </button>
  );
}
