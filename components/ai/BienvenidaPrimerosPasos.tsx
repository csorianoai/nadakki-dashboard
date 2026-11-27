"use client";

/** Bienvenida de primeros pasos del concesionario: la tarjeta generica del motor de onboarding con core="autos". */
import { BienvenidaPrimerosPasos as Tarjeta } from "@/components/ai/onboarding/BienvenidaPrimerosPasos";

export { LISTO_VISIBLE_MS } from "@/components/ai/onboarding/BienvenidaPrimerosPasos";

export function BienvenidaPrimerosPasos() {
  return <Tarjeta core="autos" />;
}
