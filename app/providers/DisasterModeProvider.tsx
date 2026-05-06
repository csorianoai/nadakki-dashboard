"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { useDisasterMode } from "@/hooks/legal/useDisasterMode";
import { CaseDisasterModeBanner } from "@/components/legal/cases/CaseDisasterModeBanner";
import type { DisasterLevel } from "@/lib/legal/cases/case-types";

const DisasterModeContext = createContext<{ level: DisasterLevel }>({ level: "NORMAL" });

export function DisasterModeProvider({ children }: { children: ReactNode }) {
  const { data } = useDisasterMode();
  const level = (data?.level ?? "NORMAL") as DisasterLevel;

  return (
    <DisasterModeContext.Provider value={{ level }}>
      {level !== "NORMAL" ? <CaseDisasterModeBanner level={level} /> : null}
      {children}
    </DisasterModeContext.Provider>
  );
}

export function useDisasterLevel(): DisasterLevel {
  return useContext(DisasterModeContext).level;
}
