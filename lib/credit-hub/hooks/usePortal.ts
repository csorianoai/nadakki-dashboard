"use client";

import { usePathname } from "next/navigation";
import type { CHActorRole } from "../api/client";

export type CHPortal = CHActorRole;

export function portalFromPathname(pathname: string | null): CHPortal | null {
  if (pathname?.startsWith("/credit-hub/dealer")) return "dealer";
  if (pathname?.startsWith("/credit-hub/bank")) return "bank";
  if (pathname?.startsWith("/credit-hub/customer")) return "customer";
  if (pathname?.startsWith("/credit-hub/admin")) return "admin";
  return null;
}

export function usePortal(): { portal: CHPortal | null } {
  const pathname = usePathname();
  return { portal: portalFromPathname(pathname) };
}
