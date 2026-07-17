"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceOverlay } from "@/components/voice/VoiceOverlayContext";
import { cn } from "@/lib/utils";

export function VoiceMicButton({
  className,
  label = "Búsqueda por voz",
}: {
  className?: string;
  label?: string;
}) {
  const { open } = useVoiceOverlay();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("min-h-11 min-w-11 shrink-0", className)}
      aria-label={label}
      onClick={open}
    >
      <Mic className="h-5 w-5" aria-hidden />
    </Button>
  );
}
