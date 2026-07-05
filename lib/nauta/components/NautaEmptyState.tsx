"use client";

import { Bot, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type NautaEmptyStateProps = {
  variant?: "empty" | "error" | "placeholder";
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

function EmptyIllustration({ variant }: { variant: "empty" | "error" | "placeholder" }) {
  const accent =
    variant === "error" ? "text-red-400" : variant === "placeholder" ? "text-cyan-400" : "text-violet-400";
  return (
    <div
      className={cn(
        "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80",
        accent,
      )}
      aria-hidden
    >
      <Bot className="h-10 w-10 opacity-80" />
    </div>
  );
}

export function NautaEmptyState({
  variant = "empty",
  title,
  description,
  onRetry,
  className,
}: NautaEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-zinc-700/60 bg-zinc-900/30 px-6 py-12 text-center",
        className,
      )}
    >
      <EmptyIllustration variant={variant} />
      <p className="text-base font-medium text-zinc-200">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">{description}</p> : null}
      {variant === "error" && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-750"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
