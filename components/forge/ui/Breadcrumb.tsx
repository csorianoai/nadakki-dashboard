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
    <nav aria-label="Breadcrumb" className={cn("text-forge-sm text-forgeInk-600", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`bc-${i}`} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="h-4 w-4 shrink-0 text-forgeInk-400" aria-hidden /> : null}
              {last || !item.href ? (
                <span className={cn(last && "font-medium text-forgeInk-800")} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="text-forgeBrand-600 hover:text-forgeBrand-700 hover:underline">
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
