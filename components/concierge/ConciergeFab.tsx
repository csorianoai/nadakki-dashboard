"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Abajo a la DERECHA, junto al lado por el que se abre la hoja del Concierge.
 * A la izquierda tapaba el pie de la barra lateral del panel del dealer
 * ("Cerrar sesión"), que es fija y ocupa esa esquina en escritorio.
 */
export function ConciergeFab({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-[55] inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-5 py-3 font-manrope text-sm font-bold text-white shadow-nk-lg animate-nkPulse",
      )}
      aria-label="Abrir Concierge AI"
    >
      <Sparkles className="h-5 w-5" aria-hidden />
      Concierge AI
    </button>
  );
}
