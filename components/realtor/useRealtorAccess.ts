"use client";

import { useEffect, useState } from "react";
import { fetchPanelAccessInfo, type AccessStatus } from "@/lib/realtor/access";
import { isPanelFlagOn } from "@/lib/realtor/config";

export type RealtorAccessState = "apagado" | "comprobando" | AccessStatus;
export type RealtorAccessInfo = { state: RealtorAccessState; roles: readonly string[] };

/** Estado y roles de /acceso en una sola petición. Sin 200 o sin roles legibles, `roles` va vacío (fail-closed). */
export function useRealtorAccessInfo(): RealtorAccessInfo {
  const flagOn = isPanelFlagOn();
  const [info, setInfo] = useState<RealtorAccessInfo>({ state: flagOn ? "comprobando" : "apagado", roles: [] });

  useEffect(() => {
    if (!flagOn) return;
    let alive = true;
    fetchPanelAccessInfo().then((r) => { if (alive) setInfo({ state: r.status, roles: r.roles }); });
    return () => { alive = false; };
  }, [flagOn]);

  return info;
}

/** Interruptor del entorno + puerta del backend. Con el interruptor apagado no se pregunta al backend. */
export function useRealtorAccess(): RealtorAccessState {
  return useRealtorAccessInfo().state;
}
