"use client";

import React, { createContext, useContext } from "react";
import type { Lang } from "@/lib/sites/copy-util";
import type { Site } from "@/lib/sites/types";

export type ShellState = "checking" | "ready" | "forbidden" | "unavailable" | "empty";

export interface SitesCtx {
  state: ShellState;
  /** true = los sitios son mocks (siempre con badge DEMO). */
  demo: boolean;
  sites: Site[];
  lang: Lang;
  /** Id pedido en ?sitio= (nunca tenant_id); null = el primero de la lista. */
  selectedId: string | null;
  setSelectedId: (id: string) => void;
}

export const SitesContext = createContext<SitesCtx | null>(null);

export function useSites(): SitesCtx {
  const c = useContext(SitesContext);
  if (!c) throw new Error("useSites fuera de SitesShell");
  return c;
}
