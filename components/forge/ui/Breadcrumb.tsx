"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = { label: string; href?: string };

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-forge-sm text-forgeGray-600", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`bc-${i}`} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="h-4 w-4 shrink-0 text-forgeGray-400" aria-hidden /> : null}
              {last || !item.href ? (
                <span className={cn(last && "font-medium text-forgeGray-800")} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="rounded-forge-sm text-forgeBrand-600 outline-none transition-colors duration-[var(--forge-duration-fast)] ease-out hover:text-forgeBrand-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
