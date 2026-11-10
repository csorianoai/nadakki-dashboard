"use client";

import { useEffect, useState } from "react";

export const CONSULTA_MOVIL = "(max-width: 639px)";

/**
 * true cuando el viewport es < 640 px. Sin matchMedia (SSR, jsdom) devuelve false: escritorio por defecto,
 * y el primer render coincide con el del servidor (se corrige en el efecto).
 */
export function useEsMovil(consulta: string = CONSULTA_MOVIL): boolean {
  const [movil, setMovil] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(consulta);
    const aplicar = () => setMovil(mql.matches);
    aplicar();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", aplicar);
      return () => mql.removeEventListener("change", aplicar);
    }
    mql.addListener?.(aplicar);
    return () => mql.removeListener?.(aplicar);
  }, [consulta]);
  return movil;
}
