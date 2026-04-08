"use client";

import { CreditApiError } from "@/lib/credit-api";
import { AlertTriangle } from "lucide-react";

export interface ValidationBannerProps {
  error: Error | CreditApiError | string | null;
  className?: string;
}

export function ValidationBanner({ error, className = "" }: ValidationBannerProps) {
  if (!error) return null;
  const message =
    typeof error === "string"
      ? error
      : error instanceof CreditApiError
        ? error.message
        : error.message;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ${className}`}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
      <p>{message}</p>
    </div>
  );
}
