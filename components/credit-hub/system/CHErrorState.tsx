"use client";

import { AlertTriangle } from "lucide-react";
import { ForgeButton } from "../primitives/ForgeButton";
import { ForgeCard } from "../primitives/ForgeCard";

interface CHErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function CHErrorState({ title = "No se pudo cargar", message = "—", onRetry }: CHErrorStateProps) {
  return (
    <ForgeCard className="p-12 text-center">
      <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-forge-danger" />
      <h2 className="font-display text-xl font-semibold text-forge-text">{title}</h2>
      <p className="mt-2 text-forge-text-muted">{message}</p>
      {onRetry && (
        <ForgeButton className="mt-6" variant="secondary" onClick={onRetry}>
          Reintentar
        </ForgeButton>
      )}
    </ForgeCard>
  );
}
