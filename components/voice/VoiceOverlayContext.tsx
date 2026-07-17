"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type VoiceOverlayContextValue = {
  isOpen: boolean;
  transcription: string;
  setTranscription: (value: string) => void;
  open: () => void;
  close: () => void;
};

const VoiceOverlayContext = createContext<VoiceOverlayContextValue | null>(null);

export function VoiceOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcription, setTranscription] = useState("");

  const open = useCallback(() => {
    setTranscription("");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTranscription("");
  }, []);

  const value = useMemo(
    () => ({ isOpen, transcription, setTranscription, open, close }),
    [isOpen, transcription, open, close],
  );

  return (
    <VoiceOverlayContext.Provider value={value}>{children}</VoiceOverlayContext.Provider>
  );
}

export function useVoiceOverlay() {
  const ctx = useContext(VoiceOverlayContext);
  if (!ctx) throw new Error("useVoiceOverlay must be used within VoiceOverlayProvider");
  return ctx;
}
