"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function PremiumEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent px-8 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.12),_transparent_65%)]" />
      <div className="relative mx-auto max-w-md space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30">
          <Icon className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={ctaHref}
            className="inline-flex min-w-[200px] items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500"
          >
            {ctaLabel}
          </Link>
          {secondaryLabel && secondaryHref ? (
            <Link
              href={secondaryHref}
              className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
