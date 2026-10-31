"use client";

import { useEffect } from "react";
import { TOKENS_CONTABLE } from "@/components/contable/tokens-contable";

/**
 * `Modal` (forge) se monta en un portal bajo `body`, fuera del div del layout que lleva TOKENS_CONTABLE:
 * sin esto los diálogos de Contable salían sin fondo ni texto legible. Se fijan en `body` mientras
 * Contable está montado y se restauran al salir.
 */
export function ContableTokensPortal() {
  useEffect(() => {
    const body = document.body;
    const previos = new Map<string, string>();
    for (const [k, val] of Object.entries(TOKENS_CONTABLE)) {
      previos.set(k, body.style.getPropertyValue(k));
      body.style.setProperty(k, String(val));
    }
    return () => {
      previos.forEach((val, k) => (val ? body.style.setProperty(k, val) : body.style.removeProperty(k)));
    };
  }, []);
  return null;
}
