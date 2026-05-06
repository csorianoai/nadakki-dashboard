"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LegalCasesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onCases = pathname.startsWith("/legal/cases");
  return (
    <>
      <nav className="mb-6 flex gap-4 border-b border-forgeInk-200 pb-2" aria-label="Modo Legal">
        <Link
          href="/legal"
          className={cn(
            "pb-2 text-sm font-medium",
            !onCases ? "border-b-2 border-forgeBrand-600 text-forgeBrand-700" : "text-forgeInk-500 hover:text-forgeInk-800"
          )}
        >
          Tareas
        </Link>
        <Link
          href="/legal/cases"
          className={cn(
            "pb-2 text-sm font-medium",
            onCases ? "border-b-2 border-forgeBrand-600 text-forgeBrand-700" : "text-forgeInk-500 hover:text-forgeInk-800"
          )}
        >
          Expedientes
        </Link>
      </nav>
      {children}
    </>
  );
}
