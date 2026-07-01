"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MonetizacionShell } from "@/components/credit-hub/monetizacion/shell";
import { monetizacionPageTitle } from "@/lib/credit-hub/monetizacion/routes";

function MonetizacionLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = monetizacionPageTitle(pathname);

  return <MonetizacionShell pageTitle={pageTitle}>{children}</MonetizacionShell>;
}

export function MonetizacionLayoutClient({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MonetizacionLayoutInner>{children}</MonetizacionLayoutInner>
    </Suspense>
  );
}
