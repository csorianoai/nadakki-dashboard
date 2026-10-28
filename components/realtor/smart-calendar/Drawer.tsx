"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { FONT_BODY, FONT_DISPLAY, RT } from "@/lib/realtor/tokens";

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Panel lateral modal del centro (role=dialog, aria-modal, aria-labelledby). Al abrir lleva el foco al primer campo;
 * Tab no sale del panel; Escape, el botón Cerrar o el fondo lo cierran y el foco vuelve a `returnFocus` (o a lo que lo tenía).
 * Se pinta con position:fixed dentro del árbol que lo abre (sin portal): las pruebas y la tarjeta siguen conteniéndolo.
 */
export function Drawer({ title, subtitle, closeLabel, onClose, returnFocus, testId, children }: {
  title: string; subtitle?: string; closeLabel: string; onClose: () => void;
  returnFocus?: () => HTMLElement | null; testId?: string; children: ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const back = useRef(returnFocus);
  back.current = returnFocus;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const first = root?.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled])")
      ?? root?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus({ preventScroll: true });
    return () => {
      const target = back.current?.() ?? prev;
      if (target && target.isConnected) target.focus({ preventScroll: true });
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
    if (e.key !== "Tab" || !ref.current) return;
    const list = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <>
      <div aria-hidden="true" onMouseDown={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(19, 32, 43, 0.38)" }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} data-testid={testId} onKeyDown={onKeyDown}
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 61, width: "min(420px, 100vw)", boxSizing: "border-box",
          background: RT.white, color: RT.ink, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 400, textAlign: "left",
          borderLeft: `1px solid ${RT.line}`, boxShadow: "-12px 0 32px rgba(19, 32, 43, 0.18)",
          display: "flex", flexDirection: "column", gap: 16, padding: "22px 20px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 id={id} style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, lineHeight: 1.2 }}>{title}</h2>
            {subtitle ? <p style={{ margin: "6px 0 0", fontSize: 13, color: RT.muted, overflowWrap: "anywhere" }}>{subtitle}</p> : null}
          </div>
          <button type="button" aria-label={closeLabel} onClick={onClose}
            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, border: `1px solid ${RT.control}`, background: RT.white,
              color: RT.ink, cursor: "pointer", fontSize: 20, lineHeight: 1, fontFamily: "inherit" }}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
