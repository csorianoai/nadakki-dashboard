"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function VehicleChatButton({
  expanded,
  onClick,
  vehicleLabel,
}: {
  expanded: boolean;
  onClick: () => void;
  vehicleLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Chatea con AI del ${vehicleLabel}`}
      aria-expanded={expanded}
      className={cn(
        "group fixed bottom-6 right-6 z-[56] flex items-center overflow-hidden rounded-full bg-gradient-to-r from-brand-2 to-brand shadow-nk-lg transition-all duration-300",
        expanded ? "h-14 w-14 justify-center" : "h-[60px] min-w-[60px] animate-nkPulse px-0 hover:pr-5",
      )}
    >
      <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center">
        <MessageSquare className="h-6 w-6 text-white" />
        <span className="absolute -right-0.5 -top-0.5 rounded-full bg-white px-1 text-[9px] font-black text-brand-2">
          AI
        </span>
      </span>
      {!expanded ? (
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold text-white transition-all duration-300 group-hover:max-w-[140px] group-hover:pl-1">
          Chatea con AI
        </span>
      ) : null}
    </button>
  );
}
