"use client";

import { useEffect, useState } from "react";
import { fetchPanelAccessStatus, type AccessStatus } from "@/lib/realtor/access";
import { isPanelFlagOn } from "@/lib/realtor/config";

export type RealtorAccessState = "apagado" | "comprobando" | AccessStatus;

/** Interruptor del entorno + puerta del backend. Con el interruptor apagado no se pregunta al backend. */
export function useRealtorAccess(): RealtorAccessState {
  const flagOn = isPanelFlagOn();
  const [state, setState] = useState<RealtorAccessState>(flagOn ? "comprobando" : "apagado");

  useEffect(() => {
    if (!flagOn) return;
    let alive = true;
    fetchPanelAccessStatus().then((s) => { if (alive) setState(s); });
    return () => { alive = false; };
  }, [flagOn]);

  return state;
}
