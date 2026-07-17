"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-nk-border px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 font-manrope text-sm font-bold text-white">
            N
          </div>
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-nk-surface bg-nk-success"
            title="En línea"
          />
        </div>
        <div>
          <h2 className="font-manrope text-base font-bold text-nk-fg">Concierge Nadakki</h2>
          <p className="text-xs text-nk-fg-muted">Chat en español dominicano · en línea</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="shrink-0"
        aria-label="Cerrar chat"
      >
        <X className="h-5 w-5" />
      </Button>
    </header>
  );
}
