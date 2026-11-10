"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Ancho real del contenedor para que el SVG se dibuje a su tamano y el texto conserve su tamano en pixeles.
 * Sin ResizeObserver o sin layout (SSR, jsdom) devuelve `inicial`, que tambien permite fijar el ancho en el harness de capturas.
 */
export function useAncho(ref: RefObject<HTMLElement | null>, inicial: number): number {
  const [ancho, setAncho] = useState(inicial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setAncho(w);
    };
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return ancho;
}
