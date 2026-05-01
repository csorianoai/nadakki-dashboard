"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TopbarProps {
  title: string;
  /** Optional row above title (e.g. breadcrumbs). */
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Topbar({ title, leading, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-forgeInk-200 bg-forgeSurface-card px-4 py-3",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {leading ? <div className="mb-1">{leading}</div> : null}
        <h1 className="truncate font-display text-forge-md font-semibold text-forgeInk-800">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
