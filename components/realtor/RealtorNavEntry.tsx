"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtorAccess } from "./useRealtorAccess";

/** Entrada "Real Estate" del menú lateral: solo con 200 de /acceso; en cualquier otro caso no se pinta. */
export function RealtorNavEntry({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const access = useRealtorAccess();
  const pathname = usePathname();
  if (access !== "ok") return null;
  const active = pathname === "/realtor" || Boolean(pathname?.startsWith("/realtor/"));
  return (
    <Link
      href="/realtor"
      onClick={onNavigate}
      title={collapsed ? "Real Estate" : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-8 items-center gap-2 rounded-md py-1.5 text-xs transition-colors duration-150",
        collapsed ? "justify-center px-2" : "pl-6 pr-3",
        active
          ? "border-l-2 border-violet-500 bg-violet-500/5 text-violet-300"
          : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
      )}
    >
      <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {collapsed ? <span className="sr-only">Real Estate</span> : <span className="min-w-0 flex-1 truncate">Real Estate</span>}
    </Link>
  );
}
