"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { chPersonaEyebrow } from "@/lib/credit-hub/ch-base";
import type { ChTopbarProps } from "@/lib/credit-hub/ch-types";

export function ChTopbar({
  persona,
  tenantName,
  breadcrumbs = [],
  onSearchClick,
  userInitials = "NA",
  className,
}: ChTopbarProps) {
  return (
    <header
      className={cn("sticky top-0 z-30 flex items-center gap-4 border-b px-4 lg:px-6", className)}
      style={{
        minHeight: "var(--ch-topbar-h)",
        background: "var(--ch-surface)",
        borderColor: "var(--ch-line)",
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="ch-eyebrow">{chPersonaEyebrow(persona)}</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
          <h1 className="ch-serif truncate text-lg font-semibold" style={{ color: "var(--ch-ink)" }}>
            {tenantName}
          </h1>
          {breadcrumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-xs md:flex" style={{ color: "var(--ch-ink-3)" }}>
              {breadcrumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
                  {i > 0 ? <span aria-hidden>/</span> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:underline focus-visible:outline focus-visible:outline-2">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--ch-r)] border focus-visible:outline focus-visible:outline-2"
          style={{ borderColor: "var(--ch-line-2)", color: "var(--ch-ink-2)" }}
          aria-label="Buscar"
          onClick={onSearchClick}
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--ch-r)] border focus-visible:outline focus-visible:outline-2"
          style={{ borderColor: "var(--ch-line-2)", color: "var(--ch-ink-2)" }}
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" aria-hidden />
        </button>
        <div
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "var(--ch-persona-primary-soft)", color: "var(--ch-persona-primary)" }}
          aria-label="Usuario"
          role="img"
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
}
