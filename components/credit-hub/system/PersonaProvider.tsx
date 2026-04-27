"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ForgePersona } from "@/lib/credit-hub/design/persona";

const PersonaContext = createContext<ForgePersona>("dealer");

export function PersonaProvider({ persona, children }: { persona: ForgePersona; children: ReactNode }) {
  return <PersonaContext.Provider value={persona}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  return useContext(PersonaContext);
}
