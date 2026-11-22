"use client";

import React from "react";
import { SitesShell } from "@/components/sites/shell/SitesShell";
import { panelEncendido } from "@/lib/sites/mode";

/** Fail-closed: sin NEXT_PUBLIC_SITES_PANEL="1" no se pinta nada ni se llama a la red. */
export default function MiWebLayout({ children }: { children: React.ReactNode }) {
  if (!panelEncendido()) return null;
  return <SitesShell>{children}</SitesShell>;
}
