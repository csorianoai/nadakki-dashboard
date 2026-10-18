"use client";

import { AltaAsistente } from "@/components/realtor/AltaAsistente";
import { useRealtorAccessInfo } from "@/components/realtor/useRealtorAccess";

export default function AltaPage() {
  const { state, demoActive } = useRealtorAccessInfo();
  // Fail-closed: la demo solo la decide /acceso (tenant demo + ALLOW_DEMO), nunca el entorno solo.
  if (state === "comprobando") return null;
  return <AltaAsistente demo={demoActive} />;
}
