"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MonetizacionShell } from "@/components/credit-hub/monetizacion/shell";
import { monetizacionPageTitle } from "@/lib/credit-hub/monetizacion/routes";

export function MonetizacionLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = monetizacionPageTitle(pathname);

  return <MonetizacionShell pageTitle={pageTitle}>{children}</MonetizacionShell>;
}
