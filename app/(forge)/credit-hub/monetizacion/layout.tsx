import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";
import { MonetizacionLayoutClient } from "./MonetizacionLayoutClient";

export default function MonetizacionLayout({ children }: { children: ReactNode }) {
  if (!isForgeMonetizacionEnabled()) {
    notFound();
  }

  return <MonetizacionLayoutClient>{children}</MonetizacionLayoutClient>;
}
