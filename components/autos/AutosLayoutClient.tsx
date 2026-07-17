"use client";

import dynamic from "next/dynamic";
import { VoiceOverlayProvider } from "@/components/voice/VoiceOverlayContext";

const ConciergeHost = dynamic(
  () => import("@/components/concierge/ConciergeSheet").then((m) => m.ConciergeHost),
  { ssr: false },
);

const VoiceOverlay = dynamic(
  () => import("@/components/voice/VoiceOverlay").then((m) => m.VoiceOverlay),
  { ssr: false },
);

export function AutosLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <VoiceOverlayProvider>
      {children}
      <ConciergeHost />
      <VoiceOverlay />
    </VoiceOverlayProvider>
  );
}
